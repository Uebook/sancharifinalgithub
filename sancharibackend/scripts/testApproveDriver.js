import connectDB from '../db.js';
import mongoose from 'mongoose';
import User from '../Models/User.js';

async function testApprove() {
  await connectDB();
  const driverId = '6ab4fc08be7aea6a7fa76d13';
  console.log('Finding driver:', driverId);
  const driver = await User.findById(driverId);
  if (!driver) {
    console.log('Driver not found');
    return;
  }
  console.log('Found driver:', driver.name, 'current status:', driver.driverApprovalStatus);

  try {
    driver.driverApprovalStatus = 'approved';
    driver.rejectionReason = "";
    driver.verificationStatus = {
      email: true,
      phone: true,
      idCard: true,
      communityTrusted: true
    };
    if (!driver.driverDetails) driver.driverDetails = {};
    driver.driverDetails.isOnline = false;
    await driver.save();
    console.log('Driver approved successfully!');
  } catch (err) {
    console.error('Save error:', err);
  }

  await mongoose.disconnect();
}

testApprove().catch(console.error);
