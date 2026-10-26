import User from '../Models/User.js';
import Driver from '../Models/Driver.js';
import Vehicle from '../Models/Vehicle.js';
import DriverOffer from '../Models/DriverOffer.js';
import PlannedCommute from '../Models/PlannedCommute.js';
import Booking from '../Models/Booking.js';
import Ride from '../Models/Ride.js';
import { processUploadedFile } from '../Utils/uploadHelper.js';

// @desc    Get driver profile (with driverDetails)
// @route   GET /api/driver/profile
// @access  Private (Driver)
export const getDriverProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update driver details (Vehicle, License, etc.)
// @route   PATCH /api/driver/profile
// @access  Private (Driver)
export const updateDriverProfile = async (req, res) => {
  try {
    const { name, phone, email, vehicle, licenseNumber, documents, bankDetails } = req.body || {};
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update Basic Info
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email) user.email = email;

    // Ensure driverDetails object exists
    if (!user.driverDetails) user.driverDetails = {};

    // Update driverDetails fields if provided
    if (licenseNumber) user.driverDetails.licenseNumber = licenseNumber;

    // Handle boolean isOnline separately
    if (typeof req.body.isOnline !== 'undefined') {
      user.driverDetails.isOnline = req.body.isOnline;
    }

    if (vehicle) {
      user.driverDetails.vehicle = {
        ...user.driverDetails.vehicle,
        ...vehicle
      };
    }

    if (documents) {
      user.driverDetails.documents = {
        ...user.driverDetails.documents,
        ...documents
      };
    }

    if (bankDetails) {
      user.driverDetails.bankDetails = {
        ...user.driverDetails.bankDetails,
        ...bankDetails
      };
    }

    await user.save();

    res.json({ success: true, message: 'Driver profile updated', data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Toggle Online/Offline status
// @route   PATCH /api/driver/toggle-status
// @access  Private (Driver)
export const toggleOnline = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { isOnline } = req.body || {}; // Expect boolean

    if (isOnline !== undefined) {
      user.driverDetails.isOnline = isOnline;
    } else {
      // Toggle if not specified
      user.driverDetails.isOnline = !user.driverDetails.isOnline;
    }

    await user.save();

    res.json({
      success: true,
      message: `You are now ${user.driverDetails.isOnline ? 'Online' : 'Offline'}`,
      data: { isOnline: user.driverDetails.isOnline }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update driver GPS location
// @route   PATCH /api/driver/location
// @access  Private (Driver)
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.driverDetails.currentLocation = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    await user.save();

    res.json({ success: true, message: 'Location updated successfully', data: user.driverDetails.currentLocation });
  } catch (error) {
    console.error('updateLocation error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// @desc    Handle Document Upload
// @route   POST /api/driver/upload
// @access  Private
export const uploadDocument = async (req, res) => {
  try {
    console.log("DEBUG: Upload Request Body:", req.body);
    console.log("DEBUG: Upload File:", req.file);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { docType } = req.body;
    const isDriver = req.user.role === 'driver';
    const validDocTypes = ['licenseFront', 'licenseBack', 'registration', 'insurance', 'aadharFront', 'aadharBack', 'panCard', 'permit', 'fitness', 'rc', 'profileImage'];

    if (!docType || !validDocTypes.includes(docType)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing docType' });
    }

    // Security: Non-drivers can ONLY upload profileImage
    if (!isDriver && docType !== 'profileImage') {
      return res.status(403).json({ success: false, message: 'Passengers can only upload profile images' });
    }

    // Process file to Cloudinary or resilient Data URI
    const filePath = await processUploadedFile(req.file, docType === 'profileImage' ? 'profile_images' : 'driver_documents');

    if (!filePath) {
      return res.status(500).json({ success: false, message: 'Failed to process uploaded file' });
    }

    let updateQuery = {};
    if (docType === 'profileImage') {
      updateQuery = { $set: { profileImage: filePath } };
    } else {
      const updateField = `driverDetails.documents.${docType}`;
      updateQuery = {
        $set: {
          [updateField]: filePath,
          driverApprovalStatus: 'pending' // Reset to pending for admin review
        }
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateQuery,
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'File uploaded and saved', filePath, docType });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ success: false, message: 'Upload Failed', error: error.message });
  }
};

// @desc    Get all online drivers
// @route   GET /api/driver/online
// @access  Private
export const getOnlineDrivers = async (req, res) => {
  try {
    const drivers = await User.find({
      role: 'driver',
      'driverDetails.isOnline': true
    }).select('-password');

    res.json({ success: true, data: drivers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get dynamic earnings for the driver
// @route   GET /api/driver/earnings
// @access  Private (Driver)
export const getEarnings = async (req, res) => {
  try {
    const driverId = req.user._id;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [bookings, pools] = await Promise.all([
      Booking.find({ driver: driverId, status: 'completed' }),
      Ride.find({ host: driverId })
    ]);

    let today = 0;
    let week = 0;
    let month = 0;
    let total = 0;
    let todayRides = 0;
    let totalRides = 0;

    bookings.forEach(b => {
      const date = new Date(b.completedAt || b.createdAt);
      const amount = b.finalFare || 0;
      total += amount;
      totalRides += 1;

      if (date >= startOfToday) {
        today += amount;
        todayRides += 1;
      }
      if (date >= startOfWeek) week += amount;
      if (date >= startOfMonth) month += amount;
    });

    pools.forEach(p => {
      const date = new Date(p.updatedAt || p.scheduledTime);
      const joinedCount = p.passengers ? p.passengers.length : 0;
      const amount = (p.pricePerSeat || 0) * joinedCount;
      if (amount > 0) {
        total += amount;
        totalRides += 1;
        if (date >= startOfToday) {
          today += amount;
          todayRides += 1;
        }
        if (date >= startOfWeek) week += amount;
        if (date >= startOfMonth) month += amount;
      }
    });

    res.json({
      success: true,
      data: { today, week, month, total, currentBalance: total, todayRides, totalRides }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error fetching earnings' });
  }
};

/**
 * @desc    Add or update vehicle for driver
 * @route   POST /api/driver/vehicle
 */
export const addVehicle = async (req, res, next) => {
  try {
    let driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      // Fallback: update User model driverDetails.vehicle directly
      const user = await User.findById(req.user._id);
      if (user) {
        user.driverDetails.vehicle = { ...user.driverDetails.vehicle, ...req.body };
        await user.save();
        return res.status(200).json({ success: true, message: 'Vehicle details updated successfully', data: { vehicle: user.driverDetails.vehicle } });
      }
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const vehicle = await Vehicle.create({ ...req.body, driverId: driver._id });
    await Driver.findByIdAndUpdate(driver._id, { vehicleId: vehicle._id });

    res.status(201).json({ success: true, data: { vehicle } });
  } catch (err) {
    if (typeof next === 'function') {
      next(err);
    } else {
      res.status(500).json({ success: false, message: 'Server Error adding vehicle' });
    }
  }
};

/**
 * @desc    Get active driver offers
 * @route   GET /api/driver/offers
 */
export const getActiveDriverOffers = async (req, res) => {
  try {
    const offers = await DriverOffer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: offers.length, data: offers });
  } catch (error) {
    console.error('getActiveDriverOffers error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching driver offers' });
  }
};

/**
 * @desc    Get trip modes statistics
 * @route   GET /api/driver/trip-modes
 */
export const getTripModeStats = async (req, res) => {
  try {
    const cityDemand = await Booking.countDocuments({ status: 'pending', rideType: { $ne: 'outstation' } });
    const outstationDemand = await Booking.countDocuments({ status: 'pending', rideType: 'outstation' });
    
    const cityDemandCalc = cityDemand > 0 ? cityDemand + 3 : 12; // Example fallback logic
    const outstationDemandCalc = outstationDemand > 0 ? outstationDemand + 1 : 5;
    const rentalDemandCalc = 2; // Fixed fallback for rental if not tracked separately

    res.json({
      success: true,
      data: {
        cityPool: {
          earn: '₹150-₹300',
          time: '~45 min',
          demand: cityDemandCalc
        },
        outstationPool: {
          earn: '₹1,200-₹2,500',
          time: '3-5 hrs',
          demand: outstationDemandCalc
        },
        outstationRental: {
          earn: '₹3,500-₹8K+',
          time: 'Full day',
          demand: rentalDemandCalc
        }
      }
    });
  } catch (error) {
    console.error('getTripModeStats error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching trip stats' });
  }
};

/**
 * @desc    Get Driver Dashboard Summary
 * @route   GET /api/driver/dashboard-summary
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const driverId = req.user._id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

    // 1. Fetch completed bookings & pool rides
    const completedBookings = await Booking.find({ driver: driverId, status: 'completed' });
    const completedPools = await Ride.find({ host: driverId, status: 'completed' });

    let todayEarnings = 0;
    let todayRidesCount = 0;
    let weeklyEarnings = 0;

    completedBookings.forEach(b => {
      const date = new Date(b.completedAt || b.createdAt);
      const amount = b.finalFare || b.offeredFare || 0;
      if (date >= startOfToday) {
        todayEarnings += amount;
        todayRidesCount += 1;
      }
      if (date >= startOfWeek) {
        weeklyEarnings += amount;
      }
    });

    completedPools.forEach(p => {
      const date = new Date(p.updatedAt || p.scheduledTime);
      const poolRevenue = (p.passengers || [])
        .filter(pass => pass.bookingStatus === 'completed' || pass.bookingStatus === 'confirmed')
        .reduce((sum, pass) => sum + (pass.seatsBooked * (p.pricePerSeat || 0)), 0);

      if (date >= startOfToday) {
        todayEarnings += poolRevenue;
        todayRidesCount += 1;
      }
      if (date >= startOfWeek) {
        weeklyEarnings += poolRevenue;
      }
    });

    // 2. Compute target progress (default goal: ₹1,000)
    const dailyTargetGoal = 1000;
    const dailyTargetPercent = Math.min(100, Math.round((todayEarnings / dailyTargetGoal) * 100));

    // 3. Count active offers
    const activeBonusesCount = await DriverOffer.countDocuments({ isActive: true });

    // 4. Compute acceptance & cancellation rates
    const totalAssignedBookings = await Booking.countDocuments({ driver: driverId });
    const cancelledBookings = await Booking.countDocuments({ driver: driverId, status: 'cancelled' });

    const acceptanceRatePercent = totalAssignedBookings > 0
      ? Math.max(70, Math.round(((totalAssignedBookings - cancelledBookings) / totalAssignedBookings) * 100))
      : 95;

    const cancellationRatePercent = totalAssignedBookings > 0
      ? Math.round((cancelledBookings / totalAssignedBookings) * 100)
      : 2;

    const timeOnlineHours = Math.round((todayRidesCount * 0.8 + 0.5) * 10) / 10;

    res.json({
      success: true,
      data: {
        todayEarnings,
        todayRidesCount,
        timeOnlineHours,
        dailyTargetGoal,
        dailyTargetPercent,
        activeBonusesCount,
        acceptanceRatePercent,
        cancellationRatePercent,
        weeklyEarnings,
      },
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching dashboard summary' });
  }
};

/**
 * @desc    Get Live Demand Hotspots
 * @route   GET /api/driver/demand-hotspots
 */
export const getDemandHotspots = async (req, res) => {
  try {
    // Search pending bookings in database to build real hotspots
    const pendingBookings = await Booking.find({ status: 'pending' }).select('pickup');
    let hotspotsMap = {};

    pendingBookings.forEach(b => {
      const area = (b.pickup?.address || 'City Center').split(',')[0].trim();
      hotspotsMap[area] = (hotspotsMap[area] || 0) + 1;
    });

    let hotspots = Object.keys(hotspotsMap).map(name => ({
      name,
      count: hotspotsMap[name]
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    if (hotspots.length === 0) {
      hotspots = [
        { name: 'Kothapet', count: 12 },
        { name: 'LB Nagar', count: 8 },
        { name: 'Dilsukh', count: 5 },
      ];
    }

    res.json({
      success: true,
      data: {
        liveSearchingRiders: pendingBookings.length > 0 ? pendingBookings.length + 2 : 3,
        rateEstimate: '~₹450/hr',
        hotspots,
      },
    });
  } catch (error) {
    console.error('getDemandHotspots error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching demand hotspots' });
  }
};

/**
 * @desc    Save Planned Commute Schedule
 * @route   POST /api/driver/planned-commute
 */
export const savePlannedCommute = async (req, res) => {
  try {
    const {
      homeLocation,
      officeLocation,
      pickup,
      dropoff,
      waypoints,
      homeToOfficeTime,
      officeToHomeTime,
      seatPreferences,
      activeDays,
      vehicleType,
      routeDistance,
      routeDuration
    } = req.body;

    const homeAddr = typeof homeLocation === 'string' ? homeLocation : (homeLocation?.address || pickup || 'Home Location');
    const officeAddr = typeof officeLocation === 'string' ? officeLocation : (officeLocation?.address || dropoff || 'Office Location');

    const h2oTime = typeof homeToOfficeTime === 'object' ? (homeToOfficeTime?.time || '09:00 AM') : (homeToOfficeTime || '09:00 AM');
    const o2hTime = typeof officeToHomeTime === 'object' ? (officeToHomeTime?.time || '06:00 PM') : (officeToHomeTime || '06:00 PM');
    const h2oEnabled = typeof homeToOfficeTime === 'object' && typeof homeToOfficeTime?.enabled === 'boolean' ? homeToOfficeTime.enabled : true;
    const o2hEnabled = typeof officeToHomeTime === 'object' && typeof officeToHomeTime?.enabled === 'boolean' ? officeToHomeTime.enabled : true;

    const planned = await PlannedCommute.findOneAndUpdate(
      { driver: req.user._id },
      {
        driver: req.user._id,
        vehicleType: vehicleType || 'BIKE',
        homeLocation: { address: homeAddr },
        officeLocation: { address: officeAddr },
        waypoints: waypoints || [],
        homeToOfficeTime: { time: h2oTime, enabled: h2oEnabled },
        officeToHomeTime: { time: o2hTime, enabled: o2hEnabled },
        seatPreferences: seatPreferences || { seatsCount: 1, isAC: false, isLadiesOnly: false },
        activeDays: activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        routeDistance: routeDistance || '',
        routeDuration: routeDuration || '',
        status: 'ACTIVE',
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ success: true, message: 'Planned commute saved successfully', data: planned });
  } catch (error) {
    console.error('savePlannedCommute error:', error);
    res.status(500).json({ success: false, message: 'Server Error saving planned commute' });
  }
};

/**
 * @desc    Get Planned Commute Schedule
 * @route   GET /api/driver/planned-commute
 */
export const getPlannedCommute = async (req, res) => {
  try {
    const planned = await PlannedCommute.findOne({ driver: req.user._id });
    res.json({ success: true, data: planned || null });
  } catch (error) {
    console.error('getPlannedCommute error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching planned commute' });
  }
};

