// API Configuration for Mobile App
// Priority:
// 1) EXPO_PUBLIC_API_URL (explicit override)
// 2) Expo dev mode (__DEV__) -> development
// 3) production fallback for release builds

const API_CONFIG = {
    development: {
        baseURL: 'http://192.168.29.142:5000/api', // For local development
        timeout: 10000,
    },
    staging: {
        baseURL: 'https://staging-api.solarapp.com/api',
        timeout: 10000,
    },
    production: {
        baseURL: 'https://api.solarapp.com/api',
        timeout: 10000,
    }
};

const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL;

let config;
if (explicitApiUrl && explicitApiUrl.trim()) {
    config = {
        baseURL: explicitApiUrl.trim(),
        timeout: API_CONFIG.production.timeout
    };
} else if (__DEV__) {
    config = API_CONFIG.development;
} else {
    config = API_CONFIG.production;
}

export default config;
