import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Modal, FlatList } from 'react-native';
import API from '../api';

export default function ExecutiveSupportScreen() {
    const [customerList, setCustomerList] = useState([]);
    const [selectedCustomerCode, setSelectedCustomerCode] = useState('');
    const [autoPincode, setAutoPincode] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [myTickets, setMyTickets] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);

    // Centered Custom App Dialog Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const triggerCenterPopup = (title, msg, success = false) => {
        setModalTitle(title);
        setModalMessage(msg);
        setIsSuccess(success);
        setModalVisible(true);
    };

    useEffect(() => {
        fetchApprovedCustomers();
        fetchLoggedTicketsTimeline();
    }, []);

    const fetchApprovedCustomers = async () => {
        setFetchingData(true);
        try {
            const response = await API.get('/leads/list');
            if (response.data && Array.isArray(response.data)) {
                // Filters to only show active customers who have gone through final back-office validation checks
                const convertedCustomers = response.data.filter(item => item.status === 'Converted' && item.customerCode);
                setCustomerList(convertedCustomers);
            }
        } catch (err) {
            console.log("Loading sandbox backup customer dataset registry cache...");
            setCustomerList([
                { id: 101, customerCode: 'SSS-200000', customerName: 'MOTHE RAJU', pincode: '506002' },
                { id: 102, customerCode: 'SSS-200001', customerName: 'SAGAR MOTHE', pincode: '500016' }
            ]);
        } finally {
            setFetchingData(false);
        }
    };

    const fetchLoggedTicketsTimeline = async () => {
        try {
            const response = await API.get('/services/tickets/my-raised');
            if (response.data && Array.isArray(response.data)) {
                setMyTickets(response.data);
            }
        } catch (err) {
            // Local fallback timeline array mock
            setMyTickets([
                { id: 9001, customerCode: 'SSS-200000', customerName: 'MOTHE RAJU', pincode: '506002', issueDescription: 'Inverter connection loss completely', status: 'Assigned', technicianName: 'Suresh Kumar Tech' },
                { id: 9002, customerCode: 'SSS-200001', customerName: 'SAGAR MOTHE', pincode: '500016', issueDescription: 'Generation dips during peak hours', status: 'Open', technicianName: 'Awaiting Tech Assignment' }
            ]);
        }
    };

    const handleCustomerSelection = (code) => {
        setSelectedCustomerCode(code);
        if (!code) {
            setAutoPincode('');
            return;
        }
        const targetCustomer = customerList.find(item => item.customerCode === code);
        if (targetCustomer) {
            setAutoPincode(targetCustomer.pincode);
        }
    };

    const handleRaiseTicket = async () => {
        if (!selectedCustomerCode || !issueDescription) {
            triggerCenterPopup('Validation Error', 'Please select a valid customer identity code and provide fault parameters.', false);
            return;
        }
        
        setLoading(true);
        try {
            const payload = {
                customerCode: selectedCustomerCode,
                pincode: autoPincode,
                issueDescription
            };

            await API.post('/services/ticket/raise', payload);
            
            triggerCenterPopup(
                'Ticket Dispatched', 
                `Maintenance incident ticket has been securely raised and routed directly to regional technicians mapped inside pincode area [${autoPincode}].`, 
                true
            );
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Help desk connection timeout.';
            triggerCenterPopup('Submission Error', `Failed to log support parameters: ${errorMsg}`, false);
        } finally {
            setLoading(false);
        }
    };

    const handleDismissAndRefresh = () => {
        setModalVisible(false);
        if (isSuccess) {
            setSelectedCustomerCode('');
            setAutoPincode('');
            setIssueDescription('');
            fetchLoggedTicketsTimeline();
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return { bg: '#e6f4ea', text: '#137333' };
            case 'Assigned': return { bg: '#e8f0fe', text: '#1a73e8' };
            case 'Open': default: return { bg: '#fef7e0', text: '#b06000' };
        }
    };

    return (
        <View style={styles.outerWrapper}>
            {/* CENTERED APP-BASED MODAL NOTIFICATION DIALOG LAYER */}
            <Modal animationType="fade" transparent={true} visible={modalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.centerAlertCard}>
                        <View style={[styles.alertIconCircle, { backgroundColor: isSuccess ? '#e6f4ea' : '#fce8e6' }]}>
                            <Text style={styles.alertIconText}>{isSuccess ? '🛠️' : '⚠️'}</Text>
                        </View>
                        <Text style={styles.alertTitle}>{modalTitle}</Text>
                        <Text style={styles.alertMessage}>{modalMessage}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#7c3aed' }]} onPress={handleDismissAndRefresh}>
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.container} bounces={false}>
                {/* Form Section Box */}
                <View style={styles.card}>
                    <Text style={styles.title}>🛠️ Launch Customer Maintenance Ticket</Text>
                    <Text style={styles.sub}>Dispatches notice directly to location-bound engineers.</Text>

                    <Text style={styles.label}>Select Converted Customer {fetchingData && '(Loading...)'}</Text>
                    {Platform.OS === 'web' ? (
                        <select 
                            value={selectedCustomerCode} 
                            onChange={(e) => handleCustomerSelection(e.target.value)} 
                            style={styles.webSelectDropdown}
                        >
                            <option value="">-- Click to choose customer identity code --</option>
                            {customerList.map(item => (
                                <option key={item.id} value={item.customerCode}>
                                    {item.customerCode} - {item.customerName}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <TextInput 
                            style={styles.input} 
                            placeholder="Enter Customer Master Code (e.g., SSS-200000)" 
                            value={selectedCustomerCode} 
                            onChangeText={handleCustomerSelection} 
                        />
                    )}

                    <Text style={styles.label}>Auto-Mapped Territory Pincode</Text>
                    <TextInput 
                        style={[styles.input, styles.disabledInput]} 
                        placeholder="Pincode bound automatically upon customer selection" 
                        value={autoPincode} 
                        editable={false} 
                    />

                    <Text style={styles.label}>Fault Diagnostic Parameters</Text>
                    <TextInput 
                        style={[styles.input, { height: 75, textAlignVertical: 'top' }]} 
                        placeholder="Describe breakdown details (e.g., Inverter connection loss, Generation dips)" 
                        multiline
                        value={issueDescription}
                        onChangeText={setIssueDescription}
                    />

                    <TouchableOpacity style={styles.btn} onPress={handleRaiseTicket} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Route Maintenance Incident</Text>}
                    </TouchableOpacity>
                </View>

                {/* History Status Timeline Tracker */}
                <Text style={styles.sectionHeader}>📋 Tracked Support Incident History Ledger</Text>
                {myTickets.length === 0 ? (
                    <Text style={styles.emptyText}>No emergency tickets logged from this device profile context.</Text>
                ) : (
                    myTickets.map(ticket => {
                        const colors = getStatusStyle(ticket.status);
                        return (
                            <View key={ticket.id} style={styles.ticketHistoryCard}>
                                <div style={styles.ticketRowHeader}>
                                    <div>
                                        <Text style={styles.ticketCustCode}>{ticket.customerCode}</Text>
                                        <Text style={styles.ticketCustName}>  •  {ticket.customerName || 'Account Link'}</Text>
                                    </div>
                                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                                        <Text style={[styles.statusBadgeText, { color: colors.text }]}>{ticket.status}</Text>
                                    </View>
                                </div>
                                <Text style={styles.ticketDescText}>📝 {ticket.issueDescription}</Text>
                                <View style={styles.technicianRow}>
                                    <Text style={styles.techText}>🔧 Assigned Tech: <Text style={{fontWeight: '700', color: '#1e293b'}}>{ticket.technicianName || 'Awaiting Allocation'}</Text></Text>
                                    <Text style={styles.pincodeTag}>📍 PIN {ticket.pincode}</Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: { flex: 1, backgroundColor: '#f3f4f6' },
    container: { padding: 16 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    sub: { fontSize: 12, color: '#6b7280', marginBottom: 20 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 15, fontSize: 14, color: '#111827' },
    disabledInput: { backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '500' },
    btn: { backgroundColor: '#7c3aed', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 5 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    webSelectDropdown: { backgroundColor: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '15px', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none', color: '#111827' },
    
    /* HISTORY SECTION LAYOUT STYLES */
    sectionHeader: { fontSize: 11, fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', marginBottom: 12, marginTop: 24, letterSpacing: 0.5 },
    ticketHistoryCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
    ticketRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    ticketCustCode: { fontSize: 13, fontWeight: 'bold', color: '#7c3aed' },
    ticketCustName: { fontSize: 13, fontWeight: '600', color: '#475569' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    statusBadgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    ticketDescText: { fontSize: 13, color: '#1e293b', marginBottom: 10, lineHeight: 18 },
    technicianRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8, alignItems: 'center' },
    techText: { fontSize: 11, color: '#64748b' },
    pincodeTag: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
    emptyText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginVertical: 15 },

    /* MODAL POPUP ALIGNMENT STYLES */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    centerAlertCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: 340, borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, elevation: 15 },
    alertIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    alertIconText: { fontSize: 24 },
    alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, textAlign: 'center' },
    alertMessage: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
    alertBtn: { width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    alertBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' }
});