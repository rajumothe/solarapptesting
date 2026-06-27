import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Modal, ScrollView, TouchableWithoutFeedback, Platform, StatusBar as NativeStatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import ExecutiveDashboard from './screens/ExecutiveDashboard';
import TechnicianDashboard from './screens/TechnicianDashboard';
import ProfileScreen from './screens/ProfileScreen';
import LeadCreationScreen from './screens/LeadCreationScreen';
import LeadConversionScreen from './screens/LeadConversionScreen';
import ExecutiveSupportScreen from './screens/ExecutiveSupportScreen';
import LeaveApplicationScreen from './screens/LeaveApplicationScreen'; 
import ClaimsScreen from './screens/ClaimsScreen';
import ManagementApprovalScreen from './screens/ManagementApprovalScreen';
import ManagementReportScreen from './screens/ManagementReportScreen';
import LeadsCustomerListScreen from './screens/LeadsCustomerListScreen';
import FieldVisitScreen from './screens/FieldVisitScreen';

export default function App() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('Home'); 
    const [currentActionView, setCurrentActionView] = useState(null); 
    const [isActionModalVisible, setIsActionModalVisible] = useState(false); 

    const checkActiveSessionState = async () => {
        const cachedUser = await AsyncStorage.getItem('mobile_user');
        if (cachedUser) setUser(JSON.parse(cachedUser));
    };

    useEffect(() => {
        checkActiveSessionState();
    }, []);

    const handleSignOut = async () => {
        await AsyncStorage.clear();
        setUser(null);
        setActiveTab('Home');
        setCurrentActionView(null);
        setIsActionModalVisible(false);
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <StatusBar style="auto" />
                <LoginScreen onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
            </View>
        );
    }

    const isManager = ['ASM', 'RSM', 'State Head', 'HOD', 'Super Admin'].includes(user.role);

    const renderActiveWorkspaceView = () => {
        if (currentActionView) {
            if (currentActionView === 'Leads') return <LeadCreationScreen />;
            if (currentActionView === 'KYC') return <LeadConversionScreen />;
            if (currentActionView === 'Support') return <ExecutiveSupportScreen />;
            if (currentActionView === 'Leaves') return <LeaveApplicationScreen />;
            if (currentActionView === 'Claims') return <ClaimsScreen />;
            if (currentActionView === 'Approvals') return <ManagementApprovalScreen user={user} />;
            if (currentActionView === 'TeamLogs') return <ManagementReportScreen user={user} />;
            if (currentActionView === 'Directory') return <LeadsCustomerListScreen />;
            if (currentActionView === 'Visits') return <FieldVisitScreen />;
        }

        if (activeTab === 'Home') {
            return user.role === 'Service Engineer' ? <TechnicianDashboard /> : <ExecutiveDashboard />;
        }
        
        if (activeTab === 'Profile') {
            return <ProfileScreen user={user} />;
        }
    };

    const handleMenuSelection = (viewName) => {
        setCurrentActionView(viewName);
        setIsActionModalVisible(false); 
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            
            {/* Top Workspace Header Bar */}
            <View style={styles.topHeader}>
                <View style={styles.headerLeft}>
                    {currentActionView && (
                        <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentActionView(null)}>
                            <Text style={styles.backBtnText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle} numberOfLines={1}>SolarAPP</Text>
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {currentActionView ? `Operation: ${currentActionView}` : activeTab}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Application Main Active Screen Window Frame */}
            <View style={styles.mainArea}>
                {renderActiveWorkspaceView()}
            </View>

            {/* CORRECTED MODAL OVERLAY SHEET DESIGN LAYER */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isActionModalVisible}
                onRequestClose={() => setIsActionModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsActionModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContentCard}>
                                <View style={styles.modalHeaderStrip}>
                                    <Text style={styles.modalHeaderTitle}>Select Action</Text>
                                    <TouchableOpacity style={styles.closeBox} onPress={() => setIsActionModalVisible(false)}>
                                        <Text style={styles.closeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView contentContainerStyle={styles.modalScrollBody} style={{ width: '100%' }}>
                                    {/* Executive Field Operations Segment Elements */}
                                    {(!['Service Engineer', 'ASM', 'RSM'].includes(user.role) || user.role === 'Executive') && (
                                        <View style={styles.fullWidthWrapper}>
                                            <TouchableOpacity style={styles.actionRowCard} onPress={() => handleMenuSelection('Leads')}>
                                                <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}><Text style={styles.rowIcon}>👤</Text></View>
                                                <View style={styles.rowTextData}>
                                                    <Text style={styles.rowTitleText}>Lead Creation</Text>
                                                    <Text style={styles.rowSubtitleText}>Capture new site lead targets instantly</Text>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.actionRowCard} onPress={() => handleMenuSelection('KYC')}>
                                                <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}><Text style={styles.rowIcon}>📑</Text></View>
                                                <View style={styles.rowTextData}>
                                                    <Text style={styles.rowTitleText}>Lead Conversion to Customer</Text>
                                                    <Text style={styles.rowSubtitleText}>Upload structural KYC compliance files</Text>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.actionRowCard} onPress={() => handleMenuSelection('Support')}>
                                                <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}><Text style={styles.rowIcon}>🛠️</Text></View>
                                                <View style={styles.rowTextData}>
                                                    <Text style={styles.rowTitleText}>Create Technician Support</Text>
                                                    <Text style={styles.rowSubtitleText}>Dispatch breakdown service orders</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Territory Management Segment Tools Group */}
                                    {isManager && (
                                        <View style={styles.fullWidthWrapper}>
                                            <TouchableOpacity style={styles.actionRowCard} onPress={() => handleMenuSelection('Approvals')}>
                                                <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}><Text style={styles.rowIcon}>✔️</Text></View>
                                                <View style={styles.rowTextData}>
                                                    <Text style={styles.rowTitleText}>Manager Approvals Console</Text>
                                                    <Text style={styles.rowSubtitleText}>Authorize KYC folders, leaves, and logs</Text>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.actionRowCard} onPress={() => handleMenuSelection('TeamLogs')}>
                                                <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}><Text style={styles.rowIcon}>📊</Text></View>
                                                <View style={styles.rowTextData}>
                                                    <Text style={styles.rowTitleText}>Team Performance Reports</Text>
                                                    <Text style={styles.rowSubtitleText}>Monitor localized zone metrics summaries</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Universal Core HR Group Utilities */}
                                    <View style={styles.fullWidthWrapper}>
                                        <TouchableOpacity style={styles.actionRowCard} onPress={() => handleMenuSelection('Leaves')}>
                                            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}><Text style={styles.rowIcon}>📅</Text></View>
                                            <View style={styles.rowTextData}>
                                                <Text style={styles.rowTitleText}>Leave & On Duty Apply</Text>
                                                <Text style={styles.rowSubtitleText}>File shift exception vouchers to hierarchy</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionRowCard} onPress={() => handleMenuSelection('Claims')}>
                                            <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}><Text style={styles.rowIcon}>💰</Text></View>
                                            <View style={styles.rowTextData}>
                                                <Text style={styles.rowTitleText}>Bills & Claims Apply</Text>
                                                <Text style={styles.rowSubtitleText}>Register travel (TA/DA) expense line lines</Text>
                                            </View>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.actionRowCard} onPress={() => handleMenuSelection('Directory')}>
                                            <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}><Text style={styles.rowIcon}>📋</Text></View>
                                            <View style={styles.rowTextData}>
                                                <Text style={styles.rowTitleText}>Lead & Customer Master Directory</Text>
                                                <Text style={styles.rowSubtitleText}>View complete pipeline status tracking ledger</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionRowCard} onPress={() => handleMenuSelection('Visits')}>
                                            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}><Text style={styles.rowIcon}>🚗</Text></View>
                                            <View style={styles.rowTextData}>
                                                <Text style={styles.rowTitleText}>Log Lead / Customer Visit</Text>
                                                <Text style={styles.rowSubtitleText}>Record current odometer kilometers tracking and coordinates</Text>
                                            </View>
                                        </TouchableOpacity>


                                    </View>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Bottom Menu Navigation Bar Track Tab Strip */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, !currentActionView && activeTab === 'Home' && styles.activeTab]} 
                    onPress={() => { setActiveTab('Home'); setCurrentActionView(null); }}
                >
                    <Text style={styles.tabIcon}>🏠</Text>
                    <Text style={[styles.tabText, !currentActionView && activeTab === 'Home' && styles.activeTabText]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tab, isActionModalVisible && styles.activeTab]} 
                    onPress={() => setIsActionModalVisible(true)}
                >
                    <Text style={styles.tabIcon}>⚡</Text>
                    <Text style={[styles.tabText, isActionModalVisible && styles.activeTabText]}>Actions</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tab, !currentActionView && activeTab === 'Profile' && styles.activeTab]} 
                    onPress={() => { setActiveTab('Profile'); setCurrentActionView(null); }}
                >
                    <Text style={styles.tabIcon}>👤</Text>
                    <Text style={[styles.tabText, !currentActionView && activeTab === 'Profile' && styles.activeTabText]}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    safeArea: { flex: 1, backgroundColor: '#1e293b' },
    topHeader: {
        backgroundColor: '#1e293b',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight || 0) + 6 : 8,
        paddingBottom: 10,
        minHeight: 62
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10, minWidth: 0 },
    headerTitles: { flexShrink: 1, minWidth: 0 },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
    headerSubtitle: { color: '#bfdbfe', fontSize: 12, fontWeight: '600', marginTop: 1 },
    backBtn: { backgroundColor: '#334155', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, marginRight: 8 },
    backBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    logoutBtn: { backgroundColor: '#fee2e2', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8 },
    logoutText: { color: '#b91c1c', fontWeight: '700', fontSize: 12 },
    mainArea: { flex: 1 },
    
    tabBar: { flexDirection: 'row', height: 60, borderTopWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', width: '100%' },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
    activeTab: { borderTopWidth: 3, borderTopColor: '#2563eb', backgroundColor: '#f8fafc' },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    tabText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
    activeTabText: { color: '#2563eb', fontWeight: 'bold' },

    /* MODAL AND LAYOUT EXPANSION REFIXES */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end', alignItems: 'center' },
    modalContentCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingHorizontal: 20, paddingTop: 6, width: '100%', alignItems: 'center' },
    modalHeaderStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 15, width: '100%' },
    modalHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    closeBox: { backgroundColor: '#f1f5f9', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    closeText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
    
    modalScrollBody: { width: '100%', alignItems: 'stretch' },
    fullWidthWrapper: { width: '100%', alignItems: 'stretch', marginBottom: 10 },

    /* BLOCK ROW EXPANSION PROPERTIES FOR HORIZONTAL LAYOUT FILL */
    actionRowCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#ffffff', 
        paddingVertical: 14, 
        paddingHorizontal: 5,
        borderBottomWidth: 1, 
        borderBottomColor: '#f1f5f9',
        width: '100%',
        alignSelf: 'stretch'
    },
    iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 14, shrink: 0 },
    rowIcon: { fontSize: 18 },
    rowTextData: { flex: 1, justifyContent: 'center' },
    rowTitleText: { fontSize: 14, fontWeight: '600', color: '#1e293b', textAlign: 'left' },
    rowSubtitleText: { fontSize: 12, color: '#64748b', marginTop: 2, textAlign: 'left' }
});