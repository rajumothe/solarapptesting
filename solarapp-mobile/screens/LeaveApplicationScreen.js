import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Modal } from 'react-native';
import API from '../api';

export default function LeaveApplicationScreen() {
    // 3-Way Navigation View Toggles: 'apply' | 'status' | 'calendar'
    const [currentSubView, setCurrentSubView] = useState('apply');
    
    // Application Request Inputs State
    const [type, setType] = useState('Leave'); 
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    // Live Linked Server Records State Arrays
    const [requestHistory, setRequestHistory] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [fetchingLogs, setFetchingLogs] = useState(false);

    // Centered Custom Popup State
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupTitle, setPopupTitle] = useState('');
    const [popupMessage, setPopupMessage] = useState('');
    const [isSuccessAction, setIsSuccessAction] = useState(false);

    // FIX: Completely aligned variables to correct setters to prevent thread freezing ReferenceErrors
    const triggerCenterPopup = (title, msg, success = false) => {
        setPopupTitle(title);
        setPopupMessage(msg);
        setIsSuccessAction(success);
        setPopupVisible(true);
    };

    useEffect(() => {
        if (currentSubView === 'status') {
            fetchApplicationLedgerLogs();
        } else if (currentSubView === 'calendar') {
            fetchAttendanceMetricGrid();
        }
    }, [currentSubView]);

    const fetchApplicationLedgerLogs = async () => {
        setFetchingLogs(true);
        setRequestHistory([]); // Flush previous states safely
        try {
            const res = await API.get('/hr/leave/my-applications');
            if (res.data && Array.isArray(res.data)) {
                setRequestHistory(res.data);
            }
        } catch (err) {
            console.log("Error querying live applications ledger:", err.message);
            setRequestHistory([]); // Force clear if request dropped
        } finally {
            setFetchingLogs(false);
        }
    };

    const fetchAttendanceMetricGrid = async () => {
        setFetchingLogs(true);
        setAttendanceLogs([]); // Flush previous states safely
        try {
            const res = await API.get('/hr/attendance/my-monthly-summary');
            if (res.data && Array.isArray(res.data)) {
                setAttendanceLogs(res.data);
            }
        } catch (err) {
            console.log("Error querying active attendance logs:", err.message);
            setAttendanceLogs([]); // Force clear on failure parameters
        } finally {
            setFetchingLogs(false);
        }
    };

    const handleApply = async () => {
        if (!startDate || !endDate || !reason) {
            triggerCenterPopup('Validation Error', 'Please complete both dates and provide a concise reason description.', false);
            return;
        }
        setLoading(true);
        try {
            const response = await API.post('/hr/leave/apply', { type, startDate, endDate, reason });
            const serverMessage = response.data?.message || `${type} request filed cleanly for approval routing.`;
            triggerCenterPopup('Application Filed', serverMessage, true);
            setStartDate(''); setEndDate(''); setReason('');
        } catch (err) {
            const errText = err.response?.data?.message || 'Help desk connection timeout.';
            triggerCenterPopup('Submission Error', `Failed to apply request parameters: ${errText}`, false);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColors = (status) => {
        if (status === 'Approved') {
            return { bg: '#dcfce7', text: '#15803d' };
        } else if (status === 'Rejected') {
            return { bg: '#fee2e2', text: '#b91c1c' };
        } else {
            // Safe fallback catcher for both 'Pending' and 'Pending Approval' backend strings
            return { bg: '#fef3c7', text: '#d97706' };
        }
    };

    const getCalendarTagColors = (tag) => {
        switch (tag) {
            case 'Present': return { bg: '#e6f4ea', text: '#137333' };
            case 'On Duty': return { bg: '#e8f0fe', text: '#1a73e8' };
            case 'Weekly Off': return { bg: '#f1f5f9', text: '#475569' };
            default: return { bg: '#fce8e6', text: '#c5221f' };
        }
    };

    return (
        <View style={styles.outerContainer}>
            {/* CENTERED POPUP MODAL CONTROL */}
            <Modal animationType="fade" transparent={true} visible={popupVisible} onRequestClose={() => setPopupVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.centerAlertCard}>
                        <View style={[styles.alertIconCircle, { backgroundColor: isSuccessAction ? '#e6f4ea' : '#fce8e6' }]}>
                            <Text style={styles.alertIconText}>{isSuccessAction ? '🎉' : '⚠️'}</Text>
                        </View>
                        <Text style={styles.alertTitle}>{popupTitle}</Text>
                        <Text style={styles.alertMessage}>{popupMessage}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#2563eb' }]} onPress={() => setPopupVisible(false)}>
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* THREE-TIER SELECTION HEADER SYSTEM */}
            <View style={styles.viewModeNavbar}>
                <TouchableOpacity style={[styles.navTab, currentSubView === 'apply' && styles.activeNavTab]} onPress={() => setCurrentSubView('apply')}>
                    <Text style={[styles.navTabText, currentSubView === 'apply' && styles.activeNavTabText]}>Apply Request</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navTab, currentSubView === 'status' && styles.activeNavTab]} onPress={() => setCurrentSubView('status')}>
                    <Text style={[styles.navTabText, currentSubView === 'status' && styles.activeNavTabText]}>Track Status</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navTab, currentSubView === 'calendar' && styles.activeNavTab]} onPress={() => setCurrentSubView('calendar')}>
                    <Text style={[styles.navTabText, currentSubView === 'calendar' && styles.activeNavTabText]}>Work Calendar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                
                {/* 1. APPLY FORM PHASE */}
                {currentSubView === 'apply' && (
                    <View style={styles.card}>
                        <Text style={styles.sectionHeaderTitle}>To Apply Leave / On Duty Request</Text>
                        
                        <View style={styles.toggleRow}>
                            <TouchableOpacity style={[styles.toggleTab, type === 'Leave' && styles.activeTab]} onPress={() => setType('Leave')}>
                                <Text style={[styles.toggleText, type === 'Leave' && styles.activeTabText]}>Leave Request</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.toggleTab, type === 'On Duty' && styles.activeTab]} onPress={() => setType('On Duty')}>
                                <Text style={[styles.toggleText, type === 'On Duty' && styles.activeTabText]}>On Duty (OD)</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Start Date</Text>
                        {Platform.OS === 'web' ? (
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.webDatePicker} />
                        ) : (
                            <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
                        )}

                        <Text style={styles.label}>End Date</Text>
                        {Platform.OS === 'web' ? (
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.webDatePicker} />
                        ) : (
                            <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
                        )}

                        <Text style={styles.label}>Reason / Justification</Text>
                        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="State operational justification details..." value={reason} onChangeText={setReason} />

                        <TouchableOpacity style={styles.btn} onPress={handleApply} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Application</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* 2. LIVE TRACK STATUS LEDGER */}
                {currentSubView === 'status' && (
                    <View style={styles.card}>
                        <Text style={styles.sectionHeaderTitle}>📋 Live HR Request Visibility Ledger</Text>
                        {fetchingLogs ? <ActivityIndicator color="#2563eb" style={{ marginVertical: 20 }} /> : 
                         requestHistory.length === 0 ? <Text style={styles.emptyText}>No documentation requests found on your live profile database track logs.</Text> :
                         requestHistory.map(item => {
                             const colors = getStatusColors(item.status);
                             return (
                                 <View key={item.id} style={styles.historyCardItem}>
                                     <View style={styles.historyRowHeader}>
                                         <Text style={styles.historyCardType}>🎫 {item.type.toUpperCase()}</Text>
                                         <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                                             <Text style={[styles.statusBadgeText, { color: colors.text }]}>{item.status}</Text>
                                         </View>
                                     </View>
                                     <Text style={styles.historyDatesText}>🗓️ Duration: {item.startDate} to {item.endDate}</Text>
                                     <Text style={styles.historyReasonText}>📝 Justification: "{item.reason}"</Text>
                                 </View>
                             );
                         })
                        }
                    </View>
                )}

                {/* 3. LIVE WORK CALENDAR */}
                {currentSubView === 'calendar' && (
                    <View style={styles.card}>
                        <Text style={styles.sectionHeaderTitle}>📅 Operational Shift Attendance Calendar</Text>
                        {/* FIX: Swapped out breaking HTML browser tag for native Text primitive block context layout wrapper */}
                        <Text style={styles.subLabelText}>Real-time biometric database match metrics loop.</Text>
                        
                        {fetchingLogs ? <ActivityIndicator color="#2563eb" style={{ marginVertical: 20 }} /> :
                         attendanceLogs.length === 0 ? <Text style={styles.emptyText}>No verified monthly logs captured across current database session filters.</Text> : (
                            <View style={styles.calendarTableMatrix}>
                                <View style={styles.tableHeaderRow}>
                                    <Text style={[styles.tableTh, { flex: 1.2 }]}>Date</Text>
                                    <Text style={[styles.tableTh, { flex: 1 }]}>Status</Text>
                                    <Text style={[styles.tableTh, { flex: 1.2 }]}>Hours Worked</Text>
                                    <Text style={[styles.tableTh, { flex: 1, textAlign: 'right' }]}>KM Polled</Text>
                                </View>
                                {attendanceLogs.map((log, idx) => {
                                    const badgeColors = getCalendarTagColors(log.tag || 'Present');
                                    return (
                                        <View key={idx} style={styles.tableBodyRow}>
                                            <Text style={[styles.tableTd, { flex: 1.2, fontWeight: '600' }]}>{log.date}</Text>
                                            <View style={[styles.tableTagContainer, { flex: 1 }]}>
                                                <View style={[styles.calendarMiniBadge, { backgroundColor: badgeColors.bg }]}>
                                                    <Text style={[styles.calendarMiniBadgeText, { color: badgeColors.text }]}>{log.tag}</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.tableTd, { flex: 1.2, color: '#475569', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>⏱️ {log.hours || '--'}</Text>
                                            <Text style={[styles.tableTd, { flex: 1, textAlign: 'right', fontWeight: '700', color: '#7c3aed' }]}>{log.km || '0.000'} KM</Text>
                                        </View>
                                    );
                                })}
                            </View>
                         )
                        }
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#f3f4f6' },
    viewModeNavbar: { flexDirection: 'row', backgroundColor: '#1e293b', paddingHorizontal: 6, paddingVertical: 8, gap: 4 },
    navTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    activeNavTab: { backgroundColor: '#334155', borderWidth: 1, borderColor: '#475569' },
    navTabText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
    activeNavTabText: { color: '#38bdf8', fontWeight: 'bold' },
    scrollContent: { padding: 16, flexGrow: 1, justifyContent: 'flex-start' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    sectionHeaderTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },
    toggleRow: { flexDirection: 'row', backgroundColor: '#f4f4f5', borderRadius: 8, padding: 4, marginBottom: 18 },
    toggleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    activeTab: { backgroundColor: '#fff', elevation: 1 },
    toggleText: { fontSize: 12, color: '#71717a', fontWeight: '600' },
    activeTabText: { color: '#2563eb', fontWeight: 'bold' },
    label: { fontSize: 11, fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
    input: { backgroundColor: '#ffffff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 14, fontSize: 14, color: '#1f2937' },
    btn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 8 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    emptyText: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginVertical: 32 },
    subLabelText: { fontSize: 12, color: '#64748b', marginBottom: 20, marginTop: -10 },
    historyCardItem: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', marginBottom: 12 },
    historyRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    historyCardType: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
    statusBadgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    historyDatesText: { fontSize: 13, color: '#475569', fontWeight: '500', marginBottom: 4 },
    historyReasonText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', lineHeight: 16 },
    calendarTableMatrix: { borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginTop: 5 },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    tableTh: { fontSize: 11, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' },
    tableBodyRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
    tableTd: { fontSize: 13, color: '#1e293b' },
    tableTagContainer: { justifyContent: 'center', alignItems: 'flex-start' },
    calendarMiniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    calendarMiniBadgeText: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
    webDatePicker: { backgroundColor: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '14px', fontSize: '14px', width: '100%', boxSizing: 'border-box', color: '#1f2937' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    centerAlertCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: 330, borderRadius: 16, padding: 24, alignItems: 'center' },
    alertIconCircle: { width: 52, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    alertIconText: { fontSize: 24 },
    alertTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', marginBottom: 10, textAlign: 'center' },
    alertMessage: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    alertBtn: { width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    alertBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' }
});