import React, { useState, useEffect } from 'react';
import API from './api';

const GroupMaster = () => {
    const [groups, setGroups] = useState([]);
    const [availableItems, setAvailableItems] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [selectedItems, setSelectedItems] = useState([]); 
    const [currentItemId, setCurrentItemId] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [msg, setMsg] = useState({ text: '', err: false });

    const loadData = async () => {
        try {
            const resGroups = await API.get('/masters/groups');
            const resItems = await API.get('/masters/items');
            setGroups(resGroups.data);
            setAvailableItems(resItems.data.filter(i => i.isActive));
        } catch (err) {
            setMsg({ text: 'Error tracking system configuration links.', err: true });
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const addItemLine = () => {
        if (!currentItemId || !currentPrice) return;
        const matched = availableItems.find(i => i.id === parseInt(currentItemId));
        if (selectedItems.some(i => i.itemId === matched.id)) return;

        setSelectedItems([...selectedItems, { itemId: matched.id, itemName: matched.itemName, basePrice: parseFloat(currentPrice) }]);
        setCurrentItemId('');
        setCurrentPrice('');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) return setMsg({ text: 'Link at least one item asset line.', err: true });

        try {
            if (editingId) {
                await API.put(`/masters/group/${editingId}`, { groupName, selectedItems });
                setMsg({ text: 'System package group modified cleanly.', err: false });
                setEditingId(null);
            } else {
                await API.post('/masters/group', { groupName, selectedItems });
                setMsg({ text: `Package Group "${groupName}" built and saved successfully!`, err: false });
            }
            setGroupName('');
            setSelectedItems([]);
            loadData();
        } catch (error) {
            setMsg({ text: 'Failed to register bundle layout.', err: true });
        }
    };

    const handleToggleGroup = async (id) => {
        try {
            await API.patch(`/masters/group/${id}/toggle`);
            setMsg({ text: 'Package availability parameter adjusted.', err: false });
            loadData();
        } catch (error) {
            setMsg({ text: 'Toggle operation failed.', err: true });
        }
    };

    const startGroupEdit = (g) => {
        setEditingId(g.id);
        setGroupName(g.groupName);
        const preMapped = g.ItemMasters.map(i => ({
            itemId: i.id,
            itemName: i.itemName,
            basePrice: i.GroupItemSpecification.basePrice
        }));
        setSelectedItems(preMapped);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h3 style={styles.title}>📦 Group Assembler & Bill of Materials</h3>
                {msg.text && <div style={{...styles.alert, backgroundColor: msg.err ? '#fee2e2' : '#dcfce7', color: msg.err ? '#b91c1c' : '#15803d'}}>{msg.text}</div>}
                
                <form onSubmit={handleFormSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>System Package Group Title</label>
                        <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} style={styles.input} placeholder="e.g., 5KW Premium Grid Combo" required />
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb', marginBottom: '15px' }}>
                        <h5>Map Shared Components inside Group Box</h5>
                        <div style={styles.formGroup}>
                            <select value={currentItemId} onChange={(e) => setCurrentItemId(e.target.value)} style={styles.input}>
                                <option value="">-- Choose Component Part --</option>
                                {availableItems.map(i => <option key={i.id} value={i.id}>{i.itemName}</option>)}
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <input type="number" placeholder="Component base cost in this group (INR)" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} style={styles.input} />
                        </div>
                        <button type="button" onClick={addItemLine} style={{...styles.btn, backgroundColor: '#4b5563'}}>Link Item Line to Group List</button>
                    </div>

                    {selectedItems.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={styles.label}>Allocated Package Components Breakdown:</label>
                            <ul>
                                {selectedItems.map((item, idx) => (
                                    <li key={idx} style={{ fontSize: '13px', color: '#374151' }}>
                                        {item.itemName} — <strong>₹{item.basePrice}</strong>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button type="submit" style={{...styles.btn, backgroundColor: editingId ? '#d97706' : '#059669'}}>
                        {editingId ? 'Lock Group Package Overwrite' : 'Save System Group Layout'}
                    </button>
                </form>

                <h4 style={{ marginTop: '40px', color: '#374151' }}>Active Corporate System Groups</h4>
                {groups.map(g => (
                    <div key={g.id} style={{ border: '1px solid #e5e7eb', padding: '15px', borderRadius: '4px', marginBottom: '10px', backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>{g.groupName}</strong>
                            <div>
                                <button onClick={() => startGroupEdit(g)} style={styles.actionBtn}>✏️ Edit</button>
                                <button onClick={() => handleToggleGroup(g.id)} style={{...styles.actionBtn, marginLeft: '5px'}}>{g.isActive ? '🛑 Disable' : '🟢 Enable'}</button>
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                            Linked SKUs: {g.ItemMasters?.map(i => `${i.itemName} (₹${i.GroupItemSpecification.basePrice})`).join(', ') || 'None'}
                        </div>
                    </div>
                ))}
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
    input: { width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '10px', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' },
    alert: { padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', fontWeight: '600' },
    actionBtn: { padding: '4px 8px', border: '1px solid #d1d5db', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }
};

export default GroupMaster;