import React, { useState, useEffect } from 'react';
import API from './api';

const LeadManagement = () => {
    // Lead Pipeline Lists State
    const [leads, setLeads] = useState([]);
    const [groups, setGroups] = useState([]);

    // Lead Creation Form State
    const [customerName, setCustomerName] = useState('');
    const [contactNo, setContactNo] = useState('');
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');
    const [unitCapacitySelection, setUnitCapacitySelection] = useState('');

    // KYC Compliance Modal/Form State
    const [activeKycLead, setActiveKycLead] = useState(null); // When selected, opens document safe
    const [aadharNo, setAadharNo] = useState('');
    const [panNo, setPanNo] = useState('');
    const [ebBillNo, setEbBillNo] = useState('');
    const [bankAccountNo, setBankAccountNo] = useState('');

    const [msg, setMsg] = useState({ text: '', err: false });

    // Fetch live entries stream
    const syncPipelineDashboard = async () => {
        try {
            const resLeads = await API.get('/dashboard/metrics'); // Can be expanded or replaced with direct listings later
            const resGroups = await API.get('/masters/groups');
            setGroups(resGroups.data.filter(g => g.isActive));
            
            // For development testing, let's fetch leads directly if endpoint ready, otherwise fallback
            // Let's create an inline fallback array or directly read structured responses
            const resDirectLeads = await API.get('/leads/list').catch(() => null);
            if (resDirectLeads) setLeads(resDirectLeads.data);
        } catch (err) {
            console.log("Sync check carried through safely.");
        }
    };

    useEffect(() => {
        syncPipelineDashboard();
        // Fallback mockup listener for testing local data parameters
        setLeads([
            { id: 101, customerName: "Rajesh Kumar", contactNo: "9876543210", pincode: "500001", unitCapacitySelection: "3KW On-Grid Package", status: "Lead Created" },
            { id: 102, customerName: "Ananya Sharma", contactNo: "8123456789", pincode: "500002", unitCapacitySelection: "5KW Off-Grid Bundle", status: "Processing" }
        ]);
    }, []);

    const handleCreateLead = async (e) => {
        e.preventDefault();
        try {
            const payload = { customerName, contactNo, address, pincode, unitCapacitySelection };
            await API.post('/leads/create', payload);
            setMsg({ text: `Lead for "${customerName}" logged securely on territory grid.`, err: false });
            setCustomerName(''); setContactNo(''); setAddress(''); setPincode(''); setUnitCapacitySelection('');
            syncPipelineDashboard();
        } catch (err) {
            setMsg({ text: 'Failed to ingest target lead.', err: true });
        }
    };

    const handleFileKYC = async (e) => {
        e.preventDefault();
        try {
            const payload = { leadId: activeKycLead.id, aadharNo, panNo, ebBillNo, bankAccountNo };
            await API.post('/leads/convert-kyc', payload);
            setMsg({ text: `KYC Compliance Files compiled for Lead #${activeKycLead.id}! Status shifted to Processing.`, err: false });
            setActiveKycLead(null);
            setAadharNo(''); setPanNo(''); setEbBillNo(''); setBankAccountNo('');
            syncPipelineDashboard();
        } catch (err) {
            setMsg({ text: 'KYC Document upload submission failed.', err: true });
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Field Force Automation (FFA) Hub</h2>
            <p style={styles.subtext}>Executive Pipeline Capture & KYC Document Compliance Desk</p>

            {msg.text && <div style={{...styles.alert, backgroundColor: msg.err ? '#fee2e2' : '#dcfce7', color: msg.err ? '#b91c1c' : '#15803d'}}>{msg.text}</div>}

            <div style={styles.layoutSplit}>
                {/* PART 1: FRESH LEAD CAPTURE FORM */}
                <div style={styles.formSection}>
                    <div style={styles.card}>
                        <h4 style={styles.cardTitle}>👤 Capture Fresh Pipeline Target Lead</h4>
                        <form onSubmit={handleCreateLead}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Customer Full Name</label>
                                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={styles.input} required placeholder="e.g., Rajesh Kumar" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Contact Telephone Number</label>
                                <input type="text" value={contactNo} onChange={(e) => setContactNo(e.target.value)} style={styles.input} required placeholder="e.g., 9876543210" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Site Installation Address</label>
                                <textarea value={address} onChange={(e) => setAddress(e.target.value)} style={{...styles.input, height: '60px'}} required placeholder="Enter clear location site address details..." />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Site Territory Pincode</label>
                                <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} style={styles.input} required placeholder="6-Digit Code" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>System Capacity Load Selection</label>
                                <select value={unitCapacitySelection} onChange={(e) => setUnitCapacitySelection(e.target.value)} style={styles.input} required>
                                    <option value="">-- Select Linked Group Package --</option>
                                    {groups.map(g => <option key={g.id} value={g.groupName}>{g.groupName}</option>)}
                                    <option value="3KW On-Grid Package">3KW On-Grid Package (Dev Fallback)</option>
                                    <option value="5KW Off-Grid Bundle">5KW Off-Grid Bundle (Dev Fallback)</option>
                                </select>
                            </div>
                            <button type="submit" style={styles.btnPrimary}>Ingest Lead Record</button>
                        </form>
                    </div>
                </div>

                {/* PART 2: PIPELINE MONITOR TRACKER TABLE */}
                <div style={styles.tableSection}>
                    <div style={styles.card}>
                        <h4 style={styles.cardTitle}>📈 Live Territory Sales Pipeline Ledger</h4>
                        <table style={styles.table}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Customer</th>
                                    <th style={styles.th}>Capacity Selection</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Compliance Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => (
                                    <tr key={lead.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={styles.td}>#{lead.id}</td>
                                        <td style={styles.td}>
                                            <strong>{lead.customerName}</strong><br/>
                                            <span style={{ fontSize: '11px', color: '#6b7280' }}>{lead.contactNo} | PIN: {lead.pincode}</span>
                                        </td>
                                        <td style={styles.td}>{lead.unitCapacitySelection}</td>
                                        <td style={styles.td}>
                                            <span style={{...styles.badge, backgroundColor: lead.status === 'Converted' ? '#dcfce7' : '#fef3c7', color: lead.status === 'Converted' ? '#15803d' : '#d97706'}}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {lead.status === 'Lead Created' ? (
                                                <button onClick={() => setActiveKycLead(lead)} style={styles.actionBtn}>📋 File KYC</button>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>In Verification Queue</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* FLOATING KYC DOCUMENT VAULT DIALOG BOX */}
            {activeKycLead && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Compliance Vault: Upload Customer KYC Docs</h4>
                        <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '20px' }}>Filing mandatory structural audit validation papers for <strong>{activeKycLead.customerName} (Lead #{activeKycLead.id})</strong></p>
                        
                        <form onSubmit={handleFileKYC}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Aadhar Card Identification Number</label>
                                <input type="text" value={aadharNo} onChange={(e) => setAadharNo(e.target.value)} style={styles.input} required placeholder="12-Digit UIDAI Number" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Permanent Account Number (PAN)</label>
                                <input type="text" value={panNo} onChange={(e) => setPanNo(e.target.value)} style={styles.input} required placeholder="10-Digit Alphanumeric Code" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Electricity Board (EB) Consumer Account Number</label>
                                <input type="text" value={ebBillNo} onChange={(e) => setEbBillNo(e.target.value)} style={styles.input} required placeholder="Consumer Service Reference ID" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Customer Bank Account Number</label>
                                <input type="text" value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} style={styles.input} required placeholder="Disbursal Checking Account Number" />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" style={{...styles.btnPrimary, flex: 1}}>Submit to Management for Review</button>
                                <button type="button" onClick={() => setActiveKycLead(null)} style={{...styles.btnPrimary, backgroundColor: '#9ca3af', flex: 1}}>Close Safe</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '20px', fontFamily: 'sans-serif' },
    header: { margin: '0 0 5px 0', color: '#111827' },
    subtext: { margin: '0 0 25px 0', color: '#4b5563', fontSize: '14px' },
    layoutSplit: { display: 'flex', flexDirection: 'row', gap: '30px', flexWrap: 'wrap' },
    formSection: { flex: '1', minWidth: '320px' },
    tableSection: { flex: '2', minWidth: '450px' },
    card: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 20px 0', fontSize: '15px', color: '#1f2937', fontWeight: '700' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' },
    input: { width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '14px' },
    btnPrimary: { width: '100%', padding: '11px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' },
    alert: { padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
    th: { padding: '12px 10px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontWeight: '600' },
    td: { padding: '12px 10px', color: '#1f2937', verticalAlign: 'top' },
    badge: { padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
    actionBtn: { padding: '5px 10px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 100 },
    modalCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '6px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
};

export default LeadManagement;