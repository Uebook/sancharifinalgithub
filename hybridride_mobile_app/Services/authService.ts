import axios from 'axios';
import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
    register: async (userData: any) => {
        const response = await apiClient.post('/auth/register', userData);
        if (response.data.data.token) {
            await AsyncStorage.setItem('userToken', response.data.data.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.data));
        }
        return response.data;
    },

    login: async (credentials: any) => {
        console.log(";;;;;", credentials)
        const response = await apiClient.post('/auth/login', credentials);
        console.log(";;;;;", response)
        if (response.data.data.token) {
            await AsyncStorage.setItem('userToken', response.data.data.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.data));
        }
        return response.data;
    },

    sendOTP: async (phone: string, channel: 'sms' | 'whatsapp' = 'sms', role?: string, isLogin: boolean = false) => {
        const response = await apiClient.post('/auth/send-otp', { phone, channel, role, isLogin });
        return response.data;
    },

    whatsappLogin: async (phone: string, role?: string) => {
        const response = await apiClient.post('/auth/whatsapp-login', { phone, role });
        return response.data;
    },
    verifyOTP: async (phone: string, otp: string, role?: string) => {
        const response = await apiClient.post('/auth/verify-otp', { phone, otp, role });

        if (response.data.data.token) {
            await AsyncStorage.setItem('userToken', response.data.data.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.data));
        }
        return response.data;
    },

    loginWithGoogle: async (idToken: string, role: string) => {
        const response = await apiClient.post('/auth/google', { idToken, role });
        if (response.data.data.token) {
            await AsyncStorage.setItem('userToken', response.data.data.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.data));
        }
        return response.data;
    },

    getMe: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
    },

    deleteAccount: async () => {
        const response = await apiClient.delete('/auth/delete-account');
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        return response.data;
    }
};

