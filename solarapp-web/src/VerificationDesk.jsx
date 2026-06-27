import React, { useState, useEffect } from 'react';
import API from './api';

const VerificationDesk = () => {
    const [pipeline, setPipeline] = useState([]);
    const [msg, setMsg] = useState({ text: '', err: false });
    const user = JSON.parse(localStorage.getItem('solar_user') || '{}');

    const loadVerificationQueue = async () => {
        try {
            const res = await API.get('/leads/list');
            setPipeline(res.data);
        } catch (err) {
            setMsg({ text: 'Error downloading verification queue streams.', err: true });
        }
    };

    useEffect(() => {
        loadVerificationQueue();
    }, []);

    // FIX: Aligned parameters and payload variables with backend expecting 'leadId' and 'approvalDecision'
    const handleAsmAction = async (leadId, decision) => {
        try {
            await API.post('/leads/asm-approve', { 
                leadId: parseInt(leadId), 
                approvalDecision: decision 
            });
            setMsg({ text: `ASM Checkpoint updated successfully as [${decision}].`, err: false });
            loadVerificationQueue();
        } catch (err) {
            const errorText = err.response?.data?.message || 'Failed to record ASM decision.';
            setMsg({ text: `ASM Error: ${errorText}`, err: true });
        }
    };

    // FIX: Aligned parameters and payload variables with backend expecting 'leadId' and 'approvalDecision'
    const handleBackOfficeAction = async (leadId, finalDecision) => {
        try {
            const response = await API.post('/leads/backoffice-verify', { 
                leadId: parseInt(leadId), 
                approvalDecision: finalDecision 
            });
            
            let successMsg = `Back Office processing concluded as [${finalDecision}].`;
            if (response.data?.customerCode) {
                successMsg += ` Generated Customer Master Code: ${response.data.customerCode}`;
            }

            setMsg({ text: successMsg, err: false });
            loadVerificationQueue();
        } catch (err) {
            const errorText = err.response?.data?.message || 'Back office verification update aborted.';
            setMsg({ text: `Back Office Error: ${errorText}`, err: true });
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Compliance Verification & Loan Processing Desk</h2>
            <p style={styles.subtext}>Operational workflows for ASM validations and Back Office compliance approvals.</p>

            {msg.text && <div style={{...styles.alert, backgroundColor: msg.err ? '#fee2e2' : '#dcfce7', color: msg.err ? '#b91c1c' : '#15803d'}}>{msg.text}</div>}

            <div style={styles.card}>
                <h4 style={styles.cardTitle}>📋 Pending Organizational Verification Ledger</h4>
                <table style={styles.table}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th style={styles.th}>Lead Details</th>
                            <th style={styles.th}>KYC Documents Vault</th>
                            <th style={styles.th}>ASM Status</th>
                            <th style={styles.th}>Back Office Status</th>
                            <th style={styles.th}>Actions Enforced</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pipeline.map(row => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={styles.td}>
                                    <strong>{row.customerName}</strong><br/>
                                    <span style={{ fontSize: '12px', color: '#4b5563' }}>PIN: {row.pincode} | Selection: {row.unitCapacitySelection}</span>
                                    {row.customerCode && <div style={{ marginTop: '4px', color: '#2563eb', fontWeight: 'bold' }}>🎫 {row.customerCode}</div>}
                                </td>
                                <td style={styles.td}>
                                    {row.CustomerKYC ? (
                                        <div style={{ fontSize: '12px', color: '#374151' }}>
                                            🪪 Aadhaar: [Protected]<br/>
                                            💳 PAN: {row.CustomerKYC.panNo}<br/>
                                            ⚡ EB Bill No: {row.CustomerKYC.ebBillNo}<br/>
                                            🏦 Bank Acc: {row.CustomerKYC.bankAccountNo}
                                        </div>
                                    ) : (
                                        <span style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: '12px' }}>Awaiting executive document filing</span>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    <span style={{...styles.badge, backgroundColor: row.CustomerKYC?.asmApprovalStatus === 'Approved' ? '#dcfce7' : '#fee2e2', color: row.CustomerKYC?.asmApprovalStatus === 'Approved' ? '#15803d' : '#b91c1c'}}>
                                        {row.CustomerKYC?.asmApprovalStatus || 'N/A'}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <span style={{...styles.badge, backgroundColor: row.status === 'Converted' ? '#dcfce7' : '#fef3c7', color: row.status === 'Converted' ? '#15803d' : '#d97706'}}>
                                        {row.status === 'Converted' ? 'Verified' : (row.CustomerKYC?.backOfficeStatus || 'Under Review')}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    {row.CustomerKYC && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {/* ASM Action Controls (Pass row.id which maps to leadId context) */}
                                            {['Super Admin', 'ASM', 'RSM'].includes(user.role) && row.status === 'Pending ASM' && (
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <button onClick={() => handleAsmAction(row.id, 'Approved')} style={{...styles.actionBtn, backgroundColor: '#10b981', color: '#fff'}}>🟢 ASM Approve</button>
                                                    <button onClick={() => handleAsmAction(row.id, 'Rejected')} style={{...styles.actionBtn, backgroundColor: '#ef4444', color: '#fff'}}>🛑 Reject</button>
                                                </div>
                                            )}
                                            {/* Back Office Action Controls (Pass row.id which maps to leadId context) */}
                                            {['Super Admin', 'Department Admin'].includes(user.role) && row.status === 'Pending Back Office' && (
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <button onClick={() => handleBackOfficeAction(row.id, 'Approved')} style={{...styles.actionBtn, backgroundColor: '#2563eb', color: '#fff'}}>🏢 Verify & Convert</button>
                                                    <button onClick={() => handleBackOfficeAction(row.id, 'Rejected')} style={{...styles.actionBtn, backgroundColor: '#ef4444', color: '#fff'}}>🛑 Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
    header: { margin: '0 0 5px 0', color: '#111827' },
    subtext: { margin: '0 0 25px 0', color: '#4b5563', fontSize: '14px' },
    card: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 20px 0', fontSize: '15px', color: '#1f2937', fontWeight: '700' },
    alert: { padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
    th: { padding: '12px 10px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontWeight: '600' },
    td: { padding: '12px 10px', color: '#1f2937', verticalAlign: 'middle' },
    badge: { padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
    actionBtn: { padding: '4px 6px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '11px' }
};

export default VerificationDesk;