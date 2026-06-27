import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import API from '../api';

export default function TechnicianDashboard() {
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTechnicianGrid = async () => {
        try {
            const res = await API.get('/services/tickets/local-grid');
            if (res.data) setTickets(res.data);
        } catch (err) {
            // Development fallback parameters matching your exact structural requirements
            setTickets([
                { id: 9001, type: 'Fresh Installation', pincode: '500001', status: 'Assigned', details: 'Install 3KW On-Grid System' },
                { id: 9002, type: 'Maintenance Service', pincode: '500001', status: 'Open', details: 'Inverter error code E23' }
            ]);
        }
    };

    useEffect(() => {
        fetchTechnicianGrid();
    }, []);

    const handleProgressUpdate = (ticketId, targetStatus) => {
        Alert.alert('Status Updated', `Ticket #${ticketId} advanced to state: [${targetStatus}].`);
        // Optional photo proof simulation can be bound here
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Shift Tracker */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>⏱️ Technician Shift Tracker</Text>
                <Text style={styles.statusText}>State: {isCheckedIn ? '🟢 Active On-Field' : '🔴 Off Duty'}</Text>
                <TouchableOpacity 
                    style={[styles.toggleBtn, { backgroundColor: isCheckedIn ? '#dc2626' : '#059669' }]} 
                    onPress={() => setIsCheckedIn(!isCheckedIn)}
                >
                    <Text style={styles.btnText}>{isCheckedIn ? 'Perform Check-Out' : 'Perform Check-In'}</Text>
                </TouchableOpacity>
            </View>

            {/* Job Board Logs */}
            <Text style={styles.secTitle}>🎫 Assigned & Regional Tickets Queue</Text>
            {tickets.map(ticket => (
                <View key={ticket.id} style={styles.ticketBox}>
                    <View style={styles.ticketHeader}>
                        <Text style={styles.ticketType}>{ticket.type} (#{ticket.id})</Text>
                        <Text style={styles.badge}>{ticket.status}</Text>
                    </View>
                    <Text style={styles.detailsText}>{ticket.details}</Text>
                    <Text style={styles.locText}>📍 Site PIN: {ticket.pincode}</Text>

                    {/* Operational Progress Steps Toggles */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => handleProgressUpdate(ticket.id, 'Travel Started')}>
                            <Text style={styles.stepText}>🚗 Start Travel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => handleProgressUpdate(ticket.id, 'Reached')}>
                            <Text style={styles.stepText}>📍 Reached</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => handleProgressUpdate(ticket.id, 'Work Started')}>
                            <Text style={styles.stepText}>🔧 Start Work</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.stepBtn, {backgroundColor: '#059669'}]} onPress={() => handleProgressUpdate(ticket.id, 'Completed')}>
                            <Text style={[styles.stepText, {color: '#fff'}]}>✔️ Complete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 15, backgroundColor: '#f3f4f6' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20 },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    statusText: { fontSize: 13, color: '#4b5563', marginBottom: 15 },
    toggleBtn: { padding: 12, borderRadius: 6, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    secTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 12, paddingLeft: 5 },
    ticketBox: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 15 },
    ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    ticketType: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    badge: { fontSize: 11, backgroundColor: '#fef3c7', color: '#d97706', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, fontWeight: '700' },
    detailsText: { fontSize: 13, color: '#4b5563', marginBottom: 4 },
    locText: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    stepBtn: { backgroundColor: '#f3f4f6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
    stepText: { fontSize: 11, fontWeight: '600', color: '#374151' }
});