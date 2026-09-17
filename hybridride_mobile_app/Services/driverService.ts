import apiClient from './apiClient';

export const driverService = {
    getProfile: async () => {
        const response = await apiClient.get('/driver/profile');
        return response.data;
    },

    toggleStatus: async () => {
        const response = await apiClient.patch('/driver/status');
        return response.data;
    },

    updateProfile: async (data: any) => {
        const response = await apiClient.put('/driver/profile', data);
        return response.data;
    },

    uploadDocument: async (formData: FormData) => {
        const response = await apiClient.post('/driver/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getDashboardSummary: async () => {
        const response = await apiClient.get('/driver/dashboard-summary');
        return response.data;
    },

    getDemandHotspots: async () => {
        const response = await apiClient.get('/driver/demand-hotspots');
        return response.data;
    },

    savePlannedCommute: async (data: any) => {
        const response = await apiClient.post('/driver/planned-commute', data);
        return response.data;
    },

    getPlannedCommute: async () => {
        const response = await apiClient.get('/driver/planned-commute');
        return response.data;
    },

    getEarnings: async () => {
        const response = await apiClient.get('/driver/earnings');
        return response.data;
    },

    getTripModes: async () => {
        const response = await apiClient.get('/driver/trip-modes');
        return response.data;
    }
};