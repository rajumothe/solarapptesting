import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';

export default function ExecutiveDashboard() {
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [syncingInitialState, setSyncingAttendance] = useState(true);
    const [runningKm, setRunningKm] = useState(0.000);
    const [activeTimeStr, setActiveTimeStr] = useState('00h 00m');
    
    // Centered App Dialog Modal States
    const [customModalVisible, setCustomModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [isSuccessAction, setIsSuccessAction] = useState(false);

    const lastCoordRef = useRef(null);
    const trackingTimerRef = useRef(null);
    const timeTrackerIntervalRef = useRef(null);

    const triggerCenterPopup = (title, msg, success = false) => {
        setModalTitle(title);
        setModalMessage(msg);
        setIsSuccessAction(success);
        setCustomModalVisible(true);
    };

    // Haversine Formulation helper to compute real distance between coordinates
    const calculateDistanceDelta = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth Radius in KM
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; 
    };

    useEffect(() => {
        syncTrackingStateOnLoad();
        return () => stopActiveBackgroundLoops();
    }, []);

    const syncTrackingStateOnLoad = async () => {
        setSyncingAttendance(true);
        try {
            // 1. Evaluate if state registers exist in device flash context
            const checkedInStatus = await AsyncStorage.getItem('tracking_is_checked_in');
            const cachedKm = await AsyncStorage.getItem('tracking_accumulated_km');
            const cachedLastCoord = await AsyncStorage.getItem('tracking_last_coordinate');

            if (checkedInStatus === 'true') {
                setIsCheckedIn(true);
                if (cachedKm) setRunningKm(parseFloat(cachedKm));
                if (cachedLastCoord) lastCoordRef.current = JSON.parse(cachedLastCoord);
                startBackgroundTrackingLoops();
                setSyncingAttendance(false);
            } else {
                // 2. FIX: If local values are cleared due to log out, query backend server state context directly!
                const response = await API.get('/auth/attendance/check-today').catch(() => null);
                
                if (response && response.data && response.data.hasCheckedIn === true) {
                    // Re-hydrate state registers to disk memory immediately
                    await AsyncStorage.setItem('tracking_is_checked_in', 'true');
                    
                    const distanceValue = response.data.accumulatedKm || "0.000";
                    await AsyncStorage.setItem('tracking_accumulated_km', parseFloat(distanceValue).toFixed(3));
                    setRunningKm(parseFloat(distanceValue));

                    const restoredCoords = { 
                        lat: parseFloat(response.data.latitude || "17.4583"), 
                        lon: parseFloat(response.data.longitude || "78.3988") 
                    };
                    lastCoordRef.current = restoredCoords;
                    await AsyncStorage.setItem('tracking_last_coordinate', JSON.stringify(restoredCoords));

                    // Use the entry created timestamp or fallback safely to a default start
                    const serverStartTime = response.data.createdAt || new Date().toISOString();
                    await AsyncStorage.setItem('tracking_start_time', serverStartTime);

                    setIsCheckedIn(true);
                    startBackgroundTrackingLoops();
                } else {
                    setIsCheckedIn(false);
                }
                setSyncingAttendance(false);
            }
        } catch (err) {
            console.log("Dashboard mount state check failed:", err.message);
            setSyncingAttendance(false);
        }
    };

    const startBackgroundTrackingLoops = async () => {
        // Stop any duplicate overlapping loops safely before spinning up a new tracking batch
        if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
        if (timeTrackerIntervalRef.current) clearInterval(timeTrackerIntervalRef.current);

        trackingTimerRef.current = setInterval(() => {
            if (Platform.OS === 'web' && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    const currentLat = pos.coords.latitude;
                    const currentLon = pos.coords.longitude;
                    
                    if (lastCoordRef.current) {
                        const delta = calculateDistanceDelta(
                            lastCoordRef.current.lat, lastCoordRef.current.lon,
                            currentLat, currentLon
                        );
                        
                        if (delta > 0.02) {
                            setRunningKm(prev => {
                                const updated = prev + delta;
                                AsyncStorage.setItem('tracking_accumulated_km', updated.toString());
                                return updated;
                            });
                        }
                    }

                    const coordObj = { lat: currentLat, lon: currentLon };
                    lastCoordRef.current = coordObj;
                    AsyncStorage.setItem('tracking_last_coordinate', JSON.stringify(coordObj));
                });
            }
        }, 60000);

        const checkInStartTime = await AsyncStorage.getItem('tracking_start_time') || new Date().toISOString();
        if (!await AsyncStorage.getItem('tracking_start_time')) {
            await AsyncStorage.setItem('tracking_start_time', checkInStartTime);
        }

        // Initialize time computation block immediately
        const runTimeCalc = () => {
            const diffMs = new Date() - new Date(checkInStartTime);
            const totalMin = Math.floor(diffMs / 1000 / 60);
            const hrs = Math.floor(totalMin / 60);
            const mins = totalMin % 60;
            setActiveTimeStr(`${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`);
        };
        runTimeCalc();

        timeTrackerIntervalRef.current = setInterval(runTimeCalc, 30000);
    };

    const stopActiveBackgroundLoops = () => {
        if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
        if (timeTrackerIntervalRef.current) clearInterval(timeTrackerIntervalRef.current);
    };

    const handleCheckInToggle = () => {
        if (Platform.OS === 'web' && navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    
                    await API.post('/hr/attendance/checkin', { latitude: lat, longitude: lon }); 
                    
                    await AsyncStorage.setItem('tracking_is_checked_in', 'true');
                    await AsyncStorage.setItem('tracking_accumulated_km', '0.000');
                    await AsyncStorage.setItem('tracking_start_time', new Date().toISOString());
                    
                    const currentCoords = { lat, lon };
                    lastCoordRef.current = currentCoords;
                    await AsyncStorage.setItem('tracking_last_coordinate', JSON.stringify(currentCoords));

                    setIsCheckedIn(true);
                    setRunningKm(0.000);
                    startBackgroundTrackingLoops();
                    
                    triggerCenterPopup('Check-In Successful', 'Shift initialized. Automated location and telemetry tracking is now active.', true);
                } catch (err) {
                    const errorResponse = err.response?.data?.message || err.message;
                    // Auto-sync protection: If backend states attendance was already taken, force sync locally
                    if (errorResponse.toLowerCase().includes("already") || err.response?.status === 400) {
                        await AsyncStorage.setItem('tracking_is_checked_in', 'true');
                        syncTrackingStateOnLoad();
                    } else {
                        triggerCenterPopup('Check-In Error', errorResponse, false);
                    }
                } finally {
                    setLoading(false);
                }
            }, (err) => {
                triggerCenterPopup('Permission Error', 'Location Access is Mandatory to Check-In.', false);
                setLoading(false);
            }, { enableHighAccuracy: true });
        }
    };

    const handleCheckOutToggle = () => {
        if (Platform.OS === 'web' && navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    
                    await API.post('/hr/attendance/checkout', {
                        latitude: lat,
                        longitude: lon,
                        accumulatedKm: runningKm.toFixed(3)
                    });

                    stopActiveBackgroundLoops();
                    await AsyncStorage.removeItem('tracking_is_checked_in');
                    await AsyncStorage.removeItem('tracking_accumulated_km');
                    await AsyncStorage.removeItem('tracking_start_time');
                    await AsyncStorage.removeItem('tracking_last_coordinate');

                    setIsCheckedIn(false);
                    lastCoordRef.current = null;
                    setRunningKm(0.000);
                    setActiveTimeStr('00h 00m');
                    
                    triggerCenterPopup('Check-Out Confirmed', 'Duty session concluded successfully. Today\'s travel metrics have been saved to logs.', true);
                } catch (err) {
                    triggerCenterPopup('Check-Out Error', err.response?.data?.message || err.message, false);
                } finally {
                    setLoading(false);
                }
            });
        }
    };

    if (syncingInitialState) {
        return (
            <View style={[styles.outerWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 12, color: '#475569', fontSize: 13, fontWeight: '500' }}>Verifying Shift Attendance Context...</Text>
            </View>
        );
    }

    return (
        <View style={styles.outerWrapper}>
            {/* CENTERED APP-BASED MODAL NOTIFICATION DIALOG LAYER */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={customModalVisible}
                onRequestClose={() => setCustomModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.centerAlertCard}>
                        <View style={[styles.alertIconCircle, { backgroundColor: isSuccessAction ? '#e6f4ea' : '#fce8e6' }]}>
                            <Text style={styles.alertIconText}>{isSuccessAction ? '🎉' : '⚠️'}</Text>
                        </View>
                        <Text style={styles.alertTitle}>{modalTitle}</Text>
                        <Text style={styles.alertMessage}>{modalMessage}</Text>
                        
                        <TouchableOpacity 
                            style={[styles.alertBtn, { backgroundColor: isSuccessAction ? '#2563eb' : '#dc2626' }]} 
                            onPress={() => setCustomModalVisible(false)}
                        >
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView style={styles.scrollWrapper} contentContainerStyle={styles.mainContainer} bounces={false}>
                {/* Live Automated Performance Telemetry Dashboard metrics */}
                <View style={styles.telemetryCard}>
                    <Text style={styles.telemetryHeader}>⚡ Shift Telemetry Live Tracker</Text>
                    <View style={styles.telemetryRow}>
                        <View style={styles.telemetryBlock}>
                            <Text style={styles.telemetryLabel}>AUTOMATED DISTANCE</Text>
                            <Text style={styles.telemetryValue}>{runningKm.toFixed(3)} <Text style={{fontSize: 14}}>KM</Text></Text>
                        </View>
                        <View style={styles.telemetryBlock}>
                            <Text style={styles.telemetryLabel}>ELAPSED TIME</Text>
                            <Text style={styles.telemetryValue}>{activeTimeStr}</Text>
                        </View>
                    </View>
                </View>

                {/* Attendance Toggle Control Center */}
                <View style={styles.attendanceCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.attendanceTitle}>Duty Gate Terminal</Text>
                        <Text style={[styles.statusIndicator, { color: isCheckedIn ? '#059669' : '#dc2626' }]}>
                            ● {isCheckedIn ? 'ACTIVE BACKGROUND POLLING' : 'SHIFT NOT ACTIVE'}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, { backgroundColor: isCheckedIn ? '#dc2626' : '#2563eb' }]} 
                        onPress={isCheckedIn ? handleCheckOutToggle : handleCheckInToggle}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isCheckedIn ? 'Check Out' : 'Check In'}</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: { flex: 1, backgroundColor: '#f8fafc' },
    scrollWrapper: { flex: 1 },
    mainContainer: { padding: 16 },
    telemetryCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
    telemetryHeader: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 15 },
    telemetryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    telemetryBlock: { flex: 1 },
    telemetryLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
    telemetryValue: { color: '#ffffff', fontSize: 26, fontWeight: 'bold', marginTop: 4 },
    attendanceCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    attendanceTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    statusIndicator: { fontSize: 11, fontWeight: 'bold', marginTop: 4 },
    toggleBtn: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 8 },
    btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    centerAlertCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: 340, borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 15 },
    alertIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    alertIconText: { fontSize: 24 },
    alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, textAlign: 'center' },
    alertMessage: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
    alertBtn: { width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    alertBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 }
});