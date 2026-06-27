import React, { useState, useEffect } from 'react';
import API from './api';

const SalesOfficeMaster = () => {
    const [salesOffices, setSalesOffices] = useState([]);
    const [plants, setPlants] = useState([]);
    const [formData, setFormData] = useState({
        officeCode: '',
        officeName: '',
        location: '',
        state: '',
        plantId: '',
        headOfOffice: '',
        contactNo: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSalesOffices();
        fetchPlants();
    }, []);

    const fetchSalesOffices = async () => {
        try {
            const response = await API.get('/masters/sales-offices');
            setSalesOffices(response.data);
        } catch (error) {
            setMessage('Failed to fetch sales offices: ' + (error.response?.data?.message || error.message));
        }
    };

    const fetchPlants = async () => {
        try {
            const response = await API.get('/masters/plants');
            setPlants(response.data);
        } catch (error) {
            console.error('Failed to fetch plants:', error);
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
                await API.put(`/masters/sales-office/${editingId}`, formData);
                setMessage('Sales office updated successfully!');
            } else {
                await API.post('/masters/sales-office', formData);
                setMessage('Sales office created successfully!');
            }
            setFormData({
                officeCode: '',
                officeName: '',
                location: '',
                state: '',
                plantId: '',
                headOfOffice: '',
                contactNo: ''
            });
            setEditingId(null);
            fetchSalesOffices();
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (office) => {
        setEditingId(office.id);
        setFormData({
            officeCode: office.officeCode,
            officeName: office.officeName,
            location: office.location,
            state: office.state,
            plantId: office.plantId,
            headOfOffice: office.headOfOffice,
            contactNo: office.contactNo
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            officeCode: '',
            officeName: '',
            location: '',
            state: '',
            plantId: '',
            headOfOffice: '',
            contactNo: ''
        });
    };

    const handleToggleStatus = async (id) => {
        try {
            await API.patch(`/masters/sales-office/${id}/toggle`);
            fetchSalesOffices();
            setMessage('Sales office status updated successfully!');
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Sales Office Management</h2>

            {message && <div style={styles.message}>{message}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.gridRow}>
                    <div style={styles.formGroup}>
                        <label>Office Code *</label>
                        <input
                            type="text"
                            name="officeCode"
                            value={formData.officeCode}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., SO-HYD-001"
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label>Office Name *</label>
                        <input
                            type="text"
                            name="officeName"
                            value={formData.officeName}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter office name"
                        />
                    </div>
                </div>

                <div style={styles.gridRow}>
                    <div style={styles.formGroup}>
                        <label>Location *</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter location"
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label>State *</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter state"
                        />
                    </div>
                </div>

                <div style={styles.gridRow}>
                    <div style={styles.formGroup}>
                        <label>Plant *</label>
                        <select
                            name="plantId"
                            value={formData.plantId}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">-- Select Plant --</option>
                            {plants.map(plant => (
                                <option key={plant.id} value={plant.id}>
                                    {plant.plantName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label>Head of Office</label>
                        <input
                            type="text"
                            name="headOfOffice"
                            value={formData.headOfOffice}
                            onChange={handleInputChange}
                            placeholder="Enter name"
                        />
                    </div>
                </div>

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

                <div style={styles.buttonGroup}>
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Saving...' : editingId ? 'Update Office' : 'Create Office'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={handleCancel} style={styles.buttonSecondary}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div style={styles.tableContainer}>
                <h3>Existing Sales Offices</h3>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeader}>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Location</th>
                            <th>State</th>
                            <th>Plant</th>
                            <th>Head</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesOffices.map(office => (
                            <tr key={office.id} style={styles.tableRow}>
                                <td>{office.officeCode}</td>
                                <td>{office.officeName}</td>
                                <td>{office.location}</td>
                                <td>{office.state}</td>
                                <td>{office.Plant?.plantName || '-'}</td>
                                <td>{office.headOfOffice || '-'}</td>
                                <td>{office.isActive ? '✅ Active' : '❌ Inactive'}</td>
                                <td>
                                    <button onClick={() => handleEdit(office)} style={styles.editBtn}>Edit</button>
                                    <button onClick={() => handleToggleStatus(office.id)} style={styles.toggleBtn}>
                                        {office.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
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
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    title: { fontSize: '24px', color: '#1f2937', marginBottom: '20px' },
    message: { padding: '12px', marginBottom: '15px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af', textAlign: 'center' },
    form: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    gridRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    formGroup: { marginBottom: '15px', display: 'flex', flexDirection: 'column' },
    buttonGroup: { display: 'flex', gap: '10px', marginTop: '20px' },
    button: { flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' },
    buttonSecondary: { flex: 1, padding: '10px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    tableContainer: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
    tableHeader: { backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' },
    tableRow: { borderBottom: '1px solid #e5e7eb' },
    editBtn: { padding: '5px 10px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' },
    toggleBtn: { padding: '5px 10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }
};

export default SalesOfficeMaster;
