import React, { useState, useEffect } from 'react';
import API from './api';

const PlantMaster = () => {
    const [plants, setPlants] = useState([]);
    const [formData, setFormData] = useState({
        plantName: '',
        location: '',
        state: '',
        contactNo: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPlants();
    }, []);

    const fetchPlants = async () => {
        try {
            const response = await API.get('/masters/plants');
            setPlants(response.data);
        } catch (error) {
            setMessage('Failed to fetch plants: ' + (error.response?.data?.message || error.message));
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
                await API.put(`/masters/plant/${editingId}`, formData);
                setMessage('Plant updated successfully!');
            } else {
                await API.post('/masters/plant', formData);
                setMessage('Plant created successfully!');
            }
            setFormData({ plantName: '', location: '', state: '', contactNo: '' });
            setEditingId(null);
            fetchPlants();
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (plant) => {
        setEditingId(plant.id);
        setFormData({
            plantName: plant.plantName,
            location: plant.location,
            state: plant.state,
            contactNo: plant.contactNo
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ plantName: '', location: '', state: '', contactNo: '' });
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await API.patch(`/masters/plant/${id}/toggle`);
            fetchPlants();
            setMessage('Plant status updated successfully!');
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Manufacturing Plant Management</h2>

            {message && <div style={styles.message}>{message}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label>Plant Name *</label>
                    <input
                        type="text"
                        name="plantName"
                        value={formData.plantName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter plant name"
                    />
                </div>

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
                        {loading ? 'Saving...' : editingId ? 'Update Plant' : 'Create Plant'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={handleCancel} style={styles.buttonSecondary}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div style={styles.tableContainer}>
                <h3>Existing Plants</h3>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeader}>
                            <th>Plant Name</th>
                            <th>Location</th>
                            <th>State</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plants.map(plant => (
                            <tr key={plant.id} style={styles.tableRow}>
                                <td>{plant.plantName}</td>
                                <td>{plant.location}</td>
                                <td>{plant.state}</td>
                                <td>{plant.contactNo}</td>
                                <td>{plant.isActive ? '✅ Active' : '❌ Inactive'}</td>
                                <td>
                                    <button onClick={() => handleEdit(plant)} style={styles.editBtn}>Edit</button>
                                    <button onClick={() => handleToggleStatus(plant.id, plant.isActive)} style={styles.toggleBtn}>
                                        {plant.isActive ? 'Deactivate' : 'Activate'}
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
    formGroup: { marginBottom: '15px' },
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

export default PlantMaster;
