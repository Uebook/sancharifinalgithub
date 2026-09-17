import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Vercel Backend Production URL
const VERCEL_API_URL = process.env.API_URL || 'https://sancharibackend.vercel.app/api';
const LOCAL_API_URL = 'http://10.0.2.2:5001/api';

const BASE_URL = VERCEL_API_URL;

const apiClient = axios.create({
    baseURL: BASE_URL,
});

// Add token to requests
apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 (Auth Error)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('userToken');
            // Navigate to login? (Handled by AuthContext state usually)
        }
        return Promise.reject(error);
    }
);

export const getImageUrl = (path: string | undefined | null) => {
    if (!path || typeof path !== 'string') return null;
    const trimmed = path.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '[object Object]' || trimmed.length < 4) {
        return null;
    }
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('file:') ||
        trimmed.startsWith('content:')
    ) {
        return trimmed;
    }
    const normalizedPath = trimmed.replace(/\\/g, '/');
    const root = BASE_URL.replace(/\/api\/?$/, '');
    return `${root}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
};

export { BASE_URL };
export default apiClient;
