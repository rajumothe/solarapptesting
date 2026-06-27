import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';

export default function LeadCreationScreen() {
    const [customerName, setCustomerName] = useState('');
    const [contactNo, setContactNo] = useState('');
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');
    const [unitCapacitySelection, setUnitCapacitySelection] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);
    
    // Core check-in state validation flag
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkingGuard, setCheckingGuard] = useState(true);

    // Database item groups management arrays state
    const [itemGroups, setItemGroups] = useState([]);
    const [fetchingGroups, setFetchingGroups] = useState(false);

    // Centered App Dialog Modal States
    const [customModalVisible, setCustomModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [isSuccessAction, setIsSuccessAction] = useState(false);

    const triggerCenterPopup = (title, msg, success = false) => {
        setModalTitle(title);
        setModalMessage(msg);
        setIsSuccessAction(success);
        setCustomModalVisible(true);
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
                // Trigger operational tracking feeds only if shift is verified active
                requestCurrentGPSLocation();
                fetchItemGroupsFromDB();
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

    const fetchItemGroupsFromDB = async () => {
        setFetchingGroups(true);
        try {
            const response = await API.get('/masters/groups'); 
            if (response.data && Array.isArray(response.data)) {
                setItemGroups(response.data);
            }
        } catch (err) {
            console.log("Fallback layout triggered:", err.message);
            setItemGroups([
                { id: 1, groupName: '13 KW SET1' },
                { id: 2, groupName: '3KW POEWR GRID' }
            ]);
        } finally {
            setFetchingGroups(false);
        }
    };

    const requestCurrentGPSLocation = () => {
        if (Platform.OS === 'web' && navigator.geolocation) {
            setFetchingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude.toString());
                    setLongitude(position.coords.longitude.toString());
                    setFetchingLocation(false);
                },
                (error) => {
                    console.log("GPS Location unavailable, typing manually:", error.message);
                    setFetchingLocation(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        }
    };

    const handleCreateLead = async () => {
        // ENFORCE ATTENDANCE GUARD CHECK AT ACTION SUBMISSION MOMENT
        const checkedInStatus = await AsyncStorage.getItem('tracking_is_checked_in');
        if (checkedInStatus !== 'true') {
            triggerCenterPopup(
                'Operation Rejected', 
                'Submission blocked. Lead creation and automated kilometer tracking require an active check-in session.', 
                false
            );
            return;
        }

        if (!customerName || !contactNo || !address || !pincode || !unitCapacitySelection) {
            triggerCenterPopup('Validation Error', 'Please complete all required fields.', false);
            return;
        }
        
        setLoading(true);
        try {
            const payload = {
                customerName,
                contactNo,
                address,
                pincode,
                unitCapacitySelection,
                latitude: latitude || "0.0000",
                longitude: longitude || "0.0000"
            };
            
            const response = await API.post('/leads/create', payload);
            const generatedCode = response.data?.lead?.leadCode || "Success";
            
            triggerCenterPopup(
                'Lead Saved Successfully', 
                `Pipeline Lead target tracking sequence has been captured under identification code:\n\n✨ ${generatedCode} ✨`, 
                true
            );
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Connection timeout.';
            triggerCenterPopup('Database Reject', `Submission failed: ${errorMsg}`, false);
        } finally {
            setLoading(false);
        }
    };

    const handleDismissModal = () => {
        setCustomModalVisible(false);
        if (isSuccessAction) {
            setCustomerName('');
            setContactNo('');
            setAddress('');
            setPincode('');
            setUnitCapacitySelection('');
            setLatitude('');
            setLongitude('');
            requestCurrentGPSLocation();
        }
    };

    // Loader loop placeholder during initial verification execution checks
    if (checkingGuard) {
        return (
            <View style={styles.lockoutWrapper}>
                <ActivityIndicator size="large" color="#d97706" />
                <Text style={{ marginTop: 10, color: '#475569', fontSize: 13, fontWeight: '500' }}>Validating Shift Ledger Status...</Text>
            </View>
        );
    }

    // IF ATtendance Check-In Status is Inactive: Render Lockout Overlay Terminal View
    if (!isCheckedIn) {
        return (
            <View style={styles.lockoutWrapper}>
                <View style={styles.lockoutCard}>
                    <Text style={{ fontSize: 44, marginBottom: 10 }}>🔒</Text>
                    <Text style={styles.lockoutTitle}>Shift Terminal Deactivated</Text>
                    <Text style={styles.lockoutMessage}>
                        You are currently not checked in. Automated kilometer tracking, mileage accumulation, and lead pipeline entry systems are locked.
                    </Text>
                    <Text style={styles.lockoutSubText}>Please open the Home Dashboard page tab and check-in to access field features.</Text>
                </View>
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
                            style={[styles.alertBtn, { backgroundColor: isSuccessAction ? '#059669' : '#dc2626' }]} 
                            onPress={handleDismissModal}
                        >
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.container} bounces={false}>
                <View style={styles.card}>
                    <Text style={styles.title}>👤 Capture Fresh Pipeline Target</Text>
                    
                    <Text style={styles.label}>Customer Name</Text>
                    <TextInput style={styles.input} placeholder="Customer Full Name" value={customerName} onChangeText={setCustomerName} />
                    
                    <Text style={styles.label}>Contact Number</Text>
                    <TextInput style={styles.input} placeholder="Contact Telephone Number" keyboardType="phone-pad" value={contactNo} onChangeText={setContactNo} />
                    
                    <Text style={styles.label}>Installation Address</Text>
                    <TextInput style={[styles.input, { height: 70 }]} multiline placeholder="Site Installation Address" value={address} onChangeText={setAddress} />
                    
                    <Text style={styles.label}>Territory Pincode</Text>
                    <TextInput style={styles.input} placeholder="Site Territory Pincode" keyboardType="number-pad" value={pincode} onChangeText={setPincode} />
                    
                    <Text style={styles.label}>⚡ System Capacity Selection {fetchingGroups && '(Loading...)'}</Text>
                    {Platform.OS === 'web' ? (
                        <select 
                            value={unitCapacitySelection}
                            onChange={(e) => setUnitCapacitySelection(e.target.value)}
                            style={styles.webSelectDropdown}
                        >
                            <option value="">-- Choose configuration from Group Master --</option>
                            {itemGroups.map(group => (
                                <option key={group.id} value={group.groupName}>
                                    {group.groupName}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <TextInput 
                            style={styles.input} 
                            placeholder="System Capacity (e.g., 13 KW SET1)" 
                            value={unitCapacitySelection} 
                            onChangeText={setUnitCapacitySelection} 
                        />
                    )}

                    <Text style={styles.label}>🛰️ Site Coordinates {fetchingLocation && '(Auto-Locking...)'}</Text>
                    <View style={styles.geoRow}>
                        <TextInput style={[styles.input, styles.geoInput]} placeholder="Latitude" value={latitude} onChangeText={setLatitude} />
                        <TextInput style={[styles.input, styles.geoInput]} placeholder="Longitude" value={longitude} onChangeText={setLongitude} />
                    </View>

                    <TouchableOpacity style={styles.btn} onPress={handleCreateLead} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ingest Lead Target</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: { flex: 1, backgroundColor: '#f3f4f6' },
    container: { padding: 20, flexGrow: 1, justifyContent: 'center' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 15, fontSize: 14, color: '#111827' },
    geoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 5 },
    geoInput: { flex: 1, marginBottom: 5 },
    btn: { backgroundColor: '#d97706', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    webSelectDropdown: {
        backgroundColor: '#ffffff',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        marginBottom: '15px',
        fontSize: '14px',
        fontFamily: 'sans-serif',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
        color: '#111827'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    centerAlertCard: {
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: 340,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 15
    },
    alertIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
    },
    alertIconText: { fontSize: 24 },
    alertTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 12,
        textAlign: 'center'
    },
    alertMessage: {
        fontSize: 13,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24
    },
    alertBtn: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    alertBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.5
    },

    /* ATTENDANCE ENFORCEMENT LOCKOUT SCREEN LAYOUT */
    lockoutWrapper: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 24 },
    lockoutCard: { backgroundColor: '#ffffff', padding: 32, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', textAlign: 'center', maxWidth: 400, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
    lockoutTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, marginTop: 10 },
    lockoutMessage: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    lockoutSubText: { fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }
});