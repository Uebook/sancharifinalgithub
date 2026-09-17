import apiClient from './apiClient';

export const getMyWalletData = async () => {
    try {
        const response = await apiClient.get('/wallet/my-wallet');
        return response.data;
    } catch (error: any) {
        return error.response?.data || { success: false, message: 'Network error' };
    }
};

export const requestWithdrawal = async (amount: number, method: 'instant' | 'bank', bankDetails?: any) => {
    try {
        const response = await apiClient.post('/wallet/withdraw', {
            amount,
            method,
            bankDetails
        });
        return response.data;
    } catch (error: any) {
        return error.response?.data || { success: false, message: 'Network error' };
    }
};

export default {
    getMyWalletData,
    requestWithdrawal
};
