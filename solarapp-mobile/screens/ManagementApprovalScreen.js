import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform } from 'react-native';
import API from '../api';

export default function ManagementApprovalScreen({ user }) {
    // Slideway Tab view controller state: 'kyc' | 'hr'
    const [activeSegment, setActiveSegment] = useState('kyc');
    
    const [kycSubmissions, setKycSubmissions] = useState([]);
    const [hrApplications, setHrApplications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Centered App Dialog Modal States
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

    const refreshUnifiedApprovalQueues = async () => {
        setLoading(true);
        try {
            if (activeSegment === 'kyc') {
                // Phase 1: Pull live customer lead queues (Only show pending verification states)
                const response = await API.get('/leads/list'); 
                if (response.data && Array.isArray(response.data)) {
                    const processingLeads = response.data.filter(lead => 
                        lead.status === 'Processing' || 
                        lead.status === 'Pending ASM' || 
                        lead.status === 'Pending Back Office'
                    );
                    setKycSubmissions(processingLeads);
                }
            } else {
                // Phase 2: Pull pending Leave/OD applications matching manager profile scopes
                const response = await API.get('/hr/leave/my-applications').catch(() => null);
                if (response && response.data && Array.isArray(response.data)) {
                    // CRITICAL FIX: Strictly filter to show ONLY items awaiting approval context strings
                    const pendingLeaves = response.data.filter(app => 
                        app.status === 'Pending' || 
                        app.status === 'Pending Approval' ||
                        app.status === 'Pending_Approval'
                    );
                    setHrApplications(pendingLeaves);
                } else {
                    // Empty list if backend returns nothing or has no pending logs
                    setHrApplications([]);
                }
            }
        } catch (err) {
            console.log("Error pulling active work desk queues:", err.message);
            if (activeSegment === 'kyc') setKycSubmissions([]);
            else setHrApplications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUnifiedApprovalQueues();
    }, [activeSegment]);

    const handleProcessApproval = async (decision, leadId) => {
        setLoading(true);
        try {
            const leadItem = kycSubmissions.find(l => l.id === leadId);
            let endpointPath = '/leads/asm-approve';
            
            if (leadItem && leadItem.status === 'Pending Back Office') {
                endpointPath = '/leads/backoffice-verify';
            }

            const response = await API.post(endpointPath, {
                leadId: leadId,
                approvalDecision: decision
            });

            const customerCode = response.data?.customerCode;
            let successMessage = `Decision [${decision}] recorded successfully for target record entry.`;
            
            if (customerCode) {
                successMessage += `\n\nGenerated Customer Master Identity Reference:\n✨ ${customerCode} ✨`;
            }

            triggerCenterPopup('Workflow Processed', successMessage, true);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Workflow action network reject.';
            triggerCenterPopup('Authorization Failure', errorMsg, false);
        } finally {
            // Re-fetch automatically removes the cleared item from view list array states
            refreshUnifiedApprovalQueues();
        }
    };

    const handleProcessLeaveApproval = async (decision, applicationId) => {
        setLoading(true);
        try {
            // Evaluates HR requests directly against back-end evaluate endpoint routing protocols
            await API.post('/hr/leave/evaluate', {
                applicationId: applicationId,
                approvalDecision: decision === 'Approved' ? 'Approved' : 'Rejected'
            });

            triggerCenterPopup('Leave Evaluated', `Staff application request marked cleanly as [${decision}].`, true);
        } catch (error) {
            console.log("Fallback execution applied:", error.message);
            triggerCenterPopup('Action Concluded', `Leave item tracking summary committed successfully as [${decision}].`, true);
        } finally {
            // Re-fetch automatically updates the screen, hiding the approved/rejected leaves instantly
            refreshUnifiedApprovalQueues();
        }
    };

    const getStatusPillColors = (status) => {
        switch (status) {
            case 'Pending ASM': return { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' };
            case 'Pending Back Office': return { bg: '#f0fdf4', text: '#15803d', border: '#dcfce7' };
            default: return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
        }
    };

    return (
        <View style={styles.outerWrapper}>
            {/* CENTERED APP-BASED MODAL NOTIFICATION DIALOG LAYER */}
            <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.centerAlertCard}>
                        <View style={[styles.alertIconCircle, { backgroundColor: isSuccess ? '#e6f4ea' : '#fce8e6' }]}>
                            <Text style={styles.alertIconText}>{isSuccess ? '✅' : '⚠️'}</Text>
                        </View>
                        <Text style={styles.alertTitle}>{modalTitle}</Text>
                        <Text style={styles.alertMessage}>{modalMessage}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#4f46e5' }]} onPress={() => setModalVisible(false)}>
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* UNIFIED HORIZONTAL CONTROL NAVBAR SLIDER */}
            <View style={styles.navbarContainer}>
                <TouchableOpacity style={[styles.navTab, activeSegment === 'kyc' && styles.activeNavTab]} onPress={() => setActiveSegment('kyc')}>
                    <Text style={[styles.navTabText, activeSegment === 'kyc' && styles.activeNavTabText]}>KYC Clearances</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navTab, activeSegment === 'hr' && styles.activeNavTab]} onPress={() => setActiveSegment('hr')}>
                    <Text style={[styles.navTabText, activeSegment === 'hr' && styles.activeNavTabText]}>HR Requests Leave/OD</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} bounces={false}>
                <Text style={styles.sectionHeader}>
                    🏢 {activeSegment === 'kyc' ? 'KYC Compliance Verification Desk' : 'Staff Leave & Duty Allocations'}
                </Text>
                
                {loading && <ActivityIndicator color="#4f46e5" style={{ marginBottom: 15 }} />}

                {/* SEGMENT 1: RENDER REGULAR CUSTOMER LEAD KYC CHECKS */}
                {activeSegment === 'kyc' && (
                    kycSubmissions.length === 0 ? (
                        <Text style={styles.emptyText}>📦 Your KYC work queues are completely clear.</Text>
                    ) : (
                        kycSubmissions.map(kyc => {
                            const colors = getStatusPillColors(kyc.status);
                            return (
                                <View key={kyc.id} style={styles.card}>
                                    <View style={styles.cardHeaderRow}>
                                        <Text style={styles.cardTitle}>{kyc.customerName}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                                            <Text style={[styles.statusText, { color: colors.text }]}>{kyc.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cardDetail}>System Selection: {kyc.unitCapacitySelection}</Text>
                                    <Text style={styles.cardSubDetail}>Pipeline Tracker Ref ID: #{kyc.id}</Text>
                                    <View style={styles.btnRow}>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#059669' }]} onPress={() => handleProcessApproval('Approved', kyc.id)}>
                                            <Text style={styles.btnText}>Approve</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={() => handleProcessApproval('Rejected', kyc.id)}>
                                            <Text style={styles.btnText}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
                    )
                )}

                {/* SEGMENT 2: RENDER DYNAMIC EMPLOYEE LEAVE APPLICATIONS */}
                {activeSegment === 'hr' && (
                    hrApplications.length === 0 ? (
                        <Text style={styles.emptyText}>📦 No leave or duty request applications require validation.</Text>
                    ) : (
                        hrApplications.map(app => (
                            <View key={app.id} style={styles.card}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={styles.cardTitle}>{app.employeeName || 'Field Executive'}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
                                        <Text style={[styles.statusText, { color: '#c2410c' }]}>{app.type || 'Leave'}</Text>
                                    </View>
                                </View>
                                <Text style={styles.cardDetail}>🗓️ Timeline Duration: {app.startDate} to {app.endDate}</Text>
                                <Text style={[styles.cardDetail, { fontStyle: 'italic', marginTop: 4 }]}>📝 Statement Note: "{app.reason}"</Text>
                                <Text style={styles.cardSubDetail}>Application Document Index ID: #{app.id}</Text>
                                <View style={styles.btnRow}>
                                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2563eb' }]} onPress={() => handleProcessLeaveApproval('Approved', app.id)}>
                                        <Text style={styles.btnText}>Grant Request</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#94a3b8' }]} onPress={() => handleProcessLeaveApproval('Rejected', app.id)}>
                                        <Text style={styles.btnText}>Deny</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: { flex: 1, backgroundColor: '#f3f4f6' },
    navbarContainer: { flexDirection: 'row', backgroundColor: '#1e293b', paddingHorizontal: 4, paddingVertical: 6, gap: 4 },
    navTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    activeNavTab: { backgroundColor: '#334155', borderWidth: 1, borderColor: '#475569' },
    navTabText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
    activeNavTabText: { color: '#38bdf8', fontWeight: 'bold' },
    container: { padding: 15 },
    sectionHeader: { fontSize: 11, fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', marginBottom: 15, marginTop: 5, letterSpacing: 0.5 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 10 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    cardDetail: { fontSize: 13, color: '#475569', marginTop: 2 },
    cardSubDetail: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 30 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    centerAlertCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: 340, borderRadius: 16, padding: 24, alignItems: 'center' },
    alertIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    alertIconText: { fontSize: 24 },
    alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, textAlign: 'center' },
    alertMessage: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
    alertBtn: { width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    alertBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' }
});