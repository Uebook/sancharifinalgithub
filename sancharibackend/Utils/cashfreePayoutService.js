import axios from 'axios';
import SystemSetting from '../Models/SystemSetting.js';

/**
 * Fetch dynamic Cashfree Payout credentials from MongoDB or process.env
 */
export const getCashfreePayoutConfig = async () => {
    try {
        const dbSetting = await SystemSetting.findOne({ key: 'cashfree_payout_config' });
        if (dbSetting && dbSetting.value) {
            return {
                clientId: (dbSetting.value.clientId || '').trim(),
                clientSecret: (dbSetting.value.clientSecret || '').trim(),
                environment: (dbSetting.value.environment || 'SANDBOX').trim().toUpperCase(),
                isEnabled: dbSetting.value.isEnabled !== false,
                transferModePreference: dbSetting.value.transferModePreference || 'auto' // 'auto', 'bank', 'upi'
            };
        }
    } catch (err) {
        console.error('Error reading Cashfree Payout config from DB:', err.message);
    }

    // Fallback to environment variables
    return {
        clientId: (process.env.CASHFREE_PAYOUT_CLIENT_ID || '').trim(),
        clientSecret: (process.env.CASHFREE_PAYOUT_CLIENT_SECRET || '').trim(),
        environment: (process.env.CASHFREE_PAYOUT_ENV || 'SANDBOX').trim().toUpperCase(),
        isEnabled: true,
        transferModePreference: 'auto'
    };
};

/**
 * Get Base URL based on environment
 */
const getPayoutBaseUrl = (environment) => {
    const isProd = environment === 'PRODUCTION' || environment === 'PROD';
    return isProd
        ? 'https://payout-api.cashfree.com/payout/v1'
        : 'https://payout-gamma.cashfree.com/payout/v1';
};

// In-memory token cache for performance
let cachedToken = null;
let cachedTokenExpiry = 0;
let cachedTokenEnv = null;

/**
 * Generate/Retrieve Bearer Auth Token from Cashfree Payouts API
 */
export const getCashfreePayoutToken = async (customConfig = null) => {
    const config = customConfig || await getCashfreePayoutConfig();

    if (!config.clientId || !config.clientSecret) {
        throw new Error('Cashfree Payout Client ID and Client Secret are missing. Please configure them in Payout Settings.');
    }

    // STRICT CHECK: Reject any placeholder/dummy keys in PRODUCTION
    if (config.environment === 'PRODUCTION' || config.environment === 'PROD') {
        const lowerId = config.clientId.toLowerCase();
        const lowerSec = config.clientSecret.toLowerCase();
        if (
            lowerId.includes('dummy') ||
            lowerId.includes('placeholder') ||
            lowerId.includes('your_') ||
            lowerSec.includes('dummy') ||
            lowerSec.includes('placeholder') ||
            lowerSec.includes('your_')
        ) {
            throw new Error('Live Cashfree Payout keys are invalid or placeholders. Please enter your valid Live Production API credentials.');
        }
    }

    // Reuse valid token if available
    if (
        cachedToken &&
        Date.now() < cachedTokenExpiry &&
        cachedTokenEnv === config.environment
    ) {
        return { token: cachedToken, config };
    }

    const baseUrl = getPayoutBaseUrl(config.environment);

    try {
        const response = await axios.post(
            `${baseUrl}/authorize`,
            {},
            {
                headers: {
                    'X-Client-Id': config.clientId,
                    'X-Client-Secret': config.clientSecret,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        if (response.data && (response.data.status === 'SUCCESS' || response.data.subCode === '200')) {
            const token = response.data.data?.token;
            if (!token) {
                throw new Error('Cashfree authorization response did not contain an auth token.');
            }
            cachedToken = token;
            cachedTokenExpiry = Date.now() + 50 * 60 * 1000; // 50 minutes cache
            cachedTokenEnv = config.environment;
            return { token, config };
        } else {
            throw new Error(response.data?.message || 'Failed to authorize with Cashfree Payout API');
        }
    } catch (err) {
        const message = err.response?.data?.message || err.message;
        throw new Error(`Cashfree Payout Auth Error: ${message}`);
    }
};

/**
 * Test Connection with Cashfree Payouts API
 */
export const testCashfreePayoutConnection = async (credentials) => {
    const { token, config } = await getCashfreePayoutToken(credentials);
    const baseUrl = getPayoutBaseUrl(config.environment);

    try {
        const balanceRes = await axios.get(`${baseUrl}/getBalance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        });

        return {
            success: true,
            environment: config.environment,
            data: balanceRes.data?.data || balanceRes.data,
            message: `Connected successfully to Cashfree Payouts (${config.environment})!`
        };
    } catch (err) {
        // Even if getBalance is restricted, auth was successful
        return {
            success: true,
            environment: config.environment,
            message: `Cashfree Payouts authenticated successfully (${config.environment})!`
        };
    }
};

/**
 * Execute Direct Bank/UPI Transfer via Cashfree Payouts
 * @param {Object} params
 * @param {string} params.transferId - Unique reference ID
 * @param {number} params.amount - Transfer amount in INR
 * @param {string} params.phone - Beneficiary phone number
 * @param {string} [params.name] - Beneficiary name
 * @param {string} [params.email] - Beneficiary email
 * @param {string} [params.bankAccount] - Bank account number
 * @param {string} [params.ifsc] - Bank IFSC code
 * @param {string} [params.upiId] - Beneficiary UPI VPA
 * @param {string} [params.remarks] - Transfer remark
 */
export const executeCashfreeTransfer = async ({
    transferId,
    amount,
    phone,
    name = 'Sanchari Partner',
    email = 'driver@sanchari.app',
    bankAccount = '',
    ifsc = '',
    upiId = '',
    remarks = 'Sanchari Driver Settlement'
}) => {
    const { token, config } = await getCashfreePayoutToken();

    if (!config.isEnabled) {
        throw new Error('Cashfree Payout is currently disabled in Admin Payout Settings.');
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10) || '9999999999';
    const hasUpi = Boolean(upiId && upiId.includes('@'));
    const hasBank = Boolean(bankAccount && ifsc);

    if (!hasUpi && !hasBank) {
        throw new Error('Neither valid Bank Account (A/C & IFSC) nor UPI ID is available for this driver.');
    }

    // Determine transfer mode
    let transferMode = 'banktransfer';
    if (config.transferModePreference === 'upi' && hasUpi) {
        transferMode = 'upi';
    } else if (config.transferModePreference === 'bank' && hasBank) {
        transferMode = 'banktransfer';
    } else if (hasUpi && !hasBank) {
        transferMode = 'upi';
    }

    const cleanTransferId = `SANCHARI_${String(transferId).replace(/[^a-zA-Z0-9_-]/g, '')}_${Date.now().toString().slice(-6)}`;

    const beneDetails = {
        name: name.trim() || 'Sanchari Partner',
        email: email.trim() || 'driver@sanchari.app',
        phone: cleanPhone,
        address1: 'India',
        ...(transferMode === 'upi' ? { vpa: upiId.trim() } : { bankAccount: bankAccount.trim(), ifsc: ifsc.trim().toUpperCase() })
    };

    const payload = {
        transferId: cleanTransferId,
        amount: Number(amount).toFixed(2),
        transferMode: transferMode,
        remarks: remarks.slice(0, 70),
        beneDetails
    };

    const baseUrl = getPayoutBaseUrl(config.environment);

    try {
        const response = await axios.post(`${baseUrl}/requestTransfer`, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 20000
        });

        const resData = response.data;

        if (resData.status === 'SUCCESS' || resData.subCode === '200') {
            return {
                success: true,
                transferId: cleanTransferId,
                referenceId: resData.data?.referenceId || cleanTransferId,
                utr: resData.data?.utr || resData.data?.referenceId || cleanTransferId,
                transferMode,
                environment: config.environment,
                raw: resData
            };
        } else if (resData.status === 'PENDING' || resData.subCode === '201') {
            return {
                success: true,
                isPending: true,
                transferId: cleanTransferId,
                referenceId: resData.data?.referenceId || cleanTransferId,
                utr: resData.data?.utr || 'PENDING_BANK_CONFIRMATION',
                transferMode,
                environment: config.environment,
                raw: resData
            };
        } else {
            throw new Error(resData.message || 'Cashfree Payout transfer was declined.');
        }
    } catch (err) {
        const errMsg = err.response?.data?.message || err.message;
        throw new Error(`Payout Failed: ${errMsg}`);
    }
};
