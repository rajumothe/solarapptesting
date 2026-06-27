import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function ManagementReportScreen({ user }) {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.box}>
                <Text style={styles.boxTitle}>📊 Regional Territory Performance metrics</Text>
                <Text style={styles.metric}>Total Pipeline Active Leads: 148</Text>
                <Text style={styles.metric}>MTD Converted Conversions: 42 Systems</Text>
                <Text style={styles.metric}>Average Target Vs Achievement Ratio: 81.4%</Text>
            </View>

            <View style={styles.box}>
                <Text style={styles.boxTitle}>👥 Subordinate Field Performance Logs</Text>
                <View style={styles.row}><Text style={styles.name}>Raju Executive</Text><Text style={styles.stat}>🟢 4 Visits Today | 95% Ach</Text></View>
                <View style={styles.row}><Text style={styles.name}>Arjun Sharma</Text><Text style={styles.stat}>🟢 2 Installs Closed</Text></View>
                <View style={styles.row}><Text style={styles.name}>Suresh Raina</Text><Text style={styles.stat}>🟡 On Duty (OD Travel)</Text></View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 15 },
    box: { backgroundColor: '#fff', padding: 18, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20 },
    boxTitle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 12, borderBottomWidth: 1, borderColor: '#f3f4f6', paddingBottom: 6 },
    metric: { fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: '500' },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f9fafb' },
    name: { fontSize: 12, fontWeight: 'bold', color: '#4b5563' },
    stat: { fontSize: 12, color: '#059669', fontWeight: '600' }
});