import axios from 'axios';

// Use Vite runtime env vars in production, local URL in development.
const getBaseURL = () => {
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_API_URL || 'https://api.solarapp.com/api';
    }
    return 'http://localhost:5000/api';
};

const API = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true, // Send cookies with requests
    timeout: 10000
});

// Interceptor to automatically inject JWT tokens into outbound headers
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('solar_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to handle authentication errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear stored credentials on unauthorized response
            localStorage.removeItem('solar_token');
            localStorage.removeItem('solar_user');
            // Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;