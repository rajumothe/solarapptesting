import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            const response = await API.post('/auth/login', { email, password });
            
            // Extract and preserve token session profile metadata locally
            localStorage.setItem('solar_token', response.data.accessToken);
            localStorage.setItem('solar_refresh_token', response.data.refreshToken);
            localStorage.setItem('solar_user', JSON.stringify(response.data.user));

            // Redirect smoothly into the internal engine framework based on organizational role
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setErrorMsg(error.response?.data?.message || 'Authentication channel timeout. Retry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleLoginSubmit} style={styles.card}>
                <h2 style={styles.title}>SolarAPP Portal</h2>
                <p style={styles.subtitle}>Enterprise Operational Microservices Sign-In</p>

                {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

                <div style={styles.formGroup}>
                    <label style={styles.label}>Corporate Email Address</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        style={styles.input} 
                        required 
                        placeholder="name@company.com"
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Security Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        style={styles.input} 
                        required 
                        placeholder="••••••••"
                    />
                </div>

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Validating Token...' : 'Authenticate Access'}
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' },
    card: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
    title: { margin: '0 0 8px 0', fontSize: '24px', textAlign: 'center', color: '#1f2937' },
    subtitle: { margin: '0 0 24px 0', fontSize: '14px', textAlign: 'center', color: '#6b7280' },
    errorAlert: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '4px', fontSize: '14px', marginBottom: '16px', textAlign: 'center' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' },
    input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '14px' },
    button: { width: '100%', padding: '12px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }
};

export default Login;