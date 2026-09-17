import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './db.js';
import { redisClient } from './redis.js';
import mongoose from 'mongoose';

// ─── Routes ────────────────────────────────────────────────────
import authRoutes from './Routes/authRoutes.js';
import driverRoutes from './Routes/driverRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import bookingRoutes from './Routes/bookingRoutes.js';
import poolRoutes from './Routes/poolRoutes.js';
import paymentRoutes from './Routes/paymentRoutes.js';
import walletRoutes from './Routes/walletRoutes.js';
import feedbackRoutes from './Routes/feedbackRoutes.js';
import rideRoutes from './Routes/rideRoutes.js';

import { createServer } from 'http';
import { initSocket } from './socket.js';
import routes from './Routes/index.js';
import globalErrorHandler from './Middleware/errorMiddleware.js';
import AppError from './Utils/AppError.js';
import logger from './logger.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO (on persistent servers)
if (!process.env.VERCEL) {
    try {
        initSocket(httpServer);
    } catch (err) {
        console.warn('Socket.IO init warning:', err.message);
    }
}

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ─── DB Middleware ─────────────────────────────────────────────
app.use(async (req, res, next) => {
    if (process.env.MONGO_URI) {
        try {
            await connectDB();
        } catch (err) {
            console.error('Database connection error:', err.message);
        }
    }
    next();
});

// ─── STATIC FILES ────────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── BASE ROUTES ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ success: true, message: 'HybridRide API is running 🚗' });
});

// ─── Network Test Route ────────────────────────────────────────
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Network connection successful! 🚀',
        redis: redisClient?.status || 'offline',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        ip: req.ip,
        time: new Date().toISOString()
    });
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/rides', rideRoutes);

// ─── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR CATCH:', err);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message || err });
});

export { app, httpServer };
export default app;
