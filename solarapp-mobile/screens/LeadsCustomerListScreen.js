import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import API from '../api';

export default function LeadsCustomerListScreen() {
    const [viewMode, setViewMode] = useState('Leads'); // 'Leads' or 'Customers'
    const [masterList, setMasterList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDataPipeline();
    }, []);

    const fetchDataPipeline = async () => {
        setLoading(true);
        try {
            // Hits your master listing endpoint
            const response = await API.get('/leads/list');
            if (response.data && Array.isArray(response.data)) {
                setMasterList(response.data);
                applyFilterAndSearch(response.data, viewMode, searchQuery);
            }
        } catch (err) {
            console.log("Using local database mock cache for offline/sandbox testing layout verification:", err.message);
            const mockData = [
                { id: 1, leadCode: 'L-100000', customerName: 'MOTHE RAJU', contactNo: '9912689612', address: 'WARANGAL RS NAGAR', unitCapacitySelection: '3 KW SET1', status: 'Converted' },
                { id: 2, leadCode: 'L-100001', customerName: 'SAGAR MOTHE', contactNo: '1234567890', address: 'WARANGAL INKOLLU', unitCapacitySelection: '3KW POEWR GRID', status: 'Lead Created' },
                { id: 3, leadCode: 'L-100002', customerName: 'TEST RUNNER', contactNo: '9876543210', address: 'HYDERABAD HUB 1', unitCapacitySelection: '3 KW SET1', status: 'Processing' }
            ];
            setMasterList(mockData);
            applyFilterAndSearch(mockData, viewMode, searchQuery);
        } finally {
            setLoading(false);
        }
    };

    const applyFilterAndSearch = (list, mode, query) => {
        let filtered = list.filter(item => {
            if (mode === 'Customers') {
                return item.status === 'Converted';
            } else {
                return item.status !== 'Converted';
            }
        });

        if (query.trim() !== '') {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(item => 
                item.customerName?.toLowerCase().includes(lowerQuery) ||
                item.leadCode?.toLowerCase().includes(lowerQuery) ||
                item.contactNo?.includes(query)
            );
        }
        setFilteredList(filtered);
    };

    const handleModeChange = (newMode) => {
        setViewMode(newMode);
        applyFilterAndSearch(masterList, newMode, searchQuery);
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        applyFilterAndSearch(masterList, viewMode, text);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Converted': return { bg: '#e6f4ea', text: '#137333' };
            case 'Processing': return { bg: '#e8f0fe', text: '#1a73e8' };
            case 'Rejected': return { bg: '#fce8e6', text: '#c5221f' };
            default: return { bg: '#fef7e0', text: '#b06000' }; // 'Lead Created'
        }
    };

    const renderListItem = ({ item }) => {
        const colors = getStatusColor(item.status);
        return (
            <View style={styles.dataCardRow}>
                <View style={styles.cardLeftBlock}>
                    <View style={styles.titleCodeRow}>
                        <Text style={styles.leadCodeBadge}>{item.leadCode || `ID: ${item.id}`}</Text>
                        <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
                            <Text style={[styles.statusPillText, { color: colors.text }]}>{item.status}</Text>
                        </View>
                    </View>
                    <Text style={styles.customerNameText}>{item.customerName}</Text>
                    <Text style={styles.metaText}>📞 {item.contactNo}  •  ⚡ {item.unitCapacitySelection}</Text>
                    <Text style={styles.addressText} numberOfLines={1}>📍 {item.address}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.screenWrapper}>
            {/* Top Selection Toggles */}
            <View style={styles.topToggleBar}>
                <TouchableOpacity 
                    style={[styles.toggleButton, viewMode === 'Leads' && styles.activeToggleButton]} 
                    onPress={() => handleModeChange('Leads')}
                >
                    <Text style={[styles.toggleButtonText, viewMode === 'Leads' && styles.activeToggleButtonText]}>
                        🎯 Active Leads
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.toggleButton, viewMode === 'Customers' && styles.activeToggleButton]} 
                    onPress={() => handleModeChange('Customers')}
                >
                    <Text style={[styles.toggleButtonText, viewMode === 'Customers' && styles.activeToggleButtonText]}>
                        👥 Customers
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Quick Search Filtering Field */}
            <View style={styles.searchBoxContainer}>
                <TextInput 
                    style={styles.searchInput}
                    placeholder={`Search by identifier name or code...`}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity style={styles.refreshIconBox} onPress={fetchDataPipeline}>
                    <Text style={styles.refreshIconText}>🔄</Text>
                </TouchableOpacity>
            </View>

            {/* Live Master Directory Scroller Frame */}
            {loading ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Polling field force registry database...</Text>
                </View>
            ) : (
                <FlatList 
                    data={filteredList}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderListItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>📦 No {viewMode.toLowerCase()} found matching active filter metrics.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screenWrapper: { flex: 1, backgroundColor: '#f8fafc' },
    topToggleBar: { flexDirection: 'row', backgroundColor: '#ffffff', padding: 8, marginHorizontal: 16, marginTop: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    toggleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeToggleButton: { backgroundColor: '#1e293b' },
    toggleButtonText: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
    activeToggleButtonText: { color: '#ffffff' },
    
    searchBoxContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 14, gap: 10, alignItems: 'center' },
    searchInput: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0f172a' },
    refreshIconBox: { backgroundColor: '#ffffff', width: 40, height: 40, borderRadius: 8, borderHorizontal: 1, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
    refreshIconText: { fontSize: 14 },

    listContainer: { padding: 16, paddingBottom: 30 },
    dataCardRow: { backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 12, flexDirection: 'row', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 3 },
    cardLeftBlock: { flex: 1 },
    titleCodeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    leadCodeBadge: { fontSize: 11, fontWeight: 'bold', color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    statusPillText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    customerNameText: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
    metaText: { fontSize: 12, color: '#475569', marginBottom: 6 },
    addressText: { fontSize: 11, color: '#94a3b8' },

    centerLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    loadingText: { marginTop: 12, fontSize: 13, color: '#64748b', fontWeight: '500' },
    emptyContainer: { alignItems: 'center', padding: 40 },
    emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center' }
});