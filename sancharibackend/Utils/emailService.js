import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const mailHost = process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com';
const mailPort = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT) || 465;
const mailSecure = mailPort === 465 || process.env.MAIL_ENCRYPTION === 'ssl';
const mailUser = process.env.SMTP_USER || process.env.MAIL_USERNAME || 'support@sanchari.io';
const mailPass = (process.env.SMTP_PASS || process.env.MAIL_PASSWORD || 'bfwnvuozqyjaghso').replace(/"/g, '');
const mailFrom = process.env.MAIL_FROM_ADDRESS ? process.env.MAIL_FROM_ADDRESS.replace(/"/g, '') : mailUser;

const transporter = nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: mailSecure,
    auth: {
        user: mailUser,
        pass: mailPass
    }
});

/**
 * Send an email
 * @param {object} options - Email options (to, subject, text, html)
 * @returns {Promise<any>}
 */
export const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"Sanchari Support" <${mailFrom}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
