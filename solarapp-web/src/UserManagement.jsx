import React, { useState, useEffect } from 'react';
import API from './api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [salesOffices, setSalesOffices] = useState([]);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        contactNo: '',
        roleId: '',
        salesOfficeId: '',
        pincodeAccess: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [accessTab, setAccessTab] = useState('pincodes'); // 'pincodes' or 'salesOffices'
    const [selectedPincodes, setSelectedPincodes] = useState([]);
    const [selectedSalesOffices, setSelectedSalesOffices] = useState([]);
    const [pincodeInput, setPincodeInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchSalesOffices();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await API.get('/auth/users');
            setUsers(response.data);
        } catch (error) {
            setMessage('Failed to fetch users: ' + (error.response?.data?.message || error.message));
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await API.get('/masters/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    const fetchSalesOffices = async () => {
        try {
            const response = await API.get('/masters/sales-offices');
            setSalesOffices(response.data);
        } catch (error) {
            console.error('Failed to fetch sales offices:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (editingId) {
                const { password, ...updateData } = formData;
                await API.put(`/auth/users/${editingId}`, updateData);
                setMessage('User updated successfully!');
            } else {
                await API.post('/auth/users', formData);
                setMessage('User created successfully!');
            }
            setFormData({
                fullName: '',
                email: '',
                password: '',
                contactNo: '',
                roleId: '',
                salesOfficeId: '',
                pincodeAccess: ''
            });
            setEditingId(null);
            fetchUsers();
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setFormData({
            fullName: user.fullName,
            email: user.email,
            password: '',
            contactNo: user.contactNo,
            roleId: user.roleId || '',
            salesOfficeId: user.salesOfficeId || '',
            pincodeAccess: user.pincodeAccess || ''
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            fullName: '',
            email: '',
            password: '',
            contactNo: '',
            roleId: '',
            salesOfficeId: '',
            pincodeAccess: ''
        });
    };

    const openAccessAssignment = async (user) => {
        setSelectedUser(user);
        setAccessTab('pincodes');
        
        // Fetch existing pincodes if role is Executive/Service Engineer
        if (['Executive', 'Service Engineer'].includes(user.Role?.roleName)) {
            try {
                const response = await API.get(`/masters/user-pincodes/${user.id}`);
                setSelectedPincodes(response.data.pincodes || []);
            } catch (error) {
                console.error('Failed to fetch user pincodes:', error);
            }
        }
        
        // Fetch existing sales offices if role is ASM/RSM
        if (['ASM', 'RSM'].includes(user.Role?.roleName)) {
            try {
                const response = await API.get(`/masters/user-sales-offices/${user.id}`);
                setSelectedSalesOffices(response.data.map(item => item.SalesOffice.id) || []);
            } catch (error) {
                console.error('Failed to fetch user sales offices:', error);
            }
        }
    };

    const addPincode = () => {
        if (pincodeInput && !selectedPincodes.includes(pincodeInput)) {
            setSelectedPincodes([...selectedPincodes, pincodeInput]);
            setPincodeInput('');
        }
    };

    const removePincode = (pincode) => {
        setSelectedPincodes(selectedPincodes.filter(p => p !== pincode));
    };

    const savePincodeAccess = async () => {
        try {
            await API.post('/masters/user-pincodes', {
                userId: selectedUser.id,
                pincodes: selectedPincodes
            });
            setMessage('Pincode access updated successfully!');
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const saveSalesOfficeAccess = async () => {
        try {
            await API.post('/masters/user-sales-offices', {
                userId: selectedUser.id,
                salesOfficeIds: selectedSalesOffices
            });
            setMessage('Sales office access updated successfully!');
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const toggleSalesOffice = (officeId) => {
        if (selectedSalesOffices.includes(officeId)) {
            setSelectedSalesOffices(selectedSalesOffices.filter(id => id !== officeId));
        } else {
            setSelectedSalesOffices([...selectedSalesOffices, officeId]);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>User Management</h2>

            {message && <div style={styles.message}>{message}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.gridRow}>
                    <div style={styles.formGroup}>
                        <label>Full Name *</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter full name"
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required={!editingId}
                            disabled={!!editingId}
                            placeholder="Enter email"
                        />
                    </div>
                </div>

                {!editingId && (
                    <div style={styles.formGroup}>
                        <label>Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required={!editingId}
                            placeholder="Enter password"
                        />
                    </div>
                )}

                <div style={styles.gridRow}>
                    <div style={styles.formGroup}>
                        <label>Contact Number</label>
                        <input
                            type="tel"
                            name="contactNo"
                            value={formData.contactNo}
                            onChange={handleInputChange}
                            placeholder="Enter contact number"
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label>Role *</label>
                        <select
                            name="roleId"
                            value={formData.roleId}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">-- Select Role --</option>
                            <option value="1">Super Admin</option>
                            <option value="2">HOD</option>
                            <option value="3">State Head</option>
                            <option value="4">RSM</option>
                            <option value="5">ASM</option>
                            <option value="6">Executive</option>
                            <option value="7">Service Engineer</option>
                        </select>
                    </div>
                </div>

                <div style={styles.gridRow}>
                    <div style={styles.formGroup}>
                        <label>Sales Office</label>
                        <select
                            name="salesOfficeId"
                            value={formData.salesOfficeId}
                            onChange={handleInputChange}
                        >
                            <option value="">-- Select Sales Office --</option>
                            {salesOffices.map(office => (
                                <option key={office.id} value={office.id}>
                                    {office.officeName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={styles.buttonGroup}>
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={handleCancel} style={styles.buttonSecondary}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div style={styles.tableContainer}>
                <h3>Existing Users</h3>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={styles.tableRow}>
                                    <td>{user.fullName}</td>
                                    <td>{user.email}</td>
                                    <td>{user.Role?.roleName || '-'}</td>
                                    <td>{user.contactNo || '-'}</td>
                                    <td>{user.isActive ? '✅ Active' : '❌ Inactive'}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td style={styles.actionButtons}>
                                        <button onClick={() => handleEdit(user)} style={styles.editBtn}>Edit</button>
                                        <button onClick={() => openAccessAssignment(user)} style={styles.accessBtn}>
                                            {['Executive', 'Service Engineer'].includes(user.Role?.roleName) ? '📍 Pincodes' : '🏢 Access'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Access Assignment Modal */}
            {selectedUser && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>Assign Access - {selectedUser.fullName} ({selectedUser.Role?.roleName})</h3>

                        {['Executive', 'Service Engineer'].includes(selectedUser.Role?.roleName) && (
                            <div>
                                <h4>📍 Pincode Access</h4>
                                <p style={styles.info}>This user can access data only for assigned pincodes</p>
                                
                                <div style={styles.pincodeInput}>
                                    <input
                                        type="text"
                                        value={pincodeInput}
                                        onChange={(e) => setPincodeInput(e.target.value)}
                                        placeholder="Enter pincode"
                                        onKeyPress={(e) => e.key === 'Enter' && addPincode()}
                                    />
                                    <button onClick={addPincode} type="button" style={styles.addBtn}>Add</button>
                                </div>

                                <div style={styles.tagContainer}>
                                    {selectedPincodes.map(pincode => (
                                        <span key={pincode} style={styles.tag}>
                                            {pincode}
                                            <button
                                                onClick={() => removePincode(pincode)}
                                                style={styles.removeTag}
                                                type="button"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <button onClick={savePincodeAccess} style={styles.saveBtn}>Save Pincode Access</button>
                            </div>
                        )}

                        {['ASM', 'RSM'].includes(selectedUser.Role?.roleName) && (
                            <div>
                                <h4>🏢 Sales Office Access</h4>
                                <p style={styles.info}>This user can access these sales offices and their territories</p>

                                <div style={styles.officeCheckboxes}>
                                    {salesOffices.map(office => (
                                        <label key={office.id} style={styles.checkbox}>
                                            <input
                                                type="checkbox"
                                                checked={selectedSalesOffices.includes(office.id)}
                                                onChange={() => toggleSalesOffice(office.id)}
                                            />
                                            {office.officeName} ({office.location})
                                        </label>
                                    ))}
                                </div>

                                <button onClick={saveSalesOfficeAccess} style={styles.saveBtn}>Save Sales Office Access</button>
                            </div>
                        )}

                        <button onClick={() => setSelectedUser(null)} style={styles.closeBtn}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '20px', maxWidth: '1400px', margin: '0 auto' },
    title: { fontSize: '24px', color: '#1f2937', marginBottom: '20px' },
    message: { padding: '12px', marginBottom: '15px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af', textAlign: 'center' },
    form: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    gridRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    formGroup: { marginBottom: '15px', display: 'flex', flexDirection: 'column' },
    buttonGroup: { display: 'flex', gap: '10px', marginTop: '20px' },
    button: { flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' },
    buttonSecondary: { flex: 1, padding: '10px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    tableContainer: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', minWidth: '900px' },
    tableHeader: { backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' },
    tableRow: { borderBottom: '1px solid #e5e7eb' },
    actionButtons: { display: 'flex', gap: '5px' },
    editBtn: { padding: '5px 10px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' },
    accessBtn: { padding: '5px 10px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' },
    info: { color: '#6b7280', fontSize: '14px', marginBottom: '15px' },
    pincodeInput: { display: 'flex', gap: '10px', marginBottom: '15px' },
    addBtn: { padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' },
    tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' },
    tag: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' },
    removeTag: { background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '16px', padding: 0 },
    officeCheckboxes: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' },
    checkbox: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    saveBtn: { width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', marginBottom: '10px' },
    closeBtn: { width: '100%', padding: '10px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default UserManagement;
