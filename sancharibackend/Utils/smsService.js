import dotenv from 'dotenv';
dotenv.config();

const RAW_API_KEY = process.env.SMS_API_KEY;
// URL-encode key if it contains special characters like |
const API_KEY = RAW_API_KEY ? encodeURIComponent(RAW_API_KEY) : null;
const SENDER_ID = process.env.SMS_SENDER_ID;
const BASE_URL = process.env.SMS_BASE_URL;

/**
 * Send SMS using Buddy Infotech API
 * @param {string|string[]} numbers - Phone number(s) (comma-separated or array)
 * @param {string} message - Message content
 * @param {number} templateId - DLT Template ID
 * @param {boolean} isPersonalized - Use personalized content (default: false)
 * @returns {Promise<any>} - API Response
 */
export const sendSMS = async (numbers, message, templateId, isPersonalized = false) => {
    try {
        if (!API_KEY || !BASE_URL) {
            throw new Error('SMS API Key or Base URL is missing in environment variables');
        }

        const payload = {
            senderid: process.env.SMS_SENDER_ID || 'SSGSPT',
            unicode: 0,
            personalized: isPersonalized ? 1 : 0,
            numbers: (Array.isArray(numbers) ? numbers : (typeof numbers === 'string' ? numbers.split(',') : [numbers]))
                .map(num => String(num).replace(/\D/g, '').slice(-10)),
        };

        // If not personalized, the message is common
        if (!isPersonalized) {
            payload.message = message;
        }

        const headers = {
            'Authorization': `Bearer ${RAW_API_KEY}`,
            'Content-Type': 'application/json',
        };


        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
};

/**
 * Send Personalized SMS (Custom per recipient)
 * @param {Array<{number: string, [key: string]: string}>} recipients - Array of objects with number and custom fields
 * @param {number|string} [templateId] - Optional DLT Template ID
 * @param {string} [message] - Message with placeholders (required if templateId is missing)
 * @param {string} [senderId] - Sender ID (required if templateId is missing)
 * @returns {Promise<any>} - API Response
 */
export const sendPersonalizedSMS = async (recipients, templateId = null, message = null, senderId = null) => {
    try {
        const apiKey = process.env.SMS_API_KEY;
        const baseUrl = process.env.SMS_BASE_URL || 'https://multichannel.buddyinfotech.in/api/v1/sms/sendMessage';
        
        const activeSenderId = senderId || process.env.SMS_SENDER_ID || 'SSGSPT';
        const rawTemplateId = templateId || process.env.SMS_TEMPLATE_ID || 23379;
        const activeTemplateId = Number(String(rawTemplateId).split('-')[0]) || 23379;

        const recipient = recipients[0] || {};
        const cleanNum = String(recipient.number || recipient.phone || '').replace(/\D/g, '').slice(-10);
        const otpVal = String(recipient.otp || recipient.num || '');
        const nameVal = String(recipient.name || recipient.alp || 'User');

        let formattedMessage = message;
        if (!formattedMessage) {
            formattedMessage = `Dear ${nameVal}, Welcome to Sanchari App! Your OTP is ${otpVal}, valid for 5 minutes. Do not share it. Sanchari never asks for your OTP. - Shivakshini GSPL`;
        } else {
            formattedMessage = formattedMessage
                .replace(/\{#alp#\}/g, nameVal)
                .replace(/\{#num#\}/g, otpVal);
        }

        const formattedNumbers = recipients.map(r => ({
            number: String(r.number || r.phone || cleanNum).replace(/\D/g, '').slice(-10),
            alp: String(r.alp || r.name || nameVal || 'User'),
            num: String(r.num || r.otp || otpVal || '')
        })).filter(r => r.number.length === 10);

        const payload = {
            senderid: activeSenderId,
            template_id: activeTemplateId,
            message: message || "Dear {#alp#}, Welcome to Sanchari App! Your OTP is {#num#}, valid for 5 minutes. Do not share it. Sanchari never asks for your OTP. - Shivakshini GSPL",
            unicode: 0,
            personalized: 1,
            numbers: formattedNumbers.length > 0 ? formattedNumbers : [{ number: cleanNum, alp: nameVal, num: otpVal }],
        };

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        };

        console.log('Sending SMS payload:', JSON.stringify(payload));
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log('SMS API Response:', data);
        return data;
    } catch (error) {
        console.error('Error sending personalized SMS:', error);
        throw error;
    }
};

/**
 * Send SMS via GET request (Non-personalized only)
 * @param {string} numbers - Comma-separated phone numbers (max 200)
 * @param {string} message - URL encoded message
 * @returns {Promise<any>}
 */
export const sendSMSViaGet = async (numbers, message) => {
    try {
        const url = `${BASE_URL}?token=${API_KEY}&senderid=${SENDER_ID}&message=${encodeURIComponent(message)}&numbers=${numbers}`;
        
        console.log('--- SMS API GET REQUEST ---');
        console.log('URL:', url);

        const response = await fetch(url);
        const data = await response.json();
        console.log('SMS GET API Response:', data);
        return data;
    } catch (error) {
        console.error('Error sending SMS via GET:', error);
        throw error;
    }
};
