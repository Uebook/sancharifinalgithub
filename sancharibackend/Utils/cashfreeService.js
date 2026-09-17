import dotenv from 'dotenv';
dotenv.config();

const getBaseUrl = () => {
    const env = (process.env.CASHFREE_ENV || 'SANDBOX').trim().toUpperCase();
    return env === 'PROD' || env === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
};

const getHeaders = () => {
    const appId = (process.env.CASHFREE_APP_ID || '').trim();
    const secretKey = (process.env.CASHFREE_SECRET_KEY || '').trim();
    const apiVersion = (process.env.CASHFREE_API_VERSION || '2023-08-01').trim();

    return {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': apiVersion,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
};

/**
 * Create a Cashfree Payment Order
 * @param {Object} params
 * @param {string} params.orderId - Unique order ID
 * @param {number} params.amount - Order amount in INR
 * @param {string} params.customerId - User/Customer unique ID
 * @param {string} params.customerPhone - Customer 10-digit mobile number
 * @param {string} [params.customerName] - Customer name
 * @param {string} [params.customerEmail] - Customer email
 * @param {string} [params.orderNote] - Order description
 * @param {string} [params.returnUrl] - Redirect return URL
 */
export const createCashfreeOrder = async ({
    orderId,
    amount,
    customerId,
    customerPhone,
    customerName = 'Sanchari User',
    customerEmail = 'support@sanchari.app',
    orderNote = 'Sanchari Payment',
    returnUrl,
}) => {
    try {
        const cleanPhone = String(customerPhone).replace(/\D/g, '').slice(-10);
        const baseUrl = getBaseUrl();
        const headers = getHeaders();

        const payload = {
            order_id: orderId,
            order_amount: Number(amount.toFixed(2)),
            order_currency: 'INR',
            customer_details: {
                customer_id: String(customerId || 'cust_' + Date.now()),
                customer_phone: cleanPhone || '9999999999',
                customer_name: customerName || 'Sanchari User',
                customer_email: customerEmail || 'user@sanchari.app',
            },
            order_meta: {
                return_url: returnUrl || `https://sancharibackend.vercel.app/api/payments/cashfree/return?order_id={order_id}`,
            },
            order_note: orderNote,
        };

        console.log('[Cashfree] Creating order with payload:', JSON.stringify(payload));

        const response = await fetch(`${baseUrl}/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log('[Cashfree] Order API Response status:', response.status, data);

        if (!response.ok) {
            throw new Error(data.message || 'Cashfree Order Creation Failed');
        }

        return data;
    } catch (error) {
        console.error('[Cashfree] createCashfreeOrder Error:', error);
        throw error;
    }
};

/**
 * Get Cashfree Order Details and Payment Status
 * @param {string} orderId - Cashfree order ID
 */
export const getCashfreeOrderStatus = async (orderId) => {
    try {
        const baseUrl = getBaseUrl();
        const headers = getHeaders();

        const response = await fetch(`${baseUrl}/orders/${orderId}`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();
        console.log('[Cashfree] Get Order Status Response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch Cashfree Order');
        }

        return data;
    } catch (error) {
        console.error('[Cashfree] getCashfreeOrderStatus Error:', error);
        throw error;
    }
};

/**
 * Fetch payments for a Cashfree Order
 * @param {string} orderId - Cashfree order ID
 */
export const getCashfreeOrderPayments = async (orderId) => {
    try {
        const baseUrl = getBaseUrl();
        const headers = getHeaders();

        const response = await fetch(`${baseUrl}/orders/${orderId}/payments`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[Cashfree] getCashfreeOrderPayments Error:', error);
        throw error;
    }
};
