import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './Models/User.js';
import Booking from './Models/Booking.js';
import Ride from './Models/Ride.js';
import DriverOffer from './Models/DriverOffer.js';
import Withdrawal from './Models/Withdrawal.js';
import connectDB from './db.js';
import express from 'express';
import { createServer } from 'http';
import authRoutes from './Routes/authRoutes.js';
import driverRoutes from './Routes/driverRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import bookingRoutes from './Routes/bookingRoutes.js';
import poolRoutes from './Routes/poolRoutes.js';
import paymentRoutes from './Routes/paymentRoutes.js';
import walletRoutes from './Routes/walletRoutes.js';
import feedbackRoutes from './Routes/feedbackRoutes.js';
import rideRoutes from './Routes/rideRoutes.js';

dotenv.config();

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

const runFullApiVerification = async () => {
    console.log('\n=============================================================');
    console.log('🚀 COMPREHENSIVE BACKEND & DB API SUITE VERIFICATION');
    console.log('=============================================================\n');

    // 1. Connect DB
    await connectDB();

    // 2. Setup Express Test Server
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/driver', driverRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/pools', poolRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/wallet', walletRoutes);
    app.use('/api/feedback', feedbackRoutes);
    app.use('/api/rides', rideRoutes);

    const server = createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`✅ Test server running on http://localhost:${PORT}\n`);

    const results = [];
    const logTest = (category, name, passed, details = '') => {
        const icon = passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`[${category}] ${name} -> ${icon} ${details ? `(${details})` : ''}`);
        results.push({ category, name, passed, details });
    };

    let adminToken = '';
    let driverToken = '';
    let passengerToken = '';
    let driverUserId = '';
    let passengerUserId = '';
    let testBookingId = '';
    let testPoolId = '';
    let testWithdrawalId = '';

    try {
        // ─── STEP 1: AUTHENTICATION APIs ─────────────────────────────────
        console.log('--- 1. Testing Auth & User Seed APIs ---');

        // Admin login
        const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@hybridride.com', password: 'admin123' })
        });
        const adminLoginData = await adminLoginRes.json();
        if (adminLoginData.success) {
            adminToken = adminLoginData.data.token;
            logTest('AUTH', 'POST /api/auth/login (Admin)', true, 'Token received');
        } else {
            logTest('AUTH', 'POST /api/auth/login (Admin)', false, adminLoginData.message);
        }

        // Seed / Ensure Test Driver
        const salt = await bcrypt.genSalt(10);
        const driverPassword = await bcrypt.hash('driver123', salt);
        let testDriver = await User.findOne({ email: 'testdriver@hybridride.com', role: 'driver' });
        if (!testDriver) {
            testDriver = await User.create({
                name: 'Test Driver Pro',
                email: 'testdriver@hybridride.com',
                password: driverPassword,
                phone: '+919876543210',
                role: 'driver',
                driverDetails: {
                    isOnline: true,
                    licenseNumber: 'DL-9988776655',
                    ratings: { average: 4.9, count: 24 },
                    vehicle: { make: 'Toyota', model: 'Camry', plateNumber: 'TS07AB1234', color: 'White', type: 'CAR' }
                }
            });
        }
        driverUserId = testDriver._id.toString();

        await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testdriver@hybridride.com', password: 'driver123', role: 'driver' })
        });

        // Get OTP from DB for driver
        const updatedDriver = await User.findById(driverUserId);
        const driverVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: updatedDriver.phone, otp: updatedDriver.otp, role: 'driver' })
        });
        const driverVerifyData = await driverVerifyRes.json();
        if (driverVerifyData.success) {
            driverToken = driverVerifyData.data.token;
            logTest('AUTH', 'POST /api/auth/verify-otp (Driver)', true, `Driver Token Received`);
        } else {
            logTest('AUTH', 'POST /api/auth/verify-otp (Driver)', false, driverVerifyData.message);
        }

        // Seed / Ensure Test Passenger
        const passengerPassword = await bcrypt.hash('passenger123', salt);
        let testPassenger = await User.findOne({ email: 'testpassenger@hybridride.com', role: 'passenger' });
        if (!testPassenger) {
            testPassenger = await User.create({
                name: 'Test Passenger VIP',
                email: 'testpassenger@hybridride.com',
                password: passengerPassword,
                phone: '+919123456789',
                role: 'passenger',
                walletBalance: 1500
            });
        }
        passengerUserId = testPassenger._id.toString();

        await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testpassenger@hybridride.com', password: 'passenger123', role: 'passenger' })
        });

        const updatedPassenger = await User.findById(passengerUserId);
        const passVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: updatedPassenger.phone, otp: updatedPassenger.otp, role: 'passenger' })
        });
        const passVerifyData = await passVerifyRes.json();
        if (passVerifyData.success) {
            passengerToken = passVerifyData.data.token;
            logTest('AUTH', 'POST /api/auth/verify-otp (Passenger)', true, `Passenger Token Received`);
        } else {
            logTest('AUTH', 'POST /api/auth/verify-otp (Passenger)', false, passVerifyData.message);
        }

        // ─── STEP 2: DRIVER TELEMETRY & PROFILE APIs ─────────────────────
        console.log('\n--- 2. Testing Driver APIs ---');

        const driverProfileRes = await fetch(`${BASE_URL}/driver/profile`, {
            headers: { Authorization: `Bearer ${driverToken}` }
        });
        const driverProfileData = await driverProfileRes.json();
        logTest('DRIVER', 'GET /api/driver/profile', driverProfileData.success, `Name: ${driverProfileData.data?.name}`);

        const toggleStatusRes = await fetch(`${BASE_URL}/driver/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${driverToken}` }
        });
        const toggleStatusData = await toggleStatusRes.json();
        logTest('DRIVER', 'PATCH /api/driver/status (Toggle)', toggleStatusData.success, `Online: ${toggleStatusData.data?.driverDetails?.isOnline}`);

        const dashSummaryRes = await fetch(`${BASE_URL}/driver/dashboard-summary`, {
            headers: { Authorization: `Bearer ${driverToken}` }
        });
        const dashSummaryData = await dashSummaryRes.json();
        logTest('DRIVER', 'GET /api/driver/dashboard-summary', dashSummaryRes.status === 200, `Earnings: ₹${dashSummaryData.data?.todayEarnings}`);

        const hotspotsRes = await fetch(`${BASE_URL}/driver/demand-hotspots`, {
            headers: { Authorization: `Bearer ${driverToken}` }
        });
        const hotspotsData = await hotspotsRes.json();
        logTest('DRIVER', 'GET /api/driver/demand-hotspots', hotspotsData.success, `Hotspots count: ${hotspotsData.data?.hotspots?.length}`);

        // ─── STEP 3: BOOKING & RIDE LIFECYCLE APIs ──────────────────────
        console.log('\n--- 3. Testing Ride Booking & Status Lifecycle APIs ---');

        // Passenger requests ride
        const requestRideRes = await fetch(`${BASE_URL}/bookings/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${passengerToken}`
            },
            body: JSON.stringify({
                pickupAddress: 'Hitech City Mindspace, Hyderabad',
                pickupCoords: [78.3812, 17.4435],
                dropoffAddress: 'Rajiv Gandhi Intl Airport, Hyderabad',
                dropoffCoords: [78.4299, 17.2403],
                rideType: 'city',
                vehicleType: 'CAR',
                offeredFare: 450,
                paymentMethod: 'cash'
            })
        });
        const requestRideData = await requestRideRes.json();
        if (requestRideData.success && requestRideData.data) {
            testBookingId = requestRideData.data._id;
            logTest('BOOKING', 'POST /api/bookings/request', true, `Booking ID: ${testBookingId}`);
        } else {
            logTest('BOOKING', 'POST /api/bookings/request', false, requestRideData.message);
        }

        // Driver gets nearby rides
        const nearbyRes = await fetch(`${BASE_URL}/bookings/nearby`, {
            headers: { Authorization: `Bearer ${driverToken}` }
        });
        const nearbyData = await nearbyRes.json();
        logTest('BOOKING', 'GET /api/bookings/nearby', nearbyData.success, `Found ${nearbyData.data?.length} nearby rides`);

        // Driver accepts ride
        if (testBookingId) {
            const acceptRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/accept`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${driverToken}` }
            });
            const acceptData = await acceptRes.json();
            logTest('BOOKING', 'POST /api/bookings/:id/accept', acceptData.success, `Status: ${acceptData.data?.status}`);

            // Driver updates status to ARRIVED
            const arrivedRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${driverToken}`
                },
                body: JSON.stringify({ status: 'arrived' })
            });
            const arrivedData = await arrivedRes.json();
            logTest('BOOKING', 'PUT /api/bookings/:id/status (ARRIVED)', arrivedData.success, `Status: ${arrivedData.data?.status}`);

            // Fetch booking OTP
            const otpCode = arrivedData.data?.otp || '1234';

            // Driver updates status to ONGOING with OTP
            const ongoingRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${driverToken}`
                },
                body: JSON.stringify({ status: 'ongoing', otp: otpCode })
            });
            const ongoingData = await ongoingRes.json();
            logTest('BOOKING', 'PUT /api/bookings/:id/status (ONGOING + OTP)', ongoingData.success, `OTP Verified: ${otpCode}`);

            // Driver updates status to COMPLETED
            const completedRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${driverToken}`
                },
                body: JSON.stringify({ status: 'completed' })
            });
            const completedData = await completedRes.json();
            logTest('BOOKING', 'PUT /api/bookings/:id/status (COMPLETED)', completedData.success, `Fare: ₹${completedData.data?.finalFare}`);

            // Passenger rates ride
            const rateRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${passengerToken}`
                },
                body: JSON.stringify({ rating: 5, comment: 'Excellent and smooth ride!' })
            });
            const rateData = await rateRes.json();
            logTest('BOOKING', 'POST /api/bookings/:id/rate', rateData.success, 'Rating saved');
        }

        // ─── STEP 4: POOL RIDES APIs ──────────────────────────────────────
        console.log('\n--- 4. Testing Pool Rides APIs ---');

        // Form 1: Driver Publishes City Pool Form
        const publishCityPoolRes = await fetch(`${BASE_URL}/pools/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${driverToken}`
            },
            body: JSON.stringify({
                type: 'local',
                poolCategory: 'CITY_POOL',
                originName: 'Gachibowli DLF, Hyderabad',
                originCoords: [78.3610, 17.4401],
                destinationName: 'Secunderabad Station',
                destinationCoords: [78.5010, 17.4399],
                scheduledTime: new Date(Date.now() + 86400000).toISOString(),
                totalSeats: 3,
                pricePerSeat: 80,
                acPremium: 10,
                ladiesSeatReserved: 1,
                luggageSpace: true,
                preferences: { music: true, ac: true, quiet: false }
            })
        });
        const publishCityPoolData = await publishCityPoolRes.json();
        if (publishCityPoolData.success && publishCityPoolData.data) {
            testPoolId = publishCityPoolData.data._id;
            logTest('FORM', 'POST /api/pools/publish (Form 1: City Pool)', true, `City Pool ID: ${testPoolId}`);
        } else {
            logTest('FORM', 'POST /api/pools/publish (Form 1: City Pool)', false, publishCityPoolData.message);
        }

        // Form 2: Driver Publishes Outstation Pool Form
        const publishOutstationPoolRes = await fetch(`${BASE_URL}/pools/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${driverToken}`
            },
            body: JSON.stringify({
                type: 'outstation',
                poolCategory: 'OUTSTATION_POOL',
                originName: 'Hyderabad, Telangana',
                originCoords: [78.4867, 17.3850],
                destinationName: 'Vijayawada, Andhra Pradesh',
                destinationCoords: [80.6480, 16.5062],
                scheduledTime: new Date(Date.now() + 172800000).toISOString(),
                totalSeats: 4,
                pricePerSeat: 450,
                seatPricing: { front: 500, middle: 450, back: 400 },
                preferences: { music: true, ac: true, quiet: false }
            })
        });
        const publishOutstationPoolData = await publishOutstationPoolRes.json();
        logTest('FORM', 'POST /api/pools/publish (Form 2: Outstation Pool)', publishOutstationPoolData.success, `Outstation Pool ID: ${publishOutstationPoolData.data?._id}`);

        // Form 3: Driver Publishes Outstation Rental Form
        const publishRentalRes = await fetch(`${BASE_URL}/pools/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${driverToken}`
            },
            body: JSON.stringify({
                type: 'rental',
                poolCategory: 'OUTSTATION_RENTAL',
                originName: 'Hitech City, Hyderabad',
                originCoords: [78.3812, 17.4435],
                destinationName: 'Srisailam Temple',
                destinationCoords: [78.8686, 16.0748],
                scheduledTime: new Date(Date.now() + 259200000).toISOString(),
                totalSeats: 6,
                pricePerSeat: 1200,
                rentalDetails: { outstationRatePerKm: 18, nightCharge: 300, allowNightStay: true }
            })
        });
        const publishRentalData = await publishRentalRes.json();
        logTest('FORM', 'POST /api/pools/publish (Form 3: Outstation Rental)', publishRentalData.success, `Rental Pool ID: ${publishRentalData.data?._id}`);

        // Form 4: Driver Saves Planned Commute Route Form
        const saveCommuteRes = await fetch(`${BASE_URL}/driver/planned-commute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${driverToken}`
            },
            body: JSON.stringify({
                homeLocation: { address: 'Madhapur, Hyderabad', location: { type: 'Point', coordinates: [78.3914, 17.4483] } },
                officeLocation: { address: 'Gachibowli ORR, Hyderabad', location: { type: 'Point', coordinates: [78.3610, 17.4401] } },
                homeToOfficeTime: { time: '09:00 AM', enabled: true },
                officeToHomeTime: { time: '06:00 PM', enabled: true },
                activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
            })
        });
        const saveCommuteData = await saveCommuteRes.json();
        logTest('FORM', 'POST /api/driver/planned-commute (Form 4: Planned Commute)', saveCommuteData.success, `Commute Saved`);

        // Form 5: Driver Vehicle Details Update Form
        const updateVehicleRes = await fetch(`${BASE_URL}/driver/vehicle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${driverToken}`
            },
            body: JSON.stringify({
                make: 'Toyota',
                model: 'Innova Crysta',
                year: '2023',
                plateNumber: 'TS09EX9999',
                color: 'Black',
                type: 'CAR',
                fuelType: 'Diesel',
                seatingCapacity: 7
            })
        });
        const updateVehicleData = await updateVehicleRes.json();
        logTest('FORM', 'POST /api/driver/vehicle (Form 5: Vehicle Profile)', updateVehicleData.success, `Vehicle Updated`);

        const searchPoolRes = await fetch(`${BASE_URL}/pools/search?type=local`, {
            headers: { Authorization: `Bearer ${passengerToken}` }
        });
        const searchPoolData = await searchPoolRes.json();
        logTest('POOL', 'GET /api/pools/search', searchPoolData.success, `Found ${searchPoolData.data?.length} active pools`);

        if (testPoolId) {
            const bookSeatRes = await fetch(`${BASE_URL}/pools/${testPoolId}/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${passengerToken}`
                },
                body: JSON.stringify({ seats: 1, paymentMethod: 'wallet' })
            });
            const bookSeatData = await bookSeatRes.json();
            logTest('POOL', 'POST /api/pools/:id/book', bookSeatData.success, `Available Seats Left: ${bookSeatData.data?.availableSeats}`);
        }

        // ─── STEP 5: WALLET & WITHDRAWAL APIs ────────────────────────────
        console.log('\n--- 5. Testing Wallet & Withdrawal APIs ---');

        await Withdrawal.deleteMany({ driver: driverUserId });

        const walletRes = await fetch(`${BASE_URL}/wallet/my-wallet`, {
            headers: { Authorization: `Bearer ${driverToken}` }
        });
        const walletData = await walletRes.json();
        logTest('WALLET', 'GET /api/wallet/my-wallet', walletData.success, `Balance: ₹${walletData.balance}`);

        const withdrawRes = await fetch(`${BASE_URL}/wallet/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${driverToken}`
            },
            body: JSON.stringify({
                amount: 200,
                method: 'bank',
                bankDetails: { bankName: 'HDFC Bank', accountNumber: '9876543210', ifscCode: 'HDFC0001234' }
            })
        });
        const withdrawData = await withdrawRes.json();
        if (withdrawData.success) {
            testWithdrawalId = withdrawData.withdrawal?._id;
            logTest('WALLET', 'POST /api/wallet/withdraw', true, `Withdrawal ID: ${testWithdrawalId}`);
        } else {
            logTest('WALLET', 'POST /api/wallet/withdraw', false, withdrawData.message);
        }

        // ─── STEP 6: ADMIN MANAGEMENT APIs ──────────────────────────────
        console.log('\n--- 6. Testing Admin Management APIs ---');

        const adminStatsRes = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const adminStatsData = await adminStatsRes.json();
        logTest('ADMIN', 'GET /api/admin/dashboard-stats', adminStatsData.success, `Total Users: ${adminStatsData.data?.totalUsers}`);

        const adminDriversRes = await fetch(`${BASE_URL}/admin/drivers`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const adminDriversData = await adminDriversRes.json();
        logTest('ADMIN', 'GET /api/admin/drivers', adminDriversData.success, `Drivers count: ${adminDriversData.count}`);

        const adminPassengersRes = await fetch(`${BASE_URL}/admin/passengers`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const adminPassengersData = await adminPassengersRes.json();
        logTest('ADMIN', 'GET /api/admin/passengers', adminPassengersData.success, `Passengers count: ${adminPassengersData.count}`);

        const adminRidesRes = await fetch(`${BASE_URL}/admin/rides`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const adminRidesData = await adminRidesRes.json();
        logTest('ADMIN', 'GET /api/admin/rides', adminRidesData.success, `Rides count: ${adminRidesData.count}`);

        const adminWithdrawalsRes = await fetch(`${BASE_URL}/admin/withdrawals`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const adminWithdrawalsData = await adminWithdrawalsRes.json();
        logTest('ADMIN', 'GET /api/admin/withdrawals', adminWithdrawalsData.success, `Withdrawals count: ${adminWithdrawalsData.count}`);

        if (testWithdrawalId) {
            const approveWithdrawalRes = await fetch(`${BASE_URL}/admin/withdrawals/${testWithdrawalId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminToken}`
                },
                body: JSON.stringify({ status: 'approved' })
            });
            const approveWithdrawalData = await approveWithdrawalRes.json();
            logTest('ADMIN', 'PUT /api/admin/withdrawals/:id (Approve)', approveWithdrawalData.success, 'Settlement Approved');
        }

    } catch (err) {
        console.error('CRITICAL API VERIFICATION ERROR:', err);
    } finally {
        server.close();
        await mongoose.connection.close();

        const passedCount = results.filter(r => r.passed).length;
        const totalCount = results.length;
        console.log('\n=============================================================');
        console.log(`📊 FINAL API TEST RESULTS: ${passedCount} / ${totalCount} PASSED (${Math.round((passedCount / totalCount) * 100)}%)`);
        console.log('=============================================================\n');
        process.exit(passedCount === totalCount ? 0 : 1);
    }
};

runFullApiVerification();
