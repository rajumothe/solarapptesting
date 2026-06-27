import React, { useState, useEffect } from 'react';
import API from './api';

const PriceMaster = () => {
    const [prices, setPrices] = useState([]);
    const [groups, setGroups] = useState([]);
    const [groupMasterId, setGroupMasterId] = useState('');
    const [stateRegion, setStateRegion] = useState('');
    const [taxPercentage, setTaxPercentage] = useState('18.00');
    const [editingId, setEditingId] = useState(null);
    const [msg, setMsg] = useState({ text: '', err: false });

    const syncMatrixLedger = async () => {
        try {
            const resPrices = await API.get('/masters/prices');
            const resGroups = await API.get('/masters/groups');
            setPrices(resPrices.data);
            setGroups(resGroups.data.filter(g => g.isActive));
        } catch (error) {
            setMsg({ text: 'Error populating data streams.', err: true });
        }
    };

    useEffect(() => {
        syncMatrixLedger();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { groupMasterId: parseInt(groupMasterId), state: stateRegion, taxPercentage: parseFloat(taxPercentage) };
        try {
            if (editingId) {
                await API.put(`/masters/price/${editingId}`, payload);
                setMsg({ text: 'State pricing tax rule modified.', err: false });
                setEditingId(null);
            } else {
                await API.post('/masters/price', payload);
                setMsg({ text: 'State regional pricing details saved.', err: false });
            }
            setGroupMasterId('');
            setStateRegion('');
            setTaxPercentage('18.00');
            syncMatrixLedger();
        } catch (error) {
            setMsg({ text: 'Failed to record state pricing rules matrix.', err: true });
        }
    };

    const startPriceEdit = (p) => {
        setEditingId(p.id);
        setGroupMasterId(p.groupMasterId);
        setStateRegion(p.state);
        setTaxPercentage(p.taxPercentage);
    };

    const handleTogglePrice = async (id) => {
        try {
            await API.patch(`/masters/price/${id}/toggle`);
            setMsg({ text: 'Pricing visibility rule updated.', err: false });
            syncMatrixLedger();
        } catch (error) {
            setMsg({ text: 'Toggle execution failure.', err: true });
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h3 style={styles.title}>💰 State Price & Tax Combination Matrix</h3>
                {msg.text && <div style={{...styles.alert, backgroundColor: msg.err ? '#fee2e2' : '#dcfce7', color: msg.err ? '#b91c1c' : '#15803d'}}>{msg.text}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Select Product System Group Package</label>
                        <select value={groupMasterId} onChange={(e) => setGroupMasterId(e.target.value)} style={styles.input} required>
                            <option value="">-- Choose Package --</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.groupName}</option>)}
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>State Territory Region</label>
                        <input type="text" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} style={styles.input} placeholder="e.g., Maharashtra" required />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Regional State Tax Overlay Percentage (%)</label>
                        <input type="number" step="0.01" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)} style={styles.input} required />
                    </div>
                    <button type="submit" style={{...styles.btn, backgroundColor: editingId ? '#d97706' : '#7c3aed'}}>
                        {editingId ? 'Update Regional Overlay Matrix' : 'Bind State Tax Rule'}
                    </button>
                </form>

                <h4 style={{ marginTop: '40px', color: '#374151' }}>Configured Regional Taxes Ledger</h4>
                <table style={styles.table}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th style={styles.th}>Package Group</th>
                            <th style={styles.th}>State Location</th>
                            <th style={styles.th}>Tax Bracket</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prices.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={styles.td}>{p.GroupMaster?.groupName}</td>
                                <td style={styles.td}>{p.state}</td>
                                <td style={styles.td}>{p.taxPercentage}%</td>
                                <td style={styles.td}>
                                    <span style={{...styles.badge, backgroundColor: p.isActive ? '#dcfce7' : '#fee2e2', color: p.isActive ? '#15803d' : '#b91c1c'}}>
                                        {p.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <button onClick={() => startPriceEdit(p)} style={styles.actionBtn}>✏️ Edit</button>
                                    <button onClick={() => handleTogglePrice(p.id)} style={{...styles.actionBtn, marginLeft: '5px'}}>🔄 Toggle</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '20px', fontFamily: 'sans-serif' },
    card: { backgroundColor: '#fff', padding: '25px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '100%', maxWidth: '800px' },
    title: { margin: '0 0 20px 0', fontSize: '18px', color: '#1f2937' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box', backgroundColor: '#fff' },
    btn: { width: '100%', padding: '10px', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' },
    alert: { padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', fontWeight: '600' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '14px', textAlign: 'left' },
    th: { padding: '10px', borderBottom: '2px solid #e5e7eb', color: '#4b5563' },
    td: { padding: '10px', color: '#1f2937' },
    badge: { padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    actionBtn: { padding: '4px 8px', border: '1px solid #d1d5db', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }
};

export default PriceMaster;