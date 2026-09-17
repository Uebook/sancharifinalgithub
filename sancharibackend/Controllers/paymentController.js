import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../Models/User.js";
import Wallet from "../Models/Wallet.js";
import Ride from "../Models/Ride.js";
import dotenv from "dotenv";
import {
    createCashfreeOrder,
    getCashfreeOrderStatus,
    getCashfreeOrderPayments,
} from "../Utils/cashfreeService.js";

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// @desc    Create a razorpay order for wallet topup
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) return res.status(400).json({ success: false, message: "Amount is required" });

        const options = {
            amount: Math.round(amount * 100), // Razorpay operates in youngest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json({ success: false, message: "Some error occured creating order" });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Payment Order Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Only verify payment signature without wallet update
// @route   POST /api/payments/onlyVerify
// @access  Private
export const onlyverifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
       
        const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = sha.digest("hex");

        if (digest !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Transaction is not legit!" });
        }

        res.status(200).json({
            success: true,
            message: "Payment successfully verified",
        });
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Validate payment and add to wallet
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
        const userId = req.user._id;

        // Verify signature
        const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = sha.digest("hex");

        if (digest !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Transaction is not legit!" });
        }

        // Add funds to user wallet
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.walletBalance = (user.walletBalance || 0) + amount;

        // Quick workaround for driver earnings, keeping both balanced
        if (user.role === 'driver') {
            user.driverDetails.earnings = (user.driverDetails.earnings || 0) + amount;
        }

        await user.save();

        // Log transaction in Wallet model
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            wallet = await Wallet.create({ user: userId, balance: user.walletBalance });
        }

        wallet.balance = user.walletBalance;
        wallet.transactions.push({
            type: 'credit',
            amount: amount,
            description: 'Wallet Top-up via Razorpay',
            referenceId: razorpay_payment_id
        });
        await wallet.save();

        res.status(200).json({
            success: true,
            message: "Payment successfully verified and wallet updated",
            walletBalance: user.walletBalance,
        });
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ──────────────────────────────────────────────────────────────────────
// RIDE PAYMENT — Pool / Outstation / Rental
// These ride types are ALWAYS Razorpay. No cash allowed.
// Flow: createRidePaymentOrder → Razorpay Checkout → verifyRidePayment
// ──────────────────────────────────────────────────────────────────────

// @desc    Create Razorpay order for a pool / outstation / rental booking
// @route   POST /api/payments/create-ride-order
// @access  Private (Passenger)
export const createRidePaymentOrder = async (req, res) => {
    try {
        console.log(req.body);
        const { amount, rideId, seats = 1 } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        const options = {
            amount: Math.round(amount * 100), // paise
            currency: 'INR',
            receipt: `ride_${rideId || 'book'}_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                rideId: rideId || '',
                seats: seats.toString(),
            }
        };

        const order = await razorpay.orders.create(options);
        return res.status(200).json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('createRidePaymentOrder error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Razorpay ride payment → deduct wallet → confirm booking
// @route   POST /api/payments/verify-ride
// @access  Private (Passenger)
export const verifyRidePayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount,          // final fare in rupees
            rideId,          // Ride._id for pool bookings
            seats = 1,
        } = req.body;
        console.log("iiii", req.body)
        // ─── 1. Verify Razorpay signature ───────────────────────────────────
        const sha = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = sha.digest('hex');
        console.log("payment verification", digest, razorpay_signature);
        if (digest !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        // ─── 2. Deduct passenger wallet ───────────────────────────────────
        const passenger = await User.findById(req.user._id);
        console.log("payment verification", passenger);
        if (!passenger) return res.status(404).json({ success: false, message: 'User not found' });

        passenger.walletBalance = (passenger.walletBalance || 0) - amount;
        await passenger.save();

        // Log debit transaction
        let pWallet = await Wallet.findOne({ user: req.user._id });
        if (!pWallet) pWallet = await Wallet.create({ user: req.user._id, balance: passenger.walletBalance });
        pWallet.balance = passenger.walletBalance;
        pWallet.transactions.push({
            type: 'debit',
            amount,
            description: `Ride Payment via Razorpay (${razorpay_payment_id})`,
            referenceId: razorpay_payment_id,
        });
        await pWallet.save();

        // ─── 3. If pool ride — book the seat ───────────────────────────────
        let bookingData = null;
        if (rideId) {
            const ride = await Ride.findById(rideId);
            if (ride && ride.availableSeats >= seats) {
                // No OTP for pooling bookings per user request
                const pickupOtp = null;
                ride.availableSeats -= seats;
                ride.passengers.push({
                    user: req.user._id,
                    seatsBooked: seats,
                    otp: pickupOtp,
                    paymentMethod: 'razorpay',
                    paymentId: razorpay_payment_id,
                    bookingStatus: 'confirmed',
                    paymentStatus: 'paid',
                });
                await ride.save();
                bookingData = { otp: pickupOtp, rideId };
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified and booking confirmed',
            booking: bookingData,
        });
    } catch (error) {
        console.error('verifyRidePayment error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ──────────────────────────────────────────────────────────────────────
// CASHFREE PAYMENT INTEGRATION
// ──────────────────────────────────────────────────────────────────────

// @desc    Create a Cashfree order for wallet topup
// @route   POST /api/payments/cashfree/create-order
// @access  Private
export const createCashfreeWalletOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Valid amount is required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const orderId = `wallet_${user._id.toString().slice(-6)}_${Date.now()}`;

        const cashfreeOrder = await createCashfreeOrder({
            orderId,
            amount: Number(amount),
            customerId: user._id.toString(),
            customerPhone: user.phone || '9999999999',
            customerName: user.name || 'Sanchari User',
            customerEmail: user.email || `${user.phone}@sanchari.app`,
            orderNote: `Wallet Top-up: ₹${amount}`,
        });

        res.status(200).json({
            success: true,
            orderId: cashfreeOrder.order_id,
            paymentSessionId: cashfreeOrder.payment_session_id,
            orderAmount: cashfreeOrder.order_amount,
            orderCurrency: cashfreeOrder.order_currency,
            environment: (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase() === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX',
        });
    } catch (error) {
        console.error("Cashfree Wallet Order Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Cashfree payment and add funds to user wallet
// @route   POST /api/payments/cashfree/verify
// @access  Private
export const verifyCashfreeWalletPayment = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        const userId = req.user._id;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Cashfree orderId is required" });
        }

        const orderStatus = await getCashfreeOrderStatus(orderId);

        if (orderStatus.order_status !== 'PAID') {
            return res.status(400).json({
                success: false,
                message: `Payment status is ${orderStatus.order_status}. Wallet not credited.`,
                status: orderStatus.order_status,
            });
        }

        const paidAmount = Number(orderStatus.order_amount) || Number(amount);

        // Add funds to user wallet
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.walletBalance = (user.walletBalance || 0) + paidAmount;

        if (user.role === 'driver') {
            user.driverDetails.earnings = (user.driverDetails.earnings || 0) + paidAmount;
        }

        await user.save();

        // Log transaction in Wallet model
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            wallet = await Wallet.create({ user: userId, balance: user.walletBalance });
        }

        // Avoid duplicate logging for same orderId
        const alreadyLogged = wallet.transactions.some(t => t.referenceId === orderId);
        if (!alreadyLogged) {
            wallet.balance = user.walletBalance;
            wallet.transactions.push({
                type: 'credit',
                amount: paidAmount,
                description: 'Wallet Top-up via Cashfree',
                referenceId: orderId,
            });
            await wallet.save();
        }

        res.status(200).json({
            success: true,
            message: "Cashfree payment successfully verified and wallet updated",
            walletBalance: user.walletBalance,
        });
    } catch (error) {
        console.error("Cashfree Wallet Verification Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create Cashfree order for ride booking
// @route   POST /api/payments/cashfree/create-ride-order
// @access  Private
export const createCashfreeRideOrder = async (req, res) => {
    try {
        const { amount, rideId, seats = 1 } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const orderId = `ride_${(rideId || 'book').slice(-6)}_${Date.now()}`;

        const cashfreeOrder = await createCashfreeOrder({
            orderId,
            amount: Number(amount),
            customerId: user._id.toString(),
            customerPhone: user.phone || '9999999999',
            customerName: user.name || 'Sanchari Passenger',
            customerEmail: user.email || `${user.phone}@sanchari.app`,
            orderNote: `Ride Booking Payment (Seats: ${seats})`,
        });

        res.status(200).json({
            success: true,
            orderId: cashfreeOrder.order_id,
            paymentSessionId: cashfreeOrder.payment_session_id,
            orderAmount: cashfreeOrder.order_amount,
            orderCurrency: cashfreeOrder.order_currency,
            environment: (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase() === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX',
        });
    } catch (error) {
        console.error('createCashfreeRideOrder error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Cashfree ride payment and confirm booking
// @route   POST /api/payments/cashfree/verify-ride
// @access  Private
export const verifyCashfreeRidePayment = async (req, res) => {
    try {
        const { orderId, rideId, seats = 1, amount } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Cashfree orderId is required' });
        }

        const orderStatus = await getCashfreeOrderStatus(orderId);

        if (orderStatus.order_status !== 'PAID') {
            return res.status(400).json({
                success: false,
                message: `Payment status is ${orderStatus.order_status}. Booking not confirmed.`,
            });
        }

        const paidAmount = Number(orderStatus.order_amount) || Number(amount);

        const passenger = await User.findById(req.user._id);
        if (!passenger) return res.status(404).json({ success: false, message: 'User not found' });

        // Log transaction in wallet
        let pWallet = await Wallet.findOne({ user: req.user._id });
        if (!pWallet) pWallet = await Wallet.create({ user: req.user._id, balance: passenger.walletBalance || 0 });
        pWallet.transactions.push({
            type: 'debit',
            amount: paidAmount,
            description: `Ride Payment via Cashfree (${orderId})`,
            referenceId: orderId,
        });
        await pWallet.save();

        // Confirm seat booking if rideId provided
        let bookingData = null;
        if (rideId) {
            const ride = await Ride.findById(rideId);
            if (ride && ride.availableSeats >= seats) {
                ride.availableSeats -= seats;
                ride.passengers.push({
                    user: req.user._id,
                    seatsBooked: seats,
                    otp: null,
                    paymentMethod: 'cashfree',
                    paymentId: orderId,
                    bookingStatus: 'confirmed',
                    paymentStatus: 'paid',
                });
                await ride.save();
                bookingData = { rideId };
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Cashfree payment verified and booking confirmed',
            walletBalance: passenger.walletBalance,
            booking: bookingData,
        });
    } catch (error) {
        console.error('verifyCashfreeRidePayment error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
