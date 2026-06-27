import React, { useState, useEffect } from 'react';
import API from './api';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [convertedLeads, setConvertedLeads] = useState([]);
    
    // Ingestion Form State
    const [leadId, setLeadId] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [loanRequired, setLoanRequired] = useState(false);
    const [allocatedPincode, setAllocatedPincode] = useState('');

    // Payment Collection Action Modal State
    const [activeOrderPayment, setActiveOrderPayment] = useState(null);
    const [amountCollected, setAmountCollected] = useState('');
    const [paymentMode, setPaymentMode] = useState('Online');
    const [transactionReference, setTransactionReference] = useState('');

    const [msg, setMsg] = useState({ text: '', err: false });
    const user = JSON.parse(localStorage.getItem('solar_user') || '{}');

    const syncOrderLedgers = async () => {
        try {
            // Fetch workflow leads list to find verified profiles ready for order ingestion
            const resLeads = await API.get('/leads/list');
            setConvertedLeads(resLeads.data.filter(l => l.status === 'Converted' || l.status === 'Processing'));
            
            // Fetch live order grid from backend (if listing endpoint active, or fallback for visualization)
            const resOrders = await API.get('/orders/list').catch(() => null);
            if (resOrders) {
                setOrders(resOrders.data);
            } else {
                // Development fallback mockup array matching structural schema parameters
                setOrders([
                    { id: 5001, leadId: 101, customerId: 991, totalAmount: 165000.00, loanRequired: true, loanStatus: 'Applied', orderStatus: 'Order Received', allocatedPincode: '500001', Lead: { customerName: 'Rajesh Kumar' } }
                ]);
            }
        } catch (err) {
            console.log('Syncing data stream safely.');
        }
    };

    useEffect(() => {
        syncOrderLedgers();
    }, []);

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        try {
            const payload = { 
                leadId: parseInt(leadId), 
                customerId: parseInt(leadId), // Mapping placeholder link context
                totalAmount: parseFloat(totalAmount), 
                loanRequired, 
                allocatedPincode 
            };
            await API.post('/orders/receipt', payload);
            setMsg({ text: 'Order receipt successfully ingested onto corporate core.', err: false });
            setLeadId(''); setTotalAmount(''); setLoanRequired(false); setAllocatedPincode('');
            syncOrderLedgers();
        } catch (err) {
            setMsg({ text: 'Failed to ingest order details.', err: true });
        }
    };

    const handleUpdateLoan = async (orderId, targetStatus) => {
        try {
            await API.post('/orders/update-loan', { orderId, targetLoanStatus: targetStatus });
            setMsg({ text: `Loan state advanced to: [${targetStatus}].`, err: false });
            syncOrderLedgers();
        } catch (err) {
            setMsg({ text: 'Loan status modify aborted.', err: true });
        }
    };

    const handleGenerateInvoice = async (order) => {
        try {
            await API.post('/orders/generate-invoice', { 
                orderId: order.id, 
                basePrice: order.totalAmount * 0.847, // Compute pre-tax back-math calculation
                taxPercentage: 18.00 
            });
            setMsg({ text: `Commercial Invoice generated and locked for Order #${order.id}!`, err: false });
            syncOrderLedgers();
        } catch (err) {
            setMsg({ text: 'Failed to generate tax invoice.', err: true });
        }
    };

    const handleCollectPaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/orders/collect-payment', {
                orderId: activeOrderPayment.id,
                amountCollected: parseFloat(amountCollected),
                paymentMode,
                transactionReference
            });
            setMsg({ text: `Payment collection of ₹${amountCollected} registered successfully!`, err: false });
            setActiveOrderPayment(null);
            setAmountCollected(''); setTransactionReference('');
            syncOrderLedgers();
        } catch (err) {
            setMsg({ text: 'Failed to record payment.', err: true });
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Order Management & Commercial Billing Desk</h2>
            <p style={styles.subtext}>Log order transactions, handle financing gates, collect payments, and generate invoices.</p>

            {msg.text && <div style={{...styles.alert, backgroundColor: msg.err ? '#fee2e2' : '#dcfce7', color: msg.err ? '#b91c1c' : '#15803d'}}>{msg.text}</div>}

            <div style={styles.layoutSplit}>
                {/* PART 1: INGEST FRESH ORDER RECEIPT */}
                <div style={styles.formSection}>
                    <div style={styles.card}>
                        <h4 style={styles.cardTitle}>🛍️ Ingest New Customer Order Receipt</h4>
                        <form onSubmit={handleCreateOrder}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Select Verified Customer Target</label>
                                <select value={leadId} onChange={(e) => setLeadId(e.target.value)} style={styles.input} required>
                                    <option value="">-- Choose Profile --</option>
                                    {convertedLeads.map(l => (
                                        <option key={l.id} value={l.id}>{l.customerName} (Lead #{l.id})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Total Contract Deal Value (INR)</label>
                                <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} style={styles.input} required placeholder="e.g., 165000.00" />
                            </div>
                            <div style={{...styles.formGroup, display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px'}}>
                                <input type="checkbox" checked={loanRequired} onChange={(e) => setLoanRequired(e.target.checked)} id="loanBox" />
                                <label htmlFor="loanBox" style={{ fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Bank Loan Finance Facilitation Required</label>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Deployment Pincode</label>
                                <input type="text" value={allocatedPincode} onChange={(e) => setAllocatedPincode(e.target.value)} style={styles.input} required placeholder="6-Digit Code" />
                            </div>
                            <button type="submit" style={styles.btnSuccess}>Ingest Corporate Order</button>
                        </form>
                    </div>
                </div>

                {/* PART 2: LIVE ORDERS MONITOR GRID */}
                <div style={styles.tableSection}>
                    <div style={styles.card}>
                        <h4 style={styles.cardTitle}>📊 Live Enterprise Orders Ledger</h4>
                        <table style={styles.table}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={styles.th}>Order ID</th>
                                    <th style={styles.th}>Customer Profile</th>
                                    <th style={styles.th}>Deal Value</th>
                                    <th style={styles.th}>Financing State</th>
                                    <th style={styles.th}>Actions Queue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={styles.td}>#{order.id}</td>
                                        <td style={styles.td}>
                                            <strong>{order.Lead?.customerName || 'Retail Customer'}</strong><br/>
                                            <span style={{ fontSize: '11px', color: '#6b7280' }}>PIN: {order.allocatedPincode}</span>
                                        </td>
                                        <td style={styles.td}>₹{parseFloat(order.totalAmount).toLocaleString()}</td>
                                        <td style={styles.td}>
                                            <span style={{...styles.badge, backgroundColor: order.loanStatus === 'Disbursed' || order.loanStatus === 'Not Applicable' ? '#dcfce7' : '#fef3c7', color: order.loanStatus === 'Disbursed' || order.loanStatus === 'Not Applicable' ? '#15803d' : '#d97706'}}>
                                                Loan: {order.loanStatus}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                {/* Back Office Loan Triggers */}
                                                {['Super Admin', 'Department Admin'].includes(user.role) && order.loanStatus === 'Applied' && (
                                                    <button onClick={() => handleUpdateLoan(order.id, 'Approved')} style={{...styles.actionBtn, backgroundColor: '#059669', color: '#fff'}}>🟢 Approve Loan</button>
                                                )}
                                                {['Super Admin', 'Department Admin'].includes(user.role) && order.loanStatus === 'Approved' && (
                                                    <button onClick={() => handleUpdateLoan(order.id, 'Disbursed')} style={{...styles.actionBtn, backgroundColor: '#10b981', color: '#fff'}}>💰 Disburse Loan</button>
                                                )}
                                                {/* Payment Collection Action */}
                                                <button onClick={() => setActiveOrderPayment(order)} style={{...styles.actionBtn, backgroundColor: '#2563eb', color: '#fff'}}>📥 Collect Payment</button>
                                                {/* Invoicing Trigger */}
                                                {['Super Admin', 'Department Admin'].includes(user.role) && (
                                                    <button onClick={() => handleGenerateInvoice(order)} style={{...styles.actionBtn, backgroundColor: '#7c3aed', color: '#fff'}}>🧾 Print Invoice</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* FLOATING PAYMENT INGESTION DIALOG MODAL */}
            {activeOrderPayment && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <h4 style={{ margin: '0 0 10px 0' }}>Record Revenue Collection Entry</h4>
                        <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '15px' }}>Logging incoming revenue lines for Order <strong>#{activeOrderPayment.id}</strong></p>
                        <form onSubmit={handleCollectPaymentSubmit}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Amount Collected (INR)</label>
                                <input type="number" step="0.01" value={amountCollected} onChange={(e) => setAmountCollected(e.target.value)} style={styles.input} required />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Payment Method</label>
                                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={styles.input} required>
                                    <option value="Online">Online Wire Transfer</option>
                                    <option value="Cash">Cash In Hand Receipt</option>
                                    <option value="Loan Disbursal">Bank Finance Disbursal Payment</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Transaction Reference / Receipt ID</label>
                                <input type="text" value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} style={styles.input} placeholder="Bank Txn Hash / UTR ID" />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" style={{...styles.btnSuccess, flex: 1}}>Commit Collection Entry</button>
                                <button type="button" onClick={() => setActiveOrderPayment(null)} style={{...styles.btnSuccess, backgroundColor: '#9ca3af', flex: 1}}>Cancel</button>
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
    tableSection: { flex: '2', minWidth: '500px' },
    card: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 20px 0', fontSize: '15px', color: '#1f2937', fontWeight: '700' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' },
    input: { width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '14px', backgroundColor: '#fff' },
    btnSuccess: { width: '100%', padding: '11px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' },
    alert: { padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
    th: { padding: '12px 10px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontWeight: '600' },
    td: { padding: '12px 10px', color: '#1f2937', verticalAlign: 'middle' },
    badge: { padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', display: 'inline-block' },
    actionBtn: { padding: '5px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '11px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 100 },
    modalCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '6px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
};

export default OrderManagement;