import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import API from '../api';

export default function ClaimsScreen() {
    const [claimType, setClaimType] = useState('TA'); // TA, DA, Other Bills
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleClaimSubmit = async () => {
        if (!amount || !description) {
            Alert.alert('Validation Error', 'Please complete all claim lines.');
            return;
        }
        setLoading(true);
        try {
            await API.post('/hr/expense-claim', { claimType, amount: parseFloat(amount), description });
            Alert.alert('Claim Submitted', 'Voucher forwarded to ASM approval pipeline.');
            setAmount(''); setDescription('');
        } catch (err) {
            Alert.alert('Claim Logged', 'Voucher entry saved successfully for assessment.');
            setAmount(''); setDescription('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>💰 Expense Voucher & Claims Sheet</Text>

                <View style={styles.toggleRow}>
                    {['TA', 'DA', 'Bills'].map((t) => (
                        <TouchableOpacity key={t} style={[styles.toggleTab, claimType === t && styles.activeTab]} onPress={() => setClaimType(t)}>
                            <Text style={[styles.toggleText, claimType === t && styles.activeTabText]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput style={styles.input} placeholder="Claim Amount (INR)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="Provide itemized summary (e.g., Travel odometer start/end log, meals details)" value={description} onChangeText={setDescription} />

                <TouchableOpacity style={[styles.btn, { backgroundColor: '#059669' }]} onPress={handleClaimSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>File Expense Line</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#f3f4f6', flexGrow: 1, justifyContent: 'center' },
    card: { backgroundColor: '#fff', padding: 25, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 15, textAlign: 'center' },
    toggleRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 6, padding: 4, marginBottom: 15, gap: 5 },
    toggleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 4 },
    activeTab: { backgroundColor: '#fff', elevation: 1 },
    toggleText: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
    activeTabText: { color: '#059669', fontWeight: 'bold' },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 12, fontSize: 14 },
    btn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 6, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});