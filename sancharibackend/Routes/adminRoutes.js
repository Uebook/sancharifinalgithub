import express from 'express';
import { protect, adminOnly } from '../Middleware/authMiddleware.js';
import upload from '../Utils/multer.js';
import {
    getDrivers,
    getDriverByIdAdmin,
    getDriverDocumentsAdmin,
    verifyDriver,
    updateDriver,
    updateDriverStatus,
    deleteDriver,
    getPassengers,
    updatePassenger,
    deletePassenger,
    toggleBlockStatus,
    getPassengerRides,
    getPassengerTransactions,
    getDashboardStats,
    getFinancialOverview,
    getAllPools,
    getAllRides,
    getRideById,
    getPoolById,
    getDriverWallets,
    adjustDriverWallet,
    getPassengerWallets,
    adjustPassengerWallet,
    getCustomerTransactionsAdmin,
    getAllTransactions,
    getDriverRides,
    getWithdrawals,
    updateWithdrawalStatus,
    addPromotedRoute,
    getPromotedRoutesAdmin,
    updatePromotedRoute,
    deletePromotedRoute,
    addOffer,
    getOffersAdmin,
    updateOffer,
    toggleOfferActiveStatus,
    deleteOffer,
    addDriverOffer,
    getDriverOffers,
    updateDriverOffer,
    deleteDriverOffer,
    getPayoutSettings,
    updatePayoutSettings,
    testPayoutConnection,
    processCashfreeWithdrawalPayout
} from '../Controllers/adminController.js';

const router = express.Router();

// All routes are protected and admin-only
router.use(protect, adminOnly);

router.get('/drivers', getDrivers);
router.get('/drivers/:id', getDriverByIdAdmin);
router.get('/drivers/:id/documents', getDriverDocumentsAdmin);
router.put('/drivers/:id', updateDriver);
router.put('/drivers/:id/status', updateDriverStatus);
router.delete('/drivers/:id', deleteDriver);
router.get('/passengers', getPassengers);
router.put('/passengers/:id', updatePassenger);
router.delete('/passengers/:id', deletePassenger);
router.put('/passengers/:id/block', toggleBlockStatus);
router.get('/passengers/:id/rides', getPassengerRides);
router.get('/passengers/:id/transactions', getPassengerTransactions);
router.put('/drivers/:id/verify', verifyDriver);
router.get('/dashboard-stats', getDashboardStats);
router.get('/financial-overview', getFinancialOverview);
router.get('/driver-wallets', getDriverWallets);
router.post('/driver-wallets/:id/adjust', adjustDriverWallet);
router.get('/passenger-wallets', getPassengerWallets);
router.post('/passenger-wallets/:id/adjust', adjustPassengerWallet);
router.get('/customer-transactions', getCustomerTransactionsAdmin);
router.get('/drivers/:id/rides', getDriverRides);
router.get('/transactions', getAllTransactions);
router.get('/pools', getAllPools);
router.get('/pools/:id', getPoolById);
router.get('/rides', getAllRides);
router.get('/rides/:id', getRideById);
router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id', updateWithdrawalStatus);
router.post('/withdrawals/:id/payout', processCashfreeWithdrawalPayout);

// Payout Settings
router.get('/settings/payout', getPayoutSettings);
router.put('/settings/payout', updatePayoutSettings);
router.post('/settings/payout/test-connection', testPayoutConnection);

// Promoted Routes
router.post('/promoted-routes', upload.single('image'), addPromotedRoute);
router.get('/promoted-routes', getPromotedRoutesAdmin);
router.put('/promoted-routes/:id', upload.single('image'), updatePromotedRoute);
router.delete('/promoted-routes/:id', deletePromotedRoute);

// Offers Management
router.post('/offers', upload.single('image'), addOffer);
router.get('/offers', getOffersAdmin);
router.put('/offers/:id', upload.single('image'), updateOffer);
router.put('/offers/:id/toggle-active', toggleOfferActiveStatus);
router.delete('/offers/:id', deleteOffer);

// Driver Offers (Bonus Trips) Management
router.post('/driver-offers', addDriverOffer);
router.get('/driver-offers', getDriverOffers);
router.put('/driver-offers/:id', updateDriverOffer);
router.delete('/driver-offers/:id', deleteDriverOffer);

export default router;
