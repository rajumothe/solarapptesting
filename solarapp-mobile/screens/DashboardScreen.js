import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';

export default function DashboardScreen({ user, activeTab, onChangeTab }) {
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [syncingAttendance, setSyncingAttendance] = useState(true);
    const [accumulatedKm, setAccumulatedKm] = useState('0.000');

    useEffect(() => {
        evaluateCurrentAttendanceState();
    }, [activeTab]); // Triggers local update refresh passes on tab changes

    const evaluateCurrentAttendanceState = async () => {
        try {
            // Check the local storage variables that were set during LoginScreen synchronization
            const localCheckInStatus = await AsyncStorage.getItem('tracking_is_checked_in');
            const localAccumulatedKm = await AsyncStorage.getItem('tracking_accumulated_km') || '0.000';
            
            setAccumulatedKm(parseFloat(localAccumulatedKm).toFixed(3));

            if (localCheckInStatus === 'true') {
                setIsCheckedIn(true);
                setSyncingAttendance(false);
            } else {
                // Double check with server to ensure no sync drops occurred
                const response = await API.get('/auth/attendance/check-today').catch(() => null);
                if (response && response.data && response.data.hasCheckedIn === true) {
                    await AsyncStorage.setItem('tracking_is_checked_in', 'true');
                    await AsyncStorage.setItem('tracking_last_latitude', response.data.latitude.toString());
                    await AsyncStorage.setItem('tracking_last_longitude', response.data.longitude.toString());
                    
                    const distanceVal = response.data.accumulatedKm || "0.000";
                    await AsyncStorage.setItem('tracking_accumulated_km', parseFloat(distanceVal).toFixed(3));
                    
                    setAccumulatedKm(parseFloat(distanceVal).toFixed(3));
                    setIsCheckedIn(true);
                } else {
                    setIsCheckedIn(false);
                }
                setSyncingAttendance(false);
            }
        } catch (err) {
            console.log("Dashboard state check error:", err.message);
            setSyncingAttendance(false);
        }
    };

    const executeManualCheckIn = async () => {
        // Fallback check-in if not done yet today
        setSyncingAttendance(true);
        try {
            // Captures structural parameters (simulated defaults or coordinates from device location wrappers)
            const payload = {
                latitude: "17.4583",
                longitude: "78.3988"
            };
            
            const response = await API.post('/auth/attendance/check-in', payload);
            if (response.status === 201 || response.status === 200) {
                await AsyncStorage.setItem('tracking_is_checked_in', 'true');
                await AsyncStorage.setItem('tracking_last_latitude', payload.latitude);
                await AsyncStorage.setItem('tracking_last_longitude', payload.longitude);
                await AsyncStorage.setItem('tracking_accumulated_km', '0.000');
                
                setAccumulatedKm('0.000');
                setIsCheckedIn(true);
                Alert.alert("Success", "Attendance registered successfully.");
            }
        } catch (error) {
            const serverMsg = error.response?.data?.message || "Check-In transaction rejected.";
            // If server confirms attendance is already marked today, force sync and unlock locally
            if (serverMsg.toLowerCase().includes("already") || error.response?.status === 400) {
                await AsyncStorage.setItem('tracking_is_checked_in', 'true');
                setIsCheckedIn(true);
            }
            Alert.alert("Attendance Notice", serverMsg);
        } finally {
            setSyncingAttendance(false);
        }
    };

    // Renders the specific summary analytical dashboard per role profile requirements
    const renderExecutiveDashboard = () => (
        <ScrollView style={styles.dashCard} bounces={false}>
            <Text style={styles.dashTitle}>📋 Executive Performance Terminal</Text>
            
            {/* INJECTED LIVE ATTENDANCE STATE STATUS BANNER BAR */}
            <View style={[styles.attendanceBanner, { backgroundColor: isCheckedIn ? '#e6f4ea' : '#fff3cd', borderColor: isCheckedIn ? '#34a853' : '#f1c40f' }]}>
                <Text style={[styles.attendanceText, { color: isCheckedIn ? '#137333' : '#a78bfa' }]}>
                    {isCheckedIn ? `🟢 Shift Active • Tracking Mileage: ${accumulatedKm} KM` : '⚠️ Terminal Standby • Attendance Required'}
                </Text>
                {!isCheckedIn && (
                    <TouchableOpacity style={styles.innerCheckInBtn} onPress={executeManualCheckIn}>
                        <Text style={styles.innerCheckInBtnText}>Check In Now</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.grid}>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>12</Text><Text style={styles.kpiLabel}>Leads MTD</Text></View>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>{isCheckedIn ? '1' : '0'}</Text><Text style={styles.kpiLabel}>Visits Today</Text></View>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>1</Text><Text style={styles.kpiLabel}>Converted MTD</Text></View>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>45%</Text><Text style={styles.kpiLabel}>Target Ach.</Text></View>
            </View>
            
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#d97706'}]} onPress={() => onChangeTab('LeadsCreate')}>
                <Text style={styles.btnText}>➕ Beat Lead Creation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#4f46e5'}]} onPress={() => onChangeTab('KYCOffer')}>
                <Text style={styles.btnText}>📑 Submit Customer KYC</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderTechnicianDashboard = () => (
        <ScrollView style={styles.dashCard} bounces={false}>
            <Text style={styles.dashTitle}>🛠️ Field Operations Service Desk</Text>
            <View style={styles.grid}>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>2</Text><Text style={styles.kpiLabel}>Fresh Assigned</Text></View>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>4</Text><Text style={styles.kpiLabel}>Location Open</Text></View>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>1</Text><Text style={styles.kpiLabel}>Resolved Today</Text></View>
            </View>
            <Text style={styles.sectionHeader}>Logistics Deployment Actions</Text>
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#0284c7'}]} onPress={() => onChangeTab('TechGrid')}>
                <Text style={styles.btnText}>🎫 Open Service Tickets Grid</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderManagerDashboard = () => (
        <ScrollView style={styles.dashCard} bounces={false}>
            <Text style={styles.dashTitle}>🏢 Management Intelligence Dashboard</Text>
            <View style={styles.grid}>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>45</Text><Text style={styles.kpiLabel}>Team Leads</Text></View>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>12</Text><Text style={styles.kpiLabel}>Team Conversions</Text></View>
                <View style={styles.kpiBox}><Text style={styles.kpiValue}>82%</Text><Text style={styles.kpiLabel}>Territory Ach.</Text></View>
            </View>
            <Text style={styles.sectionHeader}>Verification & Approval Actions</Text>
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#059669'}]} onPress={() => onChangeTab('Approvals')}>
                <Text style={styles.btnText}>✔️ Team Customer Approvals</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#7c3aed'}]} onPress={() => onChangeTab('HREvals')}>
                <Text style={styles.btnText}>💰 Expense & Leave Evals</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    if (syncingAttendance) {
        return (
            <View style={[styles.dashContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 10, color: '#4b5563', fontSize: 13, fontWeight: '500' }}>Syncing Shift Status Ledger...</Text>
            </View>
        );
    }

    return (
        <View style={styles.dashContainer}>
            {['Executive', 'Super Admin'].includes(user.role) && renderExecutiveDashboard()}
            {['Service Engineer'].includes(user.role) && renderTechnicianDashboard()}
            {['ASM', 'RSM', 'State Head', 'HOD'].includes(user.role) && renderManagerDashboard()}
        </View>
    );
}

const styles = StyleSheet.create({
    dashContainer: { flex: 1, padding: 15, backgroundColor: '#f3f4f6' },
    dashCard: { backgroundColor: '#fff', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    dashTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 20 },
    kpiBox: { width: '47%', backgroundColor: '#f9fafb', padding: 15, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
    kpiLabel: { fontSize: 11, color: '#6b7280', marginTop: 4, fontWeight: '600' },
    sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 10, marginTop: 5 },
    actionBtn: { padding: 14, borderRadius: 6, alignItems: 'center', marginBottom: 12 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    
    /* ATTENDANCE LIVE SYNCHRONIZATION BAR STYLES */
    attendanceBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 20 },
    attendanceText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.2 },
    innerCheckInBtn: { backgroundColor: '#7c3aed', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
    innerCheckInBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' }
});