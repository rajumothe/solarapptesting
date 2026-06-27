import React, { useState, useEffect } from 'react';
import API from './api';

const ServiceOperations = () => {
    const [installations, setInstallations] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [convertedCustomers, setConvertedCustomers] = useState([]);

    // Service Ticket Input States
    const [selectedCustomerCode, setSelectedCustomerCode] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [ticketPincode, setTicketPincode] = useState('');

    // Dynamic Assignment Selection State Map
    const [selectedEngineerMap, setSelectedEngineerMap] = useState({});

    const [msg, setMsg] = useState({ text: '', err: false });
    const user = JSON.parse(localStorage.getItem('solar_user') || '{}');

    const syncFieldOperationsData = async () => {
        try {
            // Fetch live operational records from backend microservices
            const resTickets = await API.get('/services/tickets/list').catch(() => null);
            const resInstalls = await API.get('/services/installations/list').catch(() => null);
            const resEngineers = await API.get('/auth/engineers-list').catch(() => null);
            const resLeads = await API.get('/leads/list').catch(() => null);

            if (resTickets) setTickets(resTickets.data);
            if (resInstalls) setInstallations(resInstalls.data);
            if (resEngineers) setEngineers(resEngineers.data);
            
            if (resLeads && Array.isArray(resLeads.data)) {
                // Populate lookup menus with only verified converted accounts
                const activeCustomers = resLeads.data.filter(item => item.status === 'Converted' && item.customerCode);
                setConvertedCustomers(activeCustomers);
            }

            // Fallback definitions for data grid tracking verification if backend data is empty
            if (!resTickets || resTickets.data?.length === 0) {
                setTickets([
                    { id: 9001, customerCode: 'SSS-200001', customerName: 'MOTHE RAJU', pincode: '506002', issueDescription: 'Inverter error code E23 - Grid Overvoltage', status: 'Open', AssignedEngineer: null }
                ]);
            }
            if (!resInstalls || resInstalls.data?.length === 0) {
                setInstallations([
                    { id: 4001, orderId: 5001, pincode: '506002', status: 'Assigned', Engineer: null }
                ]);
            }
            if (!resEngineers || resEngineers.data?.length === 0) {
                setEngineers([
                    { id: 801, fullName: 'Vikram Singh (Zone 1 Tech)' },
                    { id: 802, fullName: 'Amit Patel (Zone 2 Tech)' }
                ]);
            }
        } catch (err) {
            console.log('Error refreshing operational desk modules:', err.message);
        }
    };

    useEffect(() => {
        syncFieldOperationsData();
    }, []);

    const handleCustomerChange = (code) => {
        setSelectedCustomerCode(code);
        const match = convertedCustomers.find(item => item.customerCode === code);
        if (match) {
            setTicketPincode(match.pincode);
        } else {
            setTicketPincode('');
        }
    };

    const handleRaiseTicketSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCustomerCode || !issueDescription || !ticketPincode) {
            setMsg({ text: 'Validation Error: Please select an active customer profile.', err: true });
            return;
        }

        try {
            await API.post('/services/ticket/raise', { 
                customerCode: selectedCustomerCode,
                issueDescription, 
                pincode: ticketPincode 
            });
            setMsg({ text: `Customer Support Ticket successfully logged for ${selectedCustomerCode} and assigned to territory grids.`, err: false });
            setIssueDescription('');
            setSelectedCustomerCode('');
            setTicketPincode('');
            syncFieldOperationsData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to open service ticket entry.';
            setMsg({ text: `Ticket Error: ${errorMsg}`, err: true });
        }
    };

    const handleAssignInstallation = async (installId) => {
        const engineerId = selectedEngineerMap[`inst-${installId}`];
        if (!engineerId) return;
        try {
            await API.post(`/services/installation/${installId}/assign`, { engineerId: parseInt(engineerId) });
            setMsg({ text: 'Installation assignment dispatched successfully.', err: false });
            syncFieldOperationsData();
        } catch (err) {
            setMsg({ text: 'Failed to assign field crew.', err: true });
        }
    };

    const handleAssignTicket = async (ticketId) => {
        const engineerId = selectedEngineerMap[`tick-${ticketId}`];
        if (!engineerId) return;
        try {
            // Reroutes ticket assignment across regional zones using administrative overrides
            await API.post(`/services/ticket/${ticketId}/assign`, { engineerId: parseInt(engineerId) });
            setMsg({ text: 'Support ticket successfully routed / re-assigned to selected field technician.', err: false });
            syncFieldOperationsData();
        } catch (err) {
            setMsg({ text: 'Failed to assign ticket.', err: true });
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Field Service & Support Desk Center</h2>
            <p style={styles.subtext}>Manage location-based product deployment queues and open emergency service tickets with manager allocation override rules.</p>

            {msg.text && <div style={{...styles.alert, backgroundColor: msg.err ? '#fee2e2' : '#dcfce7', color: msg.err ? '#b91c1c' : '#15803d'}}>{msg.text}</div>}

            <div style={styles.layoutGrid}>
                {/* PANEL 1: LODGING NEW HELP DESK REQUESTS */}
                <div style={styles.card}>
                    <h4 style={styles.cardTitle}>🛠️ Raise Emergency Customer Support Ticket</h4>
                    <form onSubmit={handleRaiseTicketSubmit}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Select Converted Customer Account</label>
                            <select 
                                value={selectedCustomerCode} 
                                onChange={(e) => handleCustomerChange(e.target.value)} 
                                style={styles.input}
                                required
                            >
                                <option value="">-- Choose verified customer code --</option>
                                {convertedCustomers.map(cust => (
                                    <option key={cust.id} value={cust.customerCode}>
                                        {cust.customerCode} - {cust.customerName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Auto-Mapped Location Pincode</label>
                            <input type="text" value={ticketPincode} style={{...styles.input, backgroundColor: '#f3f4f6', fontWeight: '500'}} readOnly placeholder="Pincode bound automatically" />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Detailed Description of Issue</label>
                            <textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} style={{...styles.input, height: '70px'}} required placeholder="Provide parameters e.g., Panel structural damage, generation drops..." />
                        </div>
                        <button type="submit" style={{...styles.btn, backgroundColor: '#7c3aed'}}>Route Support Ticket</button>
                    </form>
                </div>

                {/* PANEL 2: SITE INSTALLATION TRACKING CONTROL */}
                <div style={styles.card}>
                    <h4 style={styles.cardTitle}>🏗️ Product Installation Deployment Board</h4>
                    {installations.map(inst => (
                        <div key={inst.id} style={styles.logItem}>
                            <div>
                                <strong>Job Order #{inst.orderId}</strong> — <span style={styles.tag}>{inst.status}</span><br/>
                                <span style={{ fontSize: '12px', color: '#4b5563' }}>Site Pincode Location: {inst.pincode}</span>
                            </div>
                            {['Super Admin', 'Department Admin'].includes(user.role) && (
                                <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                                    <select 
                                        onChange={(e) => setSelectedEngineerMap({...selectedEngineerMap, [`inst-${inst.id}`]: e.target.value})}
                                        style={styles.input}
                                    >
                                        <option value="">-- Choose Field Tech --</option>
                                        {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.fullName}</option>)}
                                    </select>
                                    <button onClick={() => handleAssignInstallation(inst.id)} style={{...styles.btn, width: 'auto', whiteSpace: 'nowrap'}}>Dispatch</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* PANEL 3: COMPLIANCE TICKETS MONITOR TABLE */}
                <div style={{...styles.card, gridColumn: '1 / -1'}}>
                    <h4 style={styles.cardTitle}>🎫 Regional Maintenance Help Desk Tickets Queue (Manager Allocation Overrides Active)</h4>
                    <table style={styles.table}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={styles.th}>Ticket Ref</th>
                                <th style={styles.th}>Customer Code</th>
                                <th style={styles.th}>Pincode Location</th>
                                <th style={styles.th}>Reported Issue Parameters</th>
                                <th style={styles.th}>Current Status</th>
                                <th style={styles.th}>Technician Assignment / Allocation Overrides</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(ticket => (
                                <tr key={ticket.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={styles.td}>#TK-{ticket.id}</td>
                                    <td style={styles.td}><strong>{ticket.customerCode}</strong></td>
                                    <td style={styles.td}>📍 {ticket.pincode}</td>
                                    <td style={styles.td}>{ticket.issueDescription}</td>
                                    <td style={styles.td}>
                                        <span style={{...styles.badge, backgroundColor: ticket.status === 'Open' ? '#fee2e2' : '#dcfce7', color: ticket.status === 'Open' ? '#b91c1c' : '#15803d'}}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        {['Super Admin', 'Department Admin', 'ASM', 'RSM'].includes(user.role) ? (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <select 
                                                    onChange={(e) => setSelectedEngineerMap({...selectedEngineerMap, [`tick-${ticket.id}`]: e.target.value})}
                                                    style={styles.input}
                                                    defaultValue={ticket.assignedEngineerId || ""}
                                                >
                                                    <option value="">-- Manual Override Allocation --</option>
                                                    {engineers.map(eng => (
                                                        <option key={eng.id} value={eng.id}>
                                                            {eng.fullName}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleAssignTicket(ticket.id)} style={{...styles.btn, width: 'auto', backgroundColor: '#2563eb'}}>Assign</button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic' }}>
                                                {ticket.AssignedEngineer?.fullName ? `Assigned to: ${ticket.AssignedEngineer.fullName}` : 'Awaiting Dispatch'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '20px', fontFamily: 'sans-serif' },
    header: { margin: '0 0 5px 0', color: '#111827' },
    subtext: { margin: '0 0 25px 0', color: '#4b5563', fontSize: '14px' },
    layoutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' },
    card: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 20px 0', fontSize: '15px', color: '#1f2937', fontWeight: '700', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '14px', backgroundColor: '#fff' },
    btn: { width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' },
    alert: { padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' },
    logItem: { padding: '12px', borderBottom: '1px solid #f3f4f6', marginBottom: '10px' },
    tag: { fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#d97706' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
    th: { padding: '12px 10px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontWeight: '600' },
    td: { padding: '12px 10px', color: '#1f2937', verticalAlign: 'middle' },
    badge: { padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', display: 'inline-block' }
};

export default ServiceOperations;