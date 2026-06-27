import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './Login';
import GroupMaster from './GroupMaster';
import ItemMaster from './ItemMaster';
import PriceMaster from './PriceMaster';
import PlantMaster from './PlantMaster';
import SalesOfficeMaster from './SalesOfficeMaster';
import UserManagement from './UserManagement';
import LeadManagement from './LeadManagement';
import VerificationDesk from './VerificationDesk';
import OrderManagement from './OrderManagement';
import ServiceOperations from './ServiceOperations';

const LayoutWrapper = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('solar_user') || '{}');
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ backgroundColor: '#1f2937', color: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>SolarAPP Enterprise Core</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span>Operator: <strong>{user.fullName || 'User'}</strong> [{user.role || 'N/A'}]</span>
                    <button onClick={handleLogout} style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Sign Out</button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1 }}>
                <aside style={{ width: '250px', backgroundColor: '#111827', color: '#fff', padding: '20px' }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Link to="/dashboard" style={styles.navLink}>🏠 Dashboard Core</Link>
                        
                        <div style={styles.navHeader}>Field Force Desk</div>
                        <Link to="/leads" style={{...styles.navLink, backgroundColor: '#d97706'}}>📋 Executive Lead Tracker</Link>
                        <Link to="/verifications" style={{...styles.navLink, backgroundColor: '#4f46e5'}}>🏢 Verification Desks</Link>
                        <Link to="/orders" style={{...styles.navLink, backgroundColor: '#059669'}}>🛒 Order & Billing Desk</Link>
                        
                        {/* DISPATCH AND FIELD TICKETS OPERATION CONTROL LINK */}
                        <Link to="/services" style={{...styles.navLink, backgroundColor: '#0284c7'}}>🛠️ Field Operations & Tickets</Link>

                        {['Super Admin', 'Department Admin'].includes(user.role) && (
                            <>
                                <div style={styles.navHeader}>Systems Configuration</div>
                                <Link to="/masters/group" style={{...styles.navLink, backgroundColor: '#374151'}}>📦 Group Configuration</Link>
                                <Link to="/masters/item" style={{...styles.navLink, backgroundColor: '#2563eb'}}>🛠️ SKU Item Master</Link>
                                <Link to="/masters/price" style={{...styles.navLink, backgroundColor: '#7c3aed'}}>💰 State Price Matrix</Link>
                            </>
                        )}

                        {user.role === 'Super Admin' && (
                            <>
                                <div style={styles.navHeader}>Administration Panel</div>
                                <Link to="/masters/plants" style={{...styles.navLink, backgroundColor: '#dc2626'}}>🏭 Plant Management</Link>
                                <Link to="/masters/sales-offices" style={{...styles.navLink, backgroundColor: '#f59e0b'}}>🏢 Sales Office Setup</Link>
                                <Link to="/admin/users" style={{...styles.navLink, backgroundColor: '#8b5cf6'}}>👥 User Management</Link>
                            </>
                        )}
                    </nav>
                </aside>

                <main style={{ flex: 1, backgroundColor: '#f9fafb', padding: '20px' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

const HomeDashboard = () => {
    const user = JSON.parse(localStorage.getItem('solar_user') || '{}');
    return (
        <div>
            <h1>SolarAPP Performance Terminal</h1>
            <p>Welcome to the central command layer, <strong>{user.fullName}</strong>. Select an action module from the sidebar options to manage your territories, pipeline leads, or master records securely.</p>
        </div>
    );
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                
                <Route path="/dashboard" element={<LayoutWrapper><HomeDashboard /></LayoutWrapper>} />
                <Route path="/leads" element={<LayoutWrapper><LeadManagement /></LayoutWrapper>} />
                <Route path="/verifications" element={<LayoutWrapper><VerificationDesk /></LayoutWrapper>} />
                <Route path="/orders" element={<LayoutWrapper><OrderManagement /></LayoutWrapper>} />
                
                {/* MOUNT SERVICE LOGISTICS WORKSPACE PATH */}
                <Route path="/services" element={<LayoutWrapper><ServiceOperations /></LayoutWrapper>} />
                
                <Route path="/masters/group" element={<LayoutWrapper><GroupMaster /></LayoutWrapper>} />
                <Route path="/masters/item" element={<LayoutWrapper><ItemMaster /></LayoutWrapper>} />
                <Route path="/masters/price" element={<LayoutWrapper><PriceMaster /></LayoutWrapper>} />
                <Route path="/masters/plants" element={<LayoutWrapper><PlantMaster /></LayoutWrapper>} />
                <Route path="/masters/sales-offices" element={<LayoutWrapper><SalesOfficeMaster /></LayoutWrapper>} />
                <Route path="/admin/users" element={<LayoutWrapper><UserManagement /></LayoutWrapper>} />
            </Routes>
        </Router>
    );
}

const styles = {
    navLink: { color: '#fff', textDecoration: 'none', padding: '10px', borderRadius: '4px', display: 'block', fontWeight: '500', fontSize: '14px' },
    navHeader: { color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', marginTop: '15px', marginBottom: '5px', paddingLeft: '10px' }
};

export default App;