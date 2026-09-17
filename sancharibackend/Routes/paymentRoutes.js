import express from 'express';
import {
    createOrder,
    verifyPayment,
    createRidePaymentOrder,
    verifyRidePayment,
    onlyverifyPayment,
    createCashfreeWalletOrder,
    verifyCashfreeWalletPayment,
    createCashfreeRideOrder,
    verifyCashfreeRidePayment,
} from '../Controllers/paymentController.js';
import { protect } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Razorpay routes
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/onlyVerify', protect, onlyverifyPayment);
router.post('/create-ride-order', protect, createRidePaymentOrder);
router.post('/verify-ride', protect, verifyRidePayment);

// Cashfree routes
router.post('/cashfree/create-order', protect, createCashfreeWalletOrder);
router.post('/cashfree/verify', protect, verifyCashfreeWalletPayment);
router.post('/cashfree/create-ride-order', protect, createCashfreeRideOrder);
router.post('/cashfree/verify-ride', protect, verifyCashfreeRidePayment);

export default router;
