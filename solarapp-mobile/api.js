import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

// Create API instance with configuration from environment-specific config
const API = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Universal token injection interceptor layer for secure active sessions
API.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('mobile_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling authentication errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear stored token on unauthorized response
            AsyncStorage.removeItem('mobile_token');
            AsyncStorage.removeItem('mobile_user');
        }
        return Promise.reject(error);
    }
);

export default API;