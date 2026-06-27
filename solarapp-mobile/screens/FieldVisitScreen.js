import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Modal } from 'react-native';
// FIX: Imported AsyncStorage cleanly to prevent the silent execution thread crash
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';

export default function FieldVisitScreen() {
    const [leadsList, setLeadsList] = useState([]);
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [purpose, setPurpose] = useState('');
    const [remarks, setRemarks] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    
    // Core check-in validation tracking state fields
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkingGuard, setCheckingGuard] = useState(true);

    // Dynamic App-Based Dialog Modal state definitions
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const triggerPopupNotification = (title, msg, success = false) => {
        setModalTitle(title);
        setModalMessage(msg);
        setIsSuccess(success);
        setModalVisible(true);
    };

    useEffect(() => {
        verifyAttendanceGuardOnLoad();
    }, []);

    const verifyAttendanceGuardOnLoad = async () => {
        setCheckingGuard(true);
        try {
            const checkedInStatus = await AsyncStorage.getItem('tracking_is_checked_in');
            if (checkedInStatus === 'true') {
                setIsCheckedIn(true);
                // Trigger operational processes only if shift terminal validation passes
                fetchTargetsFromRegistry();
                requestLiveGPSCoordinates();
            } else {
                setIsCheckedIn(false);
            }
        } catch (err) {
            console.log("Attendance storage check error:", err.message);
            setIsCheckedIn(false);
        } finally {
            setCheckingGuard(false);
        }
    };

    const fetchTargetsFromRegistry = async () => {
        setFetchingData(true);
        try {
            const response = await API.get('/leads/list');
            if (response.data && Array.isArray(response.data)) {
                setLeadsList(response.data);
            }
        } catch (err) {
            console.log("Loading sandbox backup entries:", err.message);
            setLeadsList([
                { id: 1, customerName: 'MOTHE RAJU', leadCode: 'L-100000' },
                { id: 2, customerName: 'SAGAR MOTHE', leadCode: 'L-100001' }
            ]);
        } finally {
            setFetchingData(false);
        }
    };

    const requestLiveGPSCoordinates = () => {
        if (Platform.OS === 'web' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude.toString());
                    setLongitude(position.coords.longitude.toString());
                },
                (error) => console.log("GPS Lock restricted:", error.message),
                { enableHighAccuracy: true, timeout: 15000 }
            );
        }
    };

    const handleLogVisitTransaction = async () => {
        try {
            // 1. ENFORCE ATTENDANCE GUARD CHECK FIRST AT THE ACTION MOMENT
            const checkedInStatus = await AsyncStorage.getItem('tracking_is_checked_in');
            if (checkedInStatus !== 'true') {
                triggerPopupNotification(
                    'Operation Blocked', 
                    'You must CHECK IN on the Home Dashboard before accessing customer territory tracking fields.', 
                    false
                );
                return;
            }

            // 2. FORM INTEGRITY ENFORCEMENT VALIDATIONS
            if (!selectedLeadId || !purpose) {
                triggerPopupNotification('Validation Error', 'Please complete all fields (Target Account and Purpose are mandatory).', false);
                return;
            }

            setLoading(true);

            // Fetch current accumulated mileage dynamically from background service state registers
            const liveTrackedKm = await AsyncStorage.getItem('tracking_accumulated_km') || "0.000";

            const payload = {
                leadId: parseInt(selectedLeadId),
                purpose,
                remarks: remarks || '',
                latitude: latitude || "0.0000",
                longitude: longitude || "0.0000",
                odometerKm: parseFloat(liveTrackedKm) // Automated KM transfer
            };

            console.log("Dispatching visit entry data packet:", payload);
            await API.post('/visits/log', payload);

            triggerPopupNotification(
                'Visit Registered Successfully', 
                'Your automated location and telemetry metrics were successfully saved to the live tracking ledger!', 
                true
            );
        } catch (error) {
            console.error("Submission Crash:", error);
            const errorMsg = error.response?.data?.message || error.message || 'Connection timeout.';
            triggerPopupNotification('Database Error', `Submission dropped: ${errorMsg}`, false);
        } finally {
            setLoading(false);
        }
    };

    const handleDismissAndClear = () => {
        setModalVisible(false);
        if (isSuccess) {
            setSelectedLeadId(''); 
            setPurpose(''); 
            setRemarks('');
            requestLiveGPSCoordinates();
        }
    };

    // Loader loop component placeholder during load checks
    if (checkingGuard) {
        return (
            <View style={styles.lockoutWrapper}>
                <ActivityIndicator size="large" color="#d97706" />
                <Text style={{ marginTop: 10, color: '#475569', fontSize: 13, fontWeight: '500' }}>Validating Shift Ledger Status...</Text>
            </View>
        );
    }

    // IF Attendance Check-In Status is Inactive: Render Lockout Terminal Box Layout
    if (!isCheckedIn) {
        return (
            <View style={styles.lockoutWrapper}>
                <View style={styles.lockoutCard}>
                    <Text style={{ fontSize: 44, marginBottom: 10 }}>🔒</Text>
                    <Text style={styles.lockoutTitle}>Shift Terminal Deactivated</Text>
                    <Text style={styles.lockoutMessage}>
                        You are currently not checked in. Automated kilometer tracking, mileage accumulation, and target territory visit logging tools are deactivated.
                    </Text>
                    <Text style={styles.lockoutSubText}>Please open the Home Dashboard page tab and check-in to access field features.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.outerWrapper}>
            {/* CENTERED APP-BASED MODAL NOTIFICATION DIALOG LAYER */}
            <Modal animationType="fade" transparent={true} visible={modalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.centerAlertCard}>
                        <View style={[styles.alertIconCircle, { backgroundColor: isSuccess ? '#e6f4ea' : '#fce8e6' }]}>
                            <Text style={styles.alertIconText}>{isSuccess ? '🚗' : '⚠️'}</Text>
                        </View>
                        <Text style={styles.alertTitle}>{modalTitle}</Text>
                        <Text style={styles.alertMessage}>{modalMessage}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: isSuccess ? '#d97706' : '#dc2626' }]} onPress={handleDismissAndClear}>
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.container} bounces={false}>
                <View style={styles.card}>
                    <Text style={styles.title}>🚗 Log Field Beat Visit Metrics</Text>

                    <Text style={styles.label}>Select Target Account {fetchingData && '(Loading...)'}</Text>
                    {Platform.OS === 'web' ? (
                        <select value={selectedLeadId} onChange={(e) => setSelectedLeadId(e.target.value)} style={styles.webSelectDropdown}>
                            <option value="">-- Click to bind location map target --</option>
                            {leadsList.map(lead => (
                                <option key={lead.id} value={lead.id}>{lead.leadCode ? `${lead.leadCode} - ` : ''}{lead.customerName}</option>
                            ))}
                        </select>
                    ) : (
                        <TextInput style={styles.input} placeholder="Associated Target Reference ID" value={selectedLeadId} onChangeText={setSelectedLeadId} />
                    )}

                    <Text style={styles.label}>Visit Purpose</Text>
                    <TextInput style={styles.input} placeholder="e.g., Technical Assessment, Document verification" value={purpose} onChangeText={setPurpose} />

                    <Text style={styles.label}>Execution Remarks (Optional)</Text>
                    <TextInput style={[styles.input, { height: 70 }]} multiline placeholder="State field notes..." value={remarks} onChangeText={setRemarks} />

                    <Text style={styles.label}>🛰️ Current Location Coordinates (Auto-Captured)</Text>
                    <View style={styles.geoRow}>
                        <TextInput style={[styles.input, styles.geoInput]} placeholder="Latitude" value={latitude} onChangeText={setLatitude} editable={false} />
                        <TextInput style={[styles.input, styles.geoInput]} placeholder="Longitude" value={longitude} onChangeText={setLongitude} editable={false} />
                    </View>

                    <TouchableOpacity style={styles.btn} onPress={handleLogVisitTransaction} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Commit Visit Logs</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: { flex: 1, backgroundColor: '#f3f4f6' },
    container: { padding: 20, flexGrow: 1, justifyContent: 'center' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 15, fontSize: 14, color: '#111827' },
    geoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 5 },
    geoInput: { flex: 1, marginBottom: 5, backgroundColor: '#f1f5f9' },
    btn: { backgroundColor: '#d97706', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    webSelectDropdown: { backgroundColor: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '15px', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none', color: '#111827' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    centerAlertCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: 340, borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, elevation: 15 },
    alertIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    alertIconText: { fontSize: 24 },
    alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, textAlign: 'center' },
    alertMessage: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
    alertBtn: { width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    alertBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },

    /* ATTENDANCE ENFORCEMENT LOCKOUT SCREEN LAYOUT */
    lockoutWrapper: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 24 },
    lockoutCard: { backgroundColor: '#ffffff', padding: 32, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', textAlign: 'center', maxWidth: 400, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
    lockoutTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, marginTop: 10 },
    lockoutMessage: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    lockoutSubText: { fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }
});