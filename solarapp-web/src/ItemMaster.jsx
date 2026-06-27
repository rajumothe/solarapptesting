import React, { useState, useEffect } from 'react';
import API from './api';

const ItemMaster = () => {
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState('');
    const [capacityKW, setCapacityKW] = useState('0.00');
    const [editingId, setEditingId] = useState(null);
    const [msg, setMsg] = useState({ text: '', err: false });

    // Fetch live entries on mount
    const fetchItems = async () => {
        try {
            const res = await API.get('/masters/items');
            setItems(res.data);
        } catch (err) {
            setMsg({ text: 'Failed to sync components catalog from database.', err: true });
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await API.put(`/masters/item/${editingId}`, { itemName, capacityKW: parseFloat(capacityKW) });
                setMsg({ text: 'SKU Item modified successfully!', err: false });
                setEditingId(null);
            } else {
                await API.post('/masters/item', { itemName, capacityKW: parseFloat(capacityKW) });
                setMsg({ text: `Component "${itemName}" registered successfully!`, err: false });
            }
            setItemName('');
            setCapacityKW('0.00');
            fetchItems();
        } catch (error) {
            setMsg({ text: error.response?.data?.message || 'Error processing item.', err: true });
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setItemName(item.itemName);
        setCapacityKW(item.capacityKW);
    };

    const handleToggleStatus = async (id) => {
        try {
            await API.patch(`/masters/item/${id}/toggle`);
            setMsg({ text: 'Item availability state flipped.', err: false });
            fetchItems();
        } catch (error) {
            setMsg({ text: 'Failed to toggle status.', err: true });
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h3 style={styles.title}>🛠️ Global Component Catalog</h3>
                {msg.text && <div style={{...styles.alert, backgroundColor: msg.err ? '#fee2e2' : '#dcfce7', color: msg.err ? '#b91c1c' : '#15803d'}}>{msg.text}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Component Part Name SKU</label>
                        <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} style={styles.input} placeholder="e.g., 400W Mono Panel" required />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Capacity Value (KW)</label>
                        <input type="number" step="0.01" value={capacityKW} onChange={(e) => setCapacityKW(e.target.value)} style={styles.input} required />
                    </div>
                    <button type="submit" style={{...styles.btn, backgroundColor: editingId ? '#d97706' : '#2563eb'}}>
                        {editingId ? 'Update Component SKU' : 'Register New Component Part'}
                    </button>
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setItemName(''); setCapacityKW('0.00'); }} style={{...styles.btn, backgroundColor: '#6b7280', marginTop: '5px'}}>Cancel</button>}
                </form>

                <h4 style={{ marginTop: '30px', color: '#374151' }}>Registered Warehouse Components List</h4>
                <table style={styles.table}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Component Name</th>
                            <th style={styles.th}>Capacity (KW)</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={styles.td}>{item.id}</td>
                                <td style={styles.td}>{item.itemName}</td>
                                <td style={styles.td}>{item.capacityKW} kW</td>
                                <td style={styles.td}>
                                    <span style={{...styles.badge, backgroundColor: item.isActive ? '#dcfce7' : '#fee2e2', color: item.isActive ? '#15803d' : '#b91c1c'}}>
                                        {item.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <button onClick={() => startEdit(item)} style={styles.actionBtn}>✏️ Edit</button>
                                    <button onClick={() => handleToggleStatus(item.id)} style={{...styles.actionBtn, marginLeft: '5px'}}>🔄 Toggle</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Reusable Stylesheet Configuration
const styles = {
    container: { padding: '20px', fontFamily: 'sans-serif' },
    card: { backgroundColor: '#fff', padding: '25px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '100%', maxWidth: '800px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    title: { margin: '0 0 20px 0', fontSize: '18px', color: '#1f2937' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '10px', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' },
    alert: { padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', fontWeight: '600' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '14px', textAlign: 'left' },
    th: { padding: '10px', borderBottom: '2px solid #e5e7eb', color: '#4b5563' },
    td: { padding: '10px', color: '#1f2937' },
    badge: { padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    actionBtn: { padding: '4px 8px', border: '1px solid #d1d5db', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }
};

export default ItemMaster;