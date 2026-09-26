import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './Models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const TEST_PHONE = '8439993031';
const TEST_PASSWORD = 'Sanchari@2024';

async function seedTestAccounts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // ─── 1. PASSENGER ACCOUNT ────────────────────────────────────
    const existingPassenger = await User.findOne({ phone: TEST_PHONE, role: 'passenger' });
    if (existingPassenger) {
      console.log(`⚠️  Passenger already exists — deleting and recreating...`);
      await User.deleteOne({ _id: existingPassenger._id });
    }

    const passenger = await User.create({
      name: 'Apple Reviewer',
      phone: TEST_PHONE,
      email: 'reviewer@sanchari.io',
      password: hashedPassword,
      role: 'passenger',
      isActive: true,
      isBlocked: false,
      verificationStatus: { email: true, phone: true, idCard: true, communityTrusted: true },
      otp: '123456',
      otpExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ratings: { average: 5, count: 10 },
      walletBalance: 500,
      ridePersonality: ['Quiet Ride', 'AC On'],
      travelStats: { totalSavings: 1240, co2Saved: 18 },
    });
    console.log(`✅ Passenger: ${passenger.name} | ${TEST_PHONE} | passenger`);

    // ─── 2. DRIVER ACCOUNT ───────────────────────────────────────
    const existingDriver = await User.findOne({ phone: TEST_PHONE, role: 'driver' });
    if (existingDriver) {
      console.log(`⚠️  Driver already exists — deleting and recreating...`);
      await User.deleteOne({ _id: existingDriver._id });
    }

    const driver = await User.create({
      name: 'Apple Driver Reviewer',
      phone: TEST_PHONE,
      email: 'driver.reviewer@sanchari.io',
      password: hashedPassword,
      role: 'driver',
      isActive: true,
      isBlocked: false,
      driverApprovalStatus: 'approved',
      verificationStatus: { email: true, phone: true, idCard: true, communityTrusted: true },
      otp: '123456',
      otpExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ratings: { average: 4.9, count: 35 },
      walletBalance: 1200,
      driverDetails: {
        licenseNumber: 'DL0420110012345',
        isOnline: false,
        isAvailable: true,
        totalRides: 42,
        earnings: 15000,
        ratings: { average: 4.9, count: 35 },
        vehicle: {
          make: 'Maruti Suzuki',
          model: 'Swift Dzire',
          year: '2022',
          plateNumber: 'MH31AB1234',
          color: 'White',
          type: 'CAR',
          fuelType: 'Petrol',
          seatingCapacity: 4,
          bootSpace: 'Medium',
        },
        currentLocation: { type: 'Point', coordinates: [79.0882, 21.1458], heading: 0, speed: 0 },
        preferences: { outstationRatePerKm: 15, nightCharge: 250, allowNightStay: false },
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          accountHolderName: 'Apple Driver Reviewer',
        },
        documents: {
          aadharFront: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          aadharBack: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          licenseFront: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          licenseBack: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          registration: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          insurance: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          rc: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        },
      },
    });
    console.log(`✅ Driver: ${driver.name} | ${TEST_PHONE} | driver | APPROVED`);

    console.log('\n─────────────────────────────────────────');
    console.log('🎉 Test accounts ready!');
    console.log(`📱 Phone:    ${TEST_PHONE}`);
    console.log(`🔐 OTP:      123456  (static, never expires)`);
    console.log(`🔑 Password: ${TEST_PASSWORD}`);
    console.log('👤 Passenger → reviewer@sanchari.io');
    console.log('🚗 Driver    → driver.reviewer@sanchari.io | APPROVED');
    console.log('─────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedTestAccounts();
