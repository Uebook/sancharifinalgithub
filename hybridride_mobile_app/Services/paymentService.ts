import apiClient from './apiClient';

export const createRazorpayOrder = async (amount: number) => {
    const response = await apiClient.post('/payments/create-order', { amount });
    return response.data;
};

export const verifyRazorpayPayment = async (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    amount: number
) => {
    const response = await apiClient.post('/payments/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount
    });
    return response.data;
};

// ─── Cashfree Payment Service ─────────────────────────────────────────

export const createCashfreeOrder = async (amount: number) => {
    const response = await apiClient.post('/payments/cashfree/create-order', { amount });
    return response.data;
};

export const verifyCashfreePayment = async (orderId: string, amount?: number) => {
    const response = await apiClient.post('/payments/cashfree/verify', { orderId, amount });
    return response.data;
};

export const createCashfreeRideOrder = async (amount: number, rideId?: string, seats: number = 1) => {
    const response = await apiClient.post('/payments/cashfree/create-ride-order', { amount, rideId, seats });
    return response.data;
};

export const verifyCashfreeRidePayment = async (orderId: string, rideId?: string, seats: number = 1, amount?: number) => {
    const response = await apiClient.post('/payments/cashfree/verify-ride', { orderId, rideId, seats, amount });
    return response.data;
};

