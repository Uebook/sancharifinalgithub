import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.SMS_API_KEY; // Same token is used for multichannel
const WABA_ID = process.env.WHATSAPP_WABA_ID;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

/**
 * Send WhatsApp OTP Template Message
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Approved template name
 * @param {string[]} variables - Array of variable values (e.g., [name, otp])
 * @returns {Promise<any>}
 */
export const sendWhatsAppOTP = async (to, templateName, variables = []) => {
    try {
        const apiKey = process.env.SMS_API_KEY;
        const phoneId = process.env.WHATSAPP_PHONE_ID;
        const activeTemplate = templateName || process.env.WHATSAPP_TEMPLATE_NAME || 'otp_login';

        if (!apiKey || !phoneId || phoneId === 'your_whatsapp_phone_id_here') {
            console.warn('WhatsApp credentials not set in environment. Skipping live WhatsApp API request.');
            return null;
        }

        // Format to E.164 (ensure + prefix and no spaces)
        let formattedPhone = to.replace(/\D/g, '');
        if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
            formattedPhone = '91' + formattedPhone;
        }
        formattedPhone = '+' + formattedPhone;

        const url = `https://multichannel.buddyinfotech.in/api/v1/whatsapp/${phoneId}/messages`;
        const otpCode = String(variables[0] || '');

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedPhone,
            type: "template",
            template: {
                name: activeTemplate,
                language: { code: "en_US" },
                components: [
                    {
                        type: "body",
                        parameters: [
                            {
                                type: "text",
                                text: otpCode
                            }
                        ]
                    },
                    {
                        type: "button",
                        sub_type: "url",
                        index: 0,
                        parameters: [
                            {
                                type: "text",
                                text: otpCode
                            }
                        ]
                    }
                ]
            }
        };

        console.log('Sending WhatsApp payload:', JSON.stringify(payload));
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log('WhatsApp API Response:', data);
        return data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return null;
    }
};
