import User from '../Models/User.js';
import Booking from '../Models/Booking.js';
import Ride from '../Models/Ride.js';
import Wallet from '../Models/Wallet.js';
import Withdrawal from '../Models/Withdrawal.js';
import PromotedRoute from '../Models/PromotedRoute.js';
import Offer from '../Models/Offer.js';
import DriverOffer from '../Models/DriverOffer.js';
import SystemSetting from '../Models/SystemSetting.js';
import bcrypt from 'bcryptjs';
import { getCashfreePayoutConfig, testCashfreePayoutConnection, executeCashfreeTransfer } from '../Utils/cashfreePayoutService.js';
// Get list of drivers (with filter for pending/verified)
export const getDrivers = async (req, res) => {
    try {
        console.log(`Admin ${req.user.email} fetching drivers...`);
        const { status } = req.query;
        let query = { role: { $in: ['driver', 'DRIVER'] } };

        if (status === 'pending') {
            query['driverApprovalStatus'] = 'pending';
        } else if (status === 'approved') {
            query['driverApprovalStatus'] = 'approved';
        } else if (status === 'rejected') {
            query['driverApprovalStatus'] = 'rejected';
        }

        const drivers = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();
        const driverIds = drivers.map(d => d._id);

        let bookingCountMap = {};
        let rideCountMap = {};

        if (driverIds.length > 0) {
            const [bookingCounts, rideCounts] = await Promise.all([
                Booking.aggregate([
                    { $match: { driver: { $in: driverIds }, status: { $ne: 'cancelled' } } },
                    { $group: { _id: '$driver', count: { $sum: 1 } } }
                ]),
                Ride.aggregate([
                    { $match: { host: { $in: driverIds }, status: { $ne: 'cancelled' } } },
                    { $group: { _id: '$host', count: { $sum: 1 } } }
                ])
            ]);

            bookingCounts.forEach(b => {
                bookingCountMap[b._id.toString()] = b.count;
            });
            rideCounts.forEach(r => {
                rideCountMap[r._id.toString()] = r.count;
            });
        }

        const enrichedDrivers = drivers.map((d) => {
            const idStr = d._id.toString();
            const totalRides = (bookingCountMap[idStr] || 0) + (rideCountMap[idStr] || 0);

            // Lighten documents in list response to avoid exceeding Vercel payload/timeout limits
            let sanitizedDocs = {};
            if (d.driverDetails?.documents) {
                for (const [k, v] of Object.entries(d.driverDetails.documents)) {
                    if (typeof v === 'string' && v.startsWith('data:image') && v.length > 500) {
                        sanitizedDocs[k] = true;
                    } else {
                        sanitizedDocs[k] = v;
                    }
                }
            }

            return {
                ...d,
                totalRides: totalRides,
                driverDetails: {
                    ...(d.driverDetails || {}),
                    totalRides: totalRides,
                    documents: sanitizedDocs
                }
            };
        });

        console.log(`Found ${drivers.length} drivers.`);
        res.json({ success: true, count: enrichedDrivers.length, data: enrichedDrivers });
    } catch (error) {
        console.error('getDrivers error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get a specific driver's details
// GET /api/admin/drivers/:id
export const getDriverByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await User.findById(id).select('-password');
        
        if (!driver || !/^driver$/i.test(driver.role)) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        res.json({
            success: true,
            data: driver
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get a specific driver's documents
// GET /api/admin/drivers/:id/documents
export const getDriverDocumentsAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await User.findById(id).select('-password').lean();
        
        if (!driver || !/^driver$/i.test(driver.role)) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        const docs = {
            ...(driver.driverDetails?.documents || {}),
            profileImage: driver.profileImage || ''
        };

        res.json({
            success: true,
            data: docs,
            driverDetails: driver.driverDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// Verify driver documents
export const verifyDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const driver = await User.findById(id);
        if (!driver || !/^driver$/i.test(driver.role)) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        if (action === 'approve') {
            driver.driverApprovalStatus = 'approved';
            driver.isBlocked = false;
            driver.rejectionReason = ""; // Clear rejection reason on approval
            driver.verificationStatus = {
                ...(driver.verificationStatus || {}),
                email: true,
                phone: true,
                idCard: true,
                communityTrusted: true
            };
            if (!driver.driverDetails) driver.driverDetails = {};
            driver.driverDetails.isOnline = false;
            await driver.save();
            return res.json({ success: true, message: 'Driver approved successfully', data: driver });

        } else if (action === 'reject') {
            const { rejectionReason } = req.body;
            driver.driverApprovalStatus = 'rejected';
            driver.rejectionReason = rejectionReason || "Your documents did not meet our requirements.";
            if (!driver.verificationStatus) driver.verificationStatus = {};
            driver.verificationStatus.communityTrusted = false;
            driver.verificationStatus.idCard = false;
            await driver.save();
            return res.json({ success: true, message: 'Driver rejected', data: driver });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

    } catch (error) {
        console.error('verifyDriver error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
};

// Update driver/partner details
export const updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, licenseNumber, vehicle } = req.body;

        const driver = await User.findById(id);
        if (!driver || !/^driver$/i.test(driver.role)) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (name) driver.name = name;
        if (email !== undefined) driver.email = email;
        if (phone !== undefined) driver.phone = phone;

        if (!driver.driverDetails) {
            driver.driverDetails = {};
        }

        if (licenseNumber !== undefined) {
            driver.driverDetails.licenseNumber = licenseNumber;
        }

        if (vehicle) {
            driver.driverDetails.vehicle = {
                ...driver.driverDetails.vehicle,
                ...vehicle
            };
        }

        await driver.save();
        res.json({ success: true, message: 'Partner updated successfully', data: driver });
    } catch (error) {
        console.error('updateDriver error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update driver/partner status (activate, suspend, reject, approve)
export const updateDriverStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        const driver = await User.findById(id);
        if (!driver || !/^driver$/i.test(driver.role)) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (status === 'approved' || status === 'active') {
            driver.driverApprovalStatus = 'approved';
            driver.isBlocked = false;
            driver.rejectionReason = '';
        } else if (status === 'suspended') {
            driver.driverApprovalStatus = 'rejected';
            driver.isBlocked = true;
            if (rejectionReason) driver.rejectionReason = rejectionReason;
        } else if (status === 'rejected') {
            driver.driverApprovalStatus = 'rejected';
            driver.isBlocked = false;
            if (rejectionReason) driver.rejectionReason = rejectionReason;
        } else if (status === 'pending') {
            driver.driverApprovalStatus = 'pending';
            driver.isBlocked = false;
        }

        await driver.save();
        res.json({ success: true, message: `Partner status set to ${status}`, data: driver });
    } catch (error) {
        console.error('updateDriverStatus error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete driver/partner
export const deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await User.findByIdAndDelete(id);

        if (!driver) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        res.json({ success: true, message: 'Partner deleted successfully' });
    } catch (error) {
        console.error('deleteDriver error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get list of passengers
export const getPassengers = async (req, res) => {
    try {
        console.log(`Admin ${req.user.email} fetching passengers...`);
        const passengers = await User.find({
            role: { $regex: /^passenger$/i }
        }).select('-password').sort({ createdAt: -1 }).lean();
        const passengerIds = passengers.map(p => p._id);

        let bookingCountMap = {};
        let rideCountMap = {};

        if (passengerIds.length > 0) {
            const [bookingCounts, rideCounts] = await Promise.all([
                Booking.aggregate([
                    { $match: { passenger: { $in: passengerIds }, status: { $ne: 'cancelled' } } },
                    { $group: { _id: '$passenger', count: { $sum: 1 } } }
                ]),
                Ride.aggregate([
                    { $match: { 'passengers.user': { $in: passengerIds }, status: { $ne: 'cancelled' } } },
                    { $unwind: '$passengers' },
                    { $match: { 'passengers.user': { $in: passengerIds } } },
                    { $group: { _id: '$passengers.user', count: { $sum: 1 } } }
                ])
            ]);

            bookingCounts.forEach(b => {
                bookingCountMap[b._id.toString()] = b.count;
            });
            rideCounts.forEach(r => {
                rideCountMap[r._id.toString()] = r.count;
            });
        }

        const enrichedPassengers = passengers.map((p) => {
            const idStr = p._id.toString();
            const totalRides = (bookingCountMap[idStr] || 0) + (rideCountMap[idStr] || 0);
            return {
                ...p,
                totalRides: totalRides
            };
        });

        console.log(`Found ${passengers.length} passengers.`);
        res.json({ success: true, count: enrichedPassengers.length, data: enrichedPassengers });
    } catch (error) {
        console.error('getPassengers error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update passenger details
export const updatePassenger = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, email, phone, role, profileImage, isActive, isBlocked, walletBalance,
            emergencyContact, verificationStatus, ridePersonality
        } = req.body;

        const user = await User.findById(id);
        if (!user || !/^passenger$/i.test(user.role)) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (role !== undefined) user.role = role;
        if (profileImage !== undefined) user.profileImage = profileImage;
        if (isActive !== undefined) user.isActive = Boolean(isActive);
        if (isBlocked !== undefined) user.isBlocked = Boolean(isBlocked);
        if (walletBalance !== undefined) user.walletBalance = Number(walletBalance);

        if (emergencyContact) {
            user.emergencyContact = {
                name: emergencyContact.name ?? user.emergencyContact?.name ?? '',
                phone: emergencyContact.phone ?? user.emergencyContact?.phone ?? ''
            };
        }

        if (verificationStatus) {
            user.verificationStatus = {
                email: verificationStatus.email ?? user.verificationStatus?.email ?? false,
                phone: verificationStatus.phone ?? user.verificationStatus?.phone ?? false,
                idCard: verificationStatus.idCard ?? user.verificationStatus?.idCard ?? false,
                communityTrusted: verificationStatus.communityTrusted ?? user.verificationStatus?.communityTrusted ?? false,
            };
        }

        if (ridePersonality && Array.isArray(ridePersonality)) {
            user.ridePersonality = ridePersonality;
        }

        await user.save();
        res.json({ success: true, message: 'Customer updated successfully', data: user });
    } catch (error) {
        console.error('updatePassenger error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete passenger
export const deletePassenger = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('deletePassenger error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Toggle user block status
export const toggleBlockStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get ride history for a specific passenger
export const getPassengerRides = async (req, res) => {
    try {
        const { id } = req.params;
        const bookings = await Booking.find({ passenger: id })
            .populate('driver', 'name phone profileImage')
            .lean();

        const poolRides = await Ride.find({ 'passengers.user': id })
            .populate('host', 'name phone profileImage')
            .lean();

        const formattedBookings = bookings.map(b => ({
            ...b,
            rideType: b.rideType || 'city',
            createdAt: b.createdAt
        }));

        const formattedPoolRides = poolRides.map(r => ({
            _id: r._id,
            passenger: id,
            driver: r.host,
            pickup: r.origin,
            dropoff: r.destination,
            rideType: r.type ? `${r.type}_pool` : 'pool',
            vehicleType: r.vehicleType,
            status: r.status,
            finalFare: r.pricePerSeat,
            createdAt: r.createdAt || r.scheduledTime
        }));

        const combined = [...formattedBookings, ...formattedPoolRides].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ success: true, data: combined });
    } catch (error) {
        console.error('getPassengerRides error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get transaction history for a specific passenger
export const getPassengerTransactions = async (req, res) => {
    try {
        const { id } = req.params;

        // For now, transactions are inferred from completed or paid bookings. 
        // We'll return bookings that have a finalFare > 0.
        const rides = await Booking.find({
            passenger: id,
            status: { $in: ['completed', 'cancelled'] } // cancelled might have cancellation fees later
        })
            .populate('driver', 'name')
            .sort({ createdAt: -1 });

        const transactions = rides.map(ride => {
            const isRefund = ride.status === 'cancelled' && ride.paymentStatus === 'completed'; // basic logic
            return {
                id: ride._id,
                date: ride.createdAt,
                type: isRefund ? 'Refund' : 'Payment',
                amount: ride.finalFare || ride.offeredFare || ride.estimatedFare, // Fallback fields
                method: ride.paymentMethod || 'cash',
                status: isRefund ? 'processed' : ride.paymentStatus === 'completed' ? 'success' : 'pending',
                relatedTo: ride.driver ? ride.driver.name : 'Unknown Driver',
                rideId: ride._id
            };
        });

        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const totalPassengers = await User.countDocuments({ role: { $regex: /^passenger$/i } });
        const totalDrivers = await User.countDocuments({ role: { $regex: /^driver$/i } });
        const activeDrivers = await User.countDocuments({ role: { $regex: /^driver$/i }, driverApprovalStatus: 'approved' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newRegistrationsToday = await User.countDocuments({ createdAt: { $gte: today } });

        // Revenue stats
        const revenueStats = await Booking.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$finalFare' },
                    todayRevenue: {
                        $sum: {
                            $cond: [{ $gte: ['$createdAt', today] }, '$finalFare', 0]
                        }
                    }
                }
            }
        ]);

        // Pooling stats
        const totalPools = await Ride.countDocuments();
        const activePools = await Ride.countDocuments({ status: { $in: ['scheduled', 'ongoing'] } });

        // Aggregate pooling revenue (sum of all confirmed/completed passenger bookings)
        const poolRevenueStats = await Ride.aggregate([
            { $unwind: '$passengers' },
            { $match: { 'passengers.bookingStatus': { $in: ['confirmed', 'completed'] } } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $multiply: ['$passengers.seatsBooked', '$pricePerSeat'] } },
                    todayRevenue: {
                        $sum: {
                            $cond: [{ $gte: ['$createdAt', today] }, { $multiply: ['$passengers.seatsBooked', '$pricePerSeat'] }, 0]
                        }
                    }
                }
            }
        ]);

        const totalRevenue = (revenueStats[0]?.totalRevenue || 0) + (poolRevenueStats[0]?.totalRevenue || 0);
        const totalCommission = 0; // 0% commission per user request
        const totalPayouts = totalRevenue; // 100% to drivers

        const stats = {
            totalPassengers,
            totalDrivers,
            activeDrivers,
            newRegistrationsToday,
            totalPools,
            activePools,
            dailyRevenue: (revenueStats[0]?.todayRevenue || 0) + (poolRevenueStats[0]?.todayRevenue || 0),
            totalRevenue,
            totalCommission,
            totalPayouts
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get detailed financial overview
export const getFinancialOverview = async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalCollection: { $sum: '$finalFare' },
                    totalCommission: { $sum: 0 }, // 0% commission
                    totalPayouts: { $sum: '$finalFare' }
                }
            }
        ]);

        // Aggregate pooling revenue similarly for financial overview
        const poolStats = await Ride.aggregate([
            { $unwind: '$passengers' },
            { $match: { 'passengers.bookingStatus': { $in: ['confirmed', 'completed'] } } },
            {
                $group: {
                    _id: null,
                    totalCollection: { $sum: { $multiply: ['$passengers.seatsBooked', '$pricePerSeat'] } }
                }
            }
        ]);

        const rideData = stats[0] || { totalCollection: 0, totalCommission: 0, totalPayouts: 0 };
        const poolData = poolStats[0] || { totalCollection: 0 };

        const totalCollection = rideData.totalCollection + poolData.totalCollection;
        const totalCommission = 0; // Standard 0% Commission
        const totalPayouts = totalCollection;

        res.json({
            success: true, data: {
                totalCollection,
                totalCommission,
                totalPayouts,
                netProfit: totalCommission
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get driver/partner wallets for admin payouts and wallet status page (PE-01)
export const getDriverWallets = async (req, res) => {
    try {
        const drivers = await User.find({ role: { $regex: /^driver$/i } }).select('name phone email _id walletBalance isBlocked driverDetails.earnings');
        console.log(`Admin fetching driver/partner wallets, found: ${drivers.length}`);

        const walletsData = await Promise.all(drivers.map(async (d) => {
            const pendingWithdrawals = await Withdrawal.find({ driver: d._id, status: 'pending' });
            const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

            const walletDoc = await Wallet.findOne({ user: d._id });
            let totalCredits = 0;
            let totalDebits = 0;
            let transactionHistory = [];

            if (walletDoc && walletDoc.transactions) {
                transactionHistory = walletDoc.transactions.map(tx => tx.toObject ? tx.toObject() : tx);
                walletDoc.transactions.forEach(tx => {
                    if (tx.type === 'credit') totalCredits += (tx.amount || 0);
                    if (tx.type === 'debit') totalDebits += (tx.amount || 0);
                });
            }

            return {
                driverId: d._id,
                driverName: d.name,
                phone: d.phone || 'N/A',
                email: d.email || 'N/A',
                balance: d.walletBalance || 0,
                totalEarned: d.driverDetails?.earnings || 0,
                pendingAmount,
                totalCredits,
                totalDebits,
                walletStatus: d.isBlocked ? 'suspended' : 'active',
                transactions: transactionHistory
            };
        }));

        res.json({ success: true, count: walletsData.length, data: walletsData });
    } catch (error) {
        console.error('getDriverWallets error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Admin Credit / Debit Wallet Adjustment for Drivers/Partners (PE-01)
export const adjustDriverWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, amount, description } = req.body;

        if (!type || !amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Valid type (credit/debit) and positive amount required' });
        }

        const driver = await User.findById(id);
        if (!driver || !/^driver$/i.test(driver.role)) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        const adjustAmount = Number(amount);

        if (type === 'credit') {
            driver.walletBalance = (driver.walletBalance || 0) + adjustAmount;
        } else if (type === 'debit') {
            driver.walletBalance = (driver.walletBalance || 0) - adjustAmount;
        }

        await driver.save();

        let wallet = await Wallet.findOne({ user: driver._id });
        if (!wallet) {
            wallet = await Wallet.create({ user: driver._id, balance: driver.walletBalance, transactions: [] });
        }

        wallet.balance = driver.walletBalance;
        wallet.transactions.push({
            type,
            amount: adjustAmount,
            description: description || `Admin Manual ${type.toUpperCase()} Adjustment`,
            referenceId: `ADM-ADJ-${Date.now().toString().slice(-6)}`,
            timestamp: new Date()
        });

        await wallet.save();

        res.json({
            success: true,
            message: `Partner wallet ${type}ed by ₹${adjustAmount} successfully`,
            data: {
                driverId: driver._id,
                driverName: driver.name,
                balance: driver.walletBalance,
                transactions: wallet.transactions
            }
        });
    } catch (error) {
        console.error('adjustDriverWallet error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get passenger/customer wallets for admin (PE-03)
export const getPassengerWallets = async (req, res) => {
    try {
        const passengers = await User.find({ role: { $regex: /^passenger$/i } }).select('name _id walletBalance phone email isBlocked createdAt');
        console.log(`Admin fetching passenger wallets, found: ${passengers.length}`);

        const walletsData = await Promise.all(passengers.map(async (p) => {
            const walletDoc = await Wallet.findOne({ user: p._id });
            let totalCredits = 0;
            let totalRefunds = 0;
            let promoCredits = 0;
            let totalDebits = 0;
            let transactionHistory = [];

            if (walletDoc && walletDoc.transactions) {
                transactionHistory = walletDoc.transactions.map(tx => tx.toObject ? tx.toObject() : tx);
                walletDoc.transactions.forEach(tx => {
                    const desc = (tx.description || '').toLowerCase();
                    const amt = tx.amount || 0;
                    if (tx.type === 'credit') {
                        totalCredits += amt;
                        if (desc.includes('refund')) totalRefunds += amt;
                        if (desc.includes('promo') || desc.includes('bonus') || desc.includes('offer')) promoCredits += amt;
                    } else if (tx.type === 'debit') {
                        totalDebits += amt;
                    }
                });
            }

            return {
                passengerId: p._id,
                passengerName: p.name,
                phone: p.phone || 'N/A',
                email: p.email || 'N/A',
                balance: p.walletBalance || 0,
                totalCredits,
                totalRefunds,
                promoCredits,
                totalDebits,
                status: p.isBlocked ? 'suspended' : 'active',
                joinDate: p.createdAt,
                transactions: transactionHistory
            };
        }));

        res.json({ success: true, count: walletsData.length, data: walletsData });
    } catch (error) {
        console.error('getPassengerWallets error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Admin Credit / Refund / Promo / Debit Adjustment for Customer Wallets (PE-03)
export const adjustPassengerWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, amount, description } = req.body;

        if (!type || !amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Valid adjustment type and positive amount required' });
        }

        const passenger = await User.findById(id);
        if (!passenger || !/^passenger$/i.test(passenger.role)) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const adjustAmount = Number(amount);
        const isCreditOperation = type === 'credit' || type === 'refund' || type === 'promo';

        if (isCreditOperation) {
            passenger.walletBalance = (passenger.walletBalance || 0) + adjustAmount;
        } else if (type === 'debit') {
            passenger.walletBalance = (passenger.walletBalance || 0) - adjustAmount;
        }

        await passenger.save();

        let wallet = await Wallet.findOne({ user: passenger._id });
        if (!wallet) {
            wallet = await Wallet.create({ user: passenger._id, balance: passenger.walletBalance, transactions: [] });
        }

        wallet.balance = passenger.walletBalance;
        const txType = isCreditOperation ? 'credit' : 'debit';
        const formattedDesc = description || `Admin Manual ${type.toUpperCase()} Adjustment`;

        wallet.transactions.push({
            type: txType,
            amount: adjustAmount,
            description: formattedDesc,
            referenceId: `CUST-ADJ-${Date.now().toString().slice(-6)}`,
            timestamp: new Date()
        });

        await wallet.save();

        res.json({
            success: true,
            message: `Customer wallet adjusted by ₹${adjustAmount} (${type}) successfully`,
            data: {
                passengerId: passenger._id,
                passengerName: passenger.name,
                balance: passenger.walletBalance,
                transactions: wallet.transactions
            }
        });
    } catch (error) {
        console.error('adjustPassengerWallet error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get customer financial transactions (PE-04)
export const getCustomerTransactionsAdmin = async (req, res) => {
    try {
        const { type } = req.query;
        const wallets = await Wallet.find().populate('user', 'name phone email role');

        let customerTransactions = [];

        wallets.forEach(wallet => {
            if (wallet.user && /^passenger$/i.test(wallet.user.role)) {
                const userTxs = (wallet.transactions || []).map(tx => {
                    const txObj = tx.toObject ? tx.toObject() : tx;
                    return {
                        ...txObj,
                        userName: wallet.user.name,
                        userPhone: wallet.user.phone || 'N/A',
                        userEmail: wallet.user.email || 'N/A',
                        userRole: wallet.user.role,
                        userId: wallet.user._id,
                        walletId: wallet._id
                    };
                });
                customerTransactions = [...customerTransactions, ...userTxs];
            }
        });

        if (type && type !== 'all') {
            customerTransactions = customerTransactions.filter(t => t.type === type);
        }

        customerTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ success: true, count: customerTransactions.length, data: customerTransactions });
    } catch (error) {
        console.error('getCustomerTransactionsAdmin error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get all pooling rides
export const getAllPools = async (req, res) => {
    try {
        const { type, status } = req.query;
        let query = {};

        if (type) query.type = type;
        if (status) query.status = status;

        const pools = await Ride.find(query)
            .populate('host', 'name email phone profileImage driverDetails')
            .populate('passengers.user', 'name email phone')
            .sort({ scheduledTime: -1 });

        res.json({ success: true, count: pools.length, data: pools });
    } catch (error) {
        console.error('getAllPools error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// Get all ride bookings (on-demand)
export const getAllRides = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        const rides = await Booking.find(query)
            .populate('passenger', 'name email phone profileImage')
            .populate('driver', 'name email phone profileImage driverDetails')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: rides.length, data: rides });
    } catch (error) {
        console.error('getAllRides error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get single ride details
export const getRideById = async (req, res) => {
    try {
        const { id } = req.params;
        const ride = await Booking.findById(id)
            .populate('passenger', 'name email phone profileImage verificationStatus')
            .populate('driver', 'name email phone profileImage driverDetails verificationStatus')
            .lean();

        if (!ride) {
            return res.status(404).json({ success: false, message: 'Ride not found' });
        }

        res.json({ success: true, data: ride });
    } catch (error) {
        console.error('getRideById error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get single pool details
export const getPoolById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await Ride.findById(id)
            .populate('host', 'name email phone profileImage driverDetails verificationStatus')
            .populate('passengers.user', 'name email phone profileImage verificationStatus')
            .lean();

        if (!pool) {
            return res.status(404).json({ success: false, message: 'Pool not found' });
        }

        res.json({ success: true, data: pool });
    } catch (error) {
        console.error('getPoolById error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// Get all wallet transactions for the admin feed
export const getAllTransactions = async (req, res) => {
    try {
        // Fetch all wallets and their transactions
        const wallets = await Wallet.find().populate('user', 'name phone role');

        let allTransactions = [];

        wallets.forEach(wallet => {
            if (wallet.user) {
                const userTransactions = wallet.transactions.map(tx => ({
                    ...tx.toObject(),
                    userName: wallet.user.name,
                    userRole: wallet.user.role,
                    userId: wallet.user._id,
                    walletId: wallet._id
                }));
                allTransactions = [...allTransactions, ...userTransactions];
            }
        });

        // Sort by timestamp descending
        allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Return latest 100 for now
        res.json({ success: true, count: allTransactions.length, data: allTransactions.slice(0, 100) });
    } catch (error) {
        console.error('getAllTransactions error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get ride history for a specific driver
export const getDriverRides = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        // 1. Fetch on-demand bookings
        let bookingQuery = { driver: id };
        if (status && status !== 'all') {
            bookingQuery.status = status;
        }

        const bookings = await Booking.find(bookingQuery)
            .populate('passenger', 'name phone email')
            .sort({ createdAt: -1 });

        // Transform bookings for consistent output
        const formattedBookings = bookings.map(b => ({
            id: b._id,
            passenger: b.passenger?.name || 'Unknown',
            driver: req.params.id, // for consistency if needed
            from: b.pickup?.address || 'N/A',
            to: b.dropoff?.address || 'N/A',
            date: new Date(b.createdAt).toISOString().split('T')[0],
            time: new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amount: b.finalFare || b.offeredFare || 0,
            status: b.status,
            type: 'on-demand'
        }));

        // 2. Fetch pooling rides (host)
        let poolQuery = { host: id };
        if (status && status !== 'all') {
            poolQuery.status = status;
        }

        const pools = await Ride.find(poolQuery).sort({ createdAt: -1 });

        // Transform pools for consistent output
        const formattedPools = pools.map(p => ({
            id: p._id,
            passenger: `${p.passengers.length} Bookings`,
            driver: req.params.id,
            from: p.origin?.name || 'N/A',
            to: p.destination?.name || 'N/A',
            date: new Date(p.scheduledTime).toISOString().split('T')[0],
            time: new Date(p.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amount: p.passengers.reduce((acc, curr) => acc + (curr.seatsBooked * p.pricePerSeat), 0),
            status: p.status,
            type: 'pooling'
        }));

        const allRides = [...formattedBookings, ...formattedPools].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

        res.json({ success: true, count: allRides.length, data: allRides });
    } catch (error) {
        console.error('getDriverRides error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Placeholder for refund actions (to be implemented with specific refund logic)
export const handleRefundAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        res.json({ success: true, message: `Refund ${id} ${action}ed (Mocked)` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// Get all withdrawal requests
export const getWithdrawals = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const withdrawals = await Withdrawal.find(query)
            .populate('driver', 'name email phone walletBalance driverDetails.bankDetails')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: withdrawals.length, data: withdrawals });
    } catch (error) {
        console.error('getWithdrawals error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update withdrawal status (Approve/Reject)
export const updateWithdrawalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remark, transactionId } = req.body; // 'approved', 'rejected', 'completed'

        const withdrawal = await Withdrawal.findById(id).populate('driver');
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }

        if (withdrawal.status === 'completed' || withdrawal.status === 'rejected') {
            return res.status(400).json({ success: false, message: 'Withdrawal already processed' });
        }

        withdrawal.status = status;
        if (remark) withdrawal.remark = remark;
        if (transactionId) withdrawal.transactionId = transactionId;

        const driver = await User.findById(withdrawal.driver._id);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        // --- Handle Approval (Deduct Funds) ---
        if (status === 'approved' || status === 'completed') {
            // Check if we already deducted (To prevent double deduction if calling twice)
            if (withdrawal.processedAt) {
                return res.status(400).json({ success: false, message: 'Withdrawal already processed and deducted' });
            }

            if (driver.walletBalance < withdrawal.amount) {
                // Should not happen with pending check, but good for safety
                return res.status(400).json({ success: false, message: `Insufficient driver balance (Current: ₹${driver.walletBalance})` });
            }

            driver.walletBalance -= withdrawal.amount;
            await driver.save();

            let wallet = await Wallet.findOne({ user: driver._id });
            if (!wallet) {
                wallet = await Wallet.create({ user: driver._id, balance: driver.walletBalance });
            }
            wallet.balance = driver.walletBalance;
            wallet.transactions.push({
                type: 'debit',
                amount: withdrawal.amount,
                description: `Withdrawal Settled: Request ID ${id.slice(-6).toUpperCase()}`,
                referenceId: id
            });
            await wallet.save();

            withdrawal.status = 'completed'; // Ensure final state is completed
            withdrawal.processedAt = new Date();
        }

        // --- Handle Rejection (No deduction needed now since we didn't deduct on request) ---
        // If we previously deducted on request, we would refund here. 
        // But in this new flow, rejection just means the balance stays as is.
        // If we wanted to "unlock" something, we would, but here the "Pending Check" in walletController 
        // will be cleared once this withdrawal is no longer 'pending'.

        await withdrawal.save();
        res.json({ success: true, message: `Withdrawal ${status} successfully and wallet updated`, data: withdrawal });
    } catch (error) {
        console.error('updateWithdrawalStatus error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Promoted Routes Management ---

export const addPromotedRoute = async (req, res) => {
    try {
        const { name, startingPrice, category, pickup, destination, subtitle, discount, tag, duration, rating, seats } = req.body;
        let image = req.body.image;

        if (req.file) {
            image = await processUploadedFile(req.file, 'promoted_routes');
        }

        const route = await PromotedRoute.create({ name, startingPrice, category, image, pickup, destination, subtitle, discount, tag, duration, rating, seats });
        res.status(201).json({ success: true, data: route });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getPromotedRoutesAdmin = async (req, res) => {
    try {
        const routes = await PromotedRoute.find().sort({ createdAt: -1 });
        res.json({ success: true, count: routes.length, data: routes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updatePromotedRoute = async (req, res) => {
    try {
        const { name, startingPrice, category, pickup, destination, subtitle, discount, tag, duration, rating, seats } = req.body;
        let updateData = { name, startingPrice, category, pickup, destination, subtitle, discount, tag, duration, rating, seats };

        if (req.file) {
            updateData.image = await processUploadedFile(req.file, 'promoted_routes');
        } else if (req.body.image) {
            updateData.image = req.body.image; // Keep existing image if a URL is provided
        }

        const route = await PromotedRoute.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!route) {
            return res.status(404).json({ success: false, message: 'Route not found' });
        }
        res.json({ success: true, data: route });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deletePromotedRoute = async (req, res) => {
    try {
        await PromotedRoute.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Route deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Offers Management ---

export const addOffer = async (req, res) => {
    try {
        const {
            title, description, badge, actionText, targetScreen, pillText,
            promoCode, discountType, flatDiscountAmount, discountPercentage, maxDiscount, minOrderAmount,
            startDate, endDate, isActive
        } = req.body;
        let image = req.body.image;

        if (req.file) {
            image = await processUploadedFile(req.file, 'offers');
        }

        const offer = await Offer.create({
            title, description, badge, actionText, targetScreen, pillText,
            promoCode: promoCode || '',
            discountType: discountType || 'flat',
            flatDiscountAmount: flatDiscountAmount ? Number(flatDiscountAmount) : 0,
            discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : 0,
            minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
            image
        });
        res.status(201).json({ success: true, data: offer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getOffersAdmin = async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json({ success: true, count: offers.length, data: offers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updateOffer = async (req, res) => {
    try {
        const {
            title, description, badge, actionText, targetScreen, pillText,
            promoCode, discountType, flatDiscountAmount, discountPercentage, maxDiscount, minOrderAmount,
            startDate, endDate, isActive
        } = req.body;
        let updateData = {
            title, description, badge, actionText, targetScreen, pillText,
            promoCode: promoCode || '',
            discountType: discountType || 'flat',
            flatDiscountAmount: flatDiscountAmount !== undefined ? Number(flatDiscountAmount) : 0,
            discountPercentage: discountPercentage !== undefined ? Number(discountPercentage) : 0,
            maxDiscount: maxDiscount !== undefined ? Number(maxDiscount) : 0,
            minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : 0,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
        };

        if (isActive !== undefined) {
            updateData.isActive = isActive === 'true' || isActive === true;
        }

        if (req.file) {
            updateData.image = await processUploadedFile(req.file, 'offers');
        } else if (req.body.image) {
            updateData.image = req.body.image;
        } else if (req.body.image === '') {
            updateData.image = '';
        }

        const offer = await Offer.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        res.json({ success: true, data: offer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const toggleOfferActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id);

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        offer.isActive = !offer.isActive;
        await offer.save();

        res.json({ success: true, message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`, data: offer });
    } catch (error) {
        console.error('toggleOfferActiveStatus error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deleteOffer = async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Driver Offers Management ---

export const addDriverOffer = async (req, res) => {
    try {
        const { title, description, targetRides, bonusAmount, isActive } = req.body;
        const offer = await DriverOffer.create({ title, description, targetRides, bonusAmount, isActive });
        res.status(201).json({ success: true, data: offer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getDriverOffers = async (req, res) => {
    try {
        const offers = await DriverOffer.find().sort({ createdAt: -1 });
        res.json({ success: true, count: offers.length, data: offers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updateDriverOffer = async (req, res) => {
    try {
        const { title, description, targetRides, bonusAmount, isActive } = req.body;
        const offer = await DriverOffer.findByIdAndUpdate(
            req.params.id,
            { title, description, targetRides, bonusAmount, isActive },
            { new: true }
        );
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Driver Offer not found' });
        }
        res.json({ success: true, data: offer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deleteDriverOffer = async (req, res) => {
    try {
        await DriverOffer.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Driver Offer deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ==========================================
// CASHFREE PAYOUT SETTINGS & DIRECT TRANSFER
// ==========================================

// @desc    Get Cashfree Payout settings (Mask secret key in response)
// @route   GET /api/admin/settings/payout
export const getPayoutSettings = async (req, res) => {
    try {
        const config = await getCashfreePayoutConfig();
        // Mask clientSecret for security
        const maskedSecret = config.clientSecret
            ? config.clientSecret.length > 8
                ? config.clientSecret.slice(0, 4) + '••••••••' + config.clientSecret.slice(-4)
                : '••••••••'
            : '';

        res.json({
            success: true,
            data: {
                clientId: config.clientId,
                clientSecret: maskedSecret,
                hasSecret: Boolean(config.clientSecret),
                environment: config.environment,
                isEnabled: config.isEnabled,
                transferModePreference: config.transferModePreference
            }
        });
    } catch (error) {
        console.error('getPayoutSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payout settings' });
    }
};

// @desc    Update Cashfree Payout settings in DB
// @route   PUT /api/admin/settings/payout
export const updatePayoutSettings = async (req, res) => {
    try {
        const { clientId, clientSecret, environment, isEnabled, transferModePreference } = req.body;

        const currentConfig = await getCashfreePayoutConfig();

        // If clientSecret is masked or untouched, retain existing secret
        let newSecret = currentConfig.clientSecret;
        if (clientSecret && !clientSecret.includes('••••')) {
            newSecret = clientSecret.trim();
        }

        const env = (environment || 'SANDBOX').trim().toUpperCase();

        // STRICT CHECK: Reject placeholder keys in PRODUCTION
        if (env === 'PRODUCTION' || env === 'PROD') {
            const lowerId = (clientId || '').toLowerCase();
            const lowerSec = (newSecret || '').toLowerCase();
            if (
                !clientId ||
                !newSecret ||
                lowerId.includes('dummy') ||
                lowerId.includes('placeholder') ||
                lowerId.includes('your_') ||
                lowerSec.includes('dummy') ||
                lowerSec.includes('placeholder') ||
                lowerSec.includes('your_')
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Live Production mode requires valid Cashfree Payout Client ID & Secret Key. Placeholders are strictly prohibited.'
                });
            }
        }

        const updatedValue = {
            clientId: (clientId || '').trim(),
            clientSecret: newSecret,
            environment: env,
            isEnabled: isEnabled !== false,
            transferModePreference: transferModePreference || 'auto'
        };

        await SystemSetting.findOneAndUpdate(
            { key: 'cashfree_payout_config' },
            {
                key: 'cashfree_payout_config',
                value: updatedValue,
                description: 'Cashfree Payout credentials and environment configuration'
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: `Payout configuration successfully saved in database (${env} mode)`,
            data: {
                clientId: updatedValue.clientId,
                environment: updatedValue.environment,
                isEnabled: updatedValue.isEnabled,
                transferModePreference: updatedValue.transferModePreference
            }
        });
    } catch (error) {
        console.error('updatePayoutSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to update payout settings' });
    }
};

// @desc    Test connection with Cashfree Payout API using saved or provided credentials
// @route   POST /api/admin/settings/payout/test-connection
export const testPayoutConnection = async (req, res) => {
    try {
        const { clientId, clientSecret, environment } = req.body || {};

        let testCreds = null;
        if (clientId && clientSecret && !clientSecret.includes('••••')) {
            testCreds = {
                clientId: clientId.trim(),
                clientSecret: clientSecret.trim(),
                environment: (environment || 'SANDBOX').trim().toUpperCase()
            };
        }

        const result = await testCashfreePayoutConnection(testCreds);
        res.json(result);
    } catch (error) {
        console.error('testPayoutConnection error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Connection test failed'
        });
    }
};

// @desc    Process Instant Driver Payout via Cashfree
// @route   POST /api/admin/withdrawals/:id/payout
export const processCashfreeWithdrawalPayout = async (req, res) => {
    try {
        const { id } = req.params;
        const withdrawal = await Withdrawal.findById(id).populate('driver');

        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }

        if (withdrawal.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Withdrawal is already completed' });
        }

        if (withdrawal.status === 'rejected') {
            return res.status(400).json({ success: false, message: 'Withdrawal was rejected. Create a new request.' });
        }

        const driver = await User.findById(withdrawal.driver._id);
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver account not found' });
        }

        if (driver.walletBalance < withdrawal.amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient driver wallet balance (Current: ₹${driver.walletBalance}, Requested: ₹${withdrawal.amount})`
            });
        }

        // Get bank or UPI details
        const bank = withdrawal.bankDetails?.accountNumber
            ? withdrawal.bankDetails
            : driver.driverDetails?.bankDetails;

        const upiId = withdrawal.bankDetails?.upiId || driver.driverDetails?.bankDetails?.upiId || '';

        if ((!bank || !bank.accountNumber || !bank.ifscCode) && !upiId) {
            return res.status(400).json({
                success: false,
                message: 'No valid Bank Account or UPI ID configured for this driver. Please check driver bank details.'
            });
        }

        // Execute Cashfree Transfer
        const transferResult = await executeCashfreeTransfer({
            transferId: withdrawal._id,
            amount: withdrawal.amount,
            phone: driver.phone,
            name: bank?.accountHolderName || driver.name,
            email: driver.email,
            bankAccount: bank?.accountNumber || '',
            ifsc: bank?.ifscCode || '',
            upiId: upiId,
            remarks: `Sanchari Payout #${withdrawal._id.toString().slice(-6).toUpperCase()}`
        });

        // Deduct Driver Balance
        driver.walletBalance -= withdrawal.amount;
        await driver.save();

        // Update Wallet Ledger
        let wallet = await Wallet.findOne({ user: driver._id });
        if (!wallet) {
            wallet = await Wallet.create({ user: driver._id, balance: driver.walletBalance });
        }
        wallet.balance = driver.walletBalance;
        wallet.transactions.push({
            type: 'debit',
            amount: withdrawal.amount,
            description: `Cashfree Payout Disbursed (${transferResult.transferMode.toUpperCase()}) - UTR: ${transferResult.utr}`,
            referenceId: withdrawal._id
        });
        await wallet.save();

        // Update Withdrawal record
        withdrawal.status = 'completed';
        withdrawal.transactionId = transferResult.utr;
        withdrawal.processedAt = new Date();
        withdrawal.remark = `Settled via Cashfree Payout (${transferResult.environment}) - UTR: ${transferResult.utr}`;
        await withdrawal.save();

        res.json({
            success: true,
            message: `Payout successfully processed! UTR: ${transferResult.utr}`,
            data: {
                withdrawal,
                utr: transferResult.utr,
                transferMode: transferResult.transferMode,
                environment: transferResult.environment
            }
        });
    } catch (error) {
        console.error('processCashfreeWithdrawalPayout error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to process Cashfree payout'
        });
    }
};

// ─── ADMIN PROFILE & CREDENTIALS ─────────────────────────────────
export const getAdminProfile = async (req, res) => {
    try {
        const admin = await User.findById(req.user._id).select('-password');
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin account not found' });
        }
        res.json({ success: true, data: admin });
    } catch (error) {
        console.error('getAdminProfile error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch admin profile' });
    }
};

export const updateAdminProfile = async (req, res) => {
    try {
        const admin = await User.findById(req.user._id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin account not found' });
        }

        const { name, email, phone, currentPassword, newPassword } = req.body;

        // 1. Email update
        if (email && email.trim().toLowerCase() !== (admin.email || '').toLowerCase()) {
            const trimmedEmail = email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                return res.status(400).json({ success: false, message: 'Invalid email address format' });
            }

            const existingUser = await User.findOne({
                email: trimmedEmail,
                _id: { $ne: admin._id }
            });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'This email is already in use by another user' });
            }

            admin.email = trimmedEmail;
        }

        // 2. Name update
        if (name && typeof name === 'string' && name.trim()) {
            admin.name = name.trim();
        }

        // 3. Phone update
        if (phone !== undefined && typeof phone === 'string') {
            admin.phone = phone.trim();
        }

        // 4. Password update
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
            }

            if (admin.password) {
                const isMatch = await bcrypt.compare(currentPassword, admin.password);
                if (!isMatch) {
                    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
                }
            }

            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(newPassword, salt);
        }

        await admin.save();

        const updatedData = admin.toObject();
        delete updatedData.password;

        res.json({
            success: true,
            message: 'Admin profile updated successfully',
            data: updatedData
        });
    } catch (error) {
        console.error('updateAdminProfile error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update admin profile' });
    }
};

