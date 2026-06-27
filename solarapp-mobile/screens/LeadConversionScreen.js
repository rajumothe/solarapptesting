import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Modal } from 'react-native';
import API from '../api';

export default function LeadConversionScreen() {
    const [leadsList, setLeadsList] = useState([]);
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [selectedLeadDetails, setSelectedLeadDetails] = useState(null);
    const [fetchingLeads, setFetchingLeads] = useState(false);

    // Compliance Fields
    const [aadharNo, setAadharNo] = useState('');
    const [panNo, setPanNo] = useState('');
    const [ebBillNo, setEbBillNo] = useState('');
    const [bankAccountNo, setBankAccountNo] = useState('');
    const [loading, setLoading] = useState(false);

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
        fetchActiveLeadsPipeline();
    }, []);

    const fetchActiveLeadsPipeline = async () => {
        setFetchingLeads(true);
        try {
            const response = await API.get('/leads/list');
            if (response.data && Array.isArray(response.data)) {
                // FIX: Filters the list so ONLY fresh/open records ('Lead Created') are visible
                const openLeadsOnly = response.data.filter(lead => lead.status === 'Lead Created');
                setLeadsList(openLeadsOnly);
            }
        } catch (err) {
            console.log("Fallback array loaded due to sandbox offline execution state:", err.message);
            setLeadsList([
                { id: 1, leadCode: 'L-100000', customerName: 'MOTHE RAJU', contactNo: '9912689612', address: 'WARANGAL RS NAGAR', unitCapacitySelection: '3 KW SET1', status: 'Lead Created' }
            ]);
        } finally {
            setFetchingLeads(false);
        }
    };

    const handleLeadSelectionChange = (id) => {
        setSelectedLeadId(id);
        if (!id) {
            setSelectedLeadDetails(null);
            return;
        }
        const targetLead = leadsList.find(lead => lead.id.toString() === id.toString());
        setSelectedLeadDetails(targetLead || null);
    };

    const handleKYCSubmit = async () => {
        if (!selectedLeadId || !aadharNo || !panNo || !ebBillNo || !bankAccountNo) {
            triggerCenterPopup('Validation Error', 'All document compliance identity forms are mandatory.', false);
            return;
        }
        setLoading(true);
        try {
            await API.post('/leads/convert-kyc', {
                leadId: parseInt(selectedLeadId),
                aadharNo,
                panNo,
                ebBillNo,
                bankAccountNo
            });
            
            triggerCenterPopup(
                'KYC Filed Successfully', 
                `Compliance dossier folder for lead verification has been recorded securely and routed to management authorization loops!`, 
                true
            );
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Vault connection timeout.';
            triggerCenterPopup('Database Reject', `Submission failed: ${errorMsg}`, false);
        } finally {
            setLoading(false);
        }
    };

    const handleDismissModal = () => {
        setCustomModalVisible(false);
        if (isSuccessAction) {
            setSelectedLeadId('');
            setSelectedLeadDetails(null);
            setAadharNo('');
            setPanNo('');
            setEbBillNo('');
            setBankAccountNo('');
            fetchActiveLeadsPipeline();
        }
    };

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
                            style={[styles.alertBtn, { backgroundColor: isSuccessAction ? '#4f46e5' : '#dc2626' }]} 
                            onPress={handleDismissModal}
                        >
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.container} bounces={false}>
                <View style={styles.card}>
                    <Text style={styles.title}>📑 Customer KYC Compliance Form</Text>
                    
                    {/* Pipeline Selector Menu */}
                    <Text style={styles.label}>Select Open Pipeline Lead {fetchingLeads && '(Loading...)'}</Text>
                    {Platform.OS === 'web' ? (
                        <select 
                            value={selectedLeadId}
                            onChange={(e) => handleLeadSelectionChange(e.target.value)}
                            style={styles.webSelectDropdown}
                        >
                            <option value="">-- Choose active tracking sequence record --</option>
                            {leadsList.map(lead => (
                                <option key={lead.id} value={lead.id}>
                                    {lead.leadCode ? `${lead.leadCode} - ` : ''}{lead.customerName}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <TextInput 
                            style={styles.input} 
                            placeholder="Enter Associated Pipeline Lead Reference ID" 
                            value={selectedLeadId} 
                            onChangeText={(text) => handleLeadSelectionChange(text)} 
                        />
                    )}

                    {/* DYNAMIC RETRIEVED LEAD SUB-PANEL INFO BLOCK */}
                    {selectedLeadDetails && (
                        <View style={styles.infoPreviewBox}>
                            <Text style={styles.previewHeader}>Associated Lead Data Preview</Text>
                            <View style={styles.previewRow}><Text style={styles.previewLabel}>Target Name:</Text><Text style={styles.previewValue}>{selectedLeadDetails.customerName}</Text></View>
                            <View style={styles.previewRow}><Text style={styles.previewLabel}>Telephone:</Text><Text style={styles.previewValue}>{selectedLeadDetails.contactNo}</Text></View>
                            <View style={styles.previewRow}><Text style={styles.previewLabel}>Site Address:</Text><Text style={styles.previewValue}>{selectedLeadDetails.address}</Text></View>
                            <View style={[styles.previewRow, { borderBottomWidth: 0 }]}><Text style={styles.previewLabel}>System Grid:</Text><Text style={[styles.previewValue, { color: '#4f46e5', fontWeight: 'bold' }]}>{selectedLeadDetails.unitCapacitySelection}</Text></View>
                        </View>
                    )}

                    {/* Verification Compliance Inputs fields */}
                    <Text style={styles.label}>Identity Documentation Parameters</Text>
                    <TextInput style={styles.input} placeholder="Aadhar Identification Number" value={aadharNo} onChangeText={setAadharNo} />
                    <TextInput style={styles.input} placeholder="PAN Taxation Number" autoCapitalize="characters" value={panNo} onChangeText={setPanNo} />
                    <TextInput style={styles.input} placeholder="Electricity Utility Bill Receipt ID" value={ebBillNo} onChangeText={setEbBillNo} />
                    <TextInput style={styles.input} placeholder="Bank Account Number" keyboardType="numeric" value={bankAccountNo} onChangeText={setBankAccountNo} />

                    <TouchableOpacity style={styles.btn} onPress={handleKYCSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Documents for Vault</Text>}
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
    btn: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
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
    infoPreviewBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        marginBottom: 20
    },
    previewHeader: { fontSize: 12, fontWeight: 'bold', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 10 },
    previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    previewLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    previewValue: { fontSize: 12, color: '#0f172a', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 15 },
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
    }
});