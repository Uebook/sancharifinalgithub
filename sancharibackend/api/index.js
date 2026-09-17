import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../db.js';

import authRoutes from '../Routes/authRoutes.js';
import driverRoutes from '../Routes/driverRoutes.js';
import adminRoutes from '../Routes/adminRoutes.js';
import bookingRoutes from '../Routes/bookingRoutes.js';
import poolRoutes from '../Routes/poolRoutes.js';
import paymentRoutes from '../Routes/paymentRoutes.js';
import walletRoutes from '../Routes/walletRoutes.js';
import feedbackRoutes from '../Routes/feedbackRoutes.js';
import rideRoutes from '../Routes/rideRoutes.js';
import path from 'path';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(async (req, res, next) => {
    if (process.env.MONGO_URI) {
        try {
            await connectDB();
        } catch (err) {
            console.error('DB connect error:', err.message);
        }
    }
    next();
});

app.get('/', (req, res) => {
    res.json({ success: true, message: 'HybridRide API is running on Vercel 🚗' });
});

app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Network connection successful! 🚀',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        time: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/rides', rideRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

export default app;
