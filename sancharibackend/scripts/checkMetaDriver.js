import connectDB from '../db.js';
import mongoose from 'mongoose';
import User from '../Models/User.js';

async function checkMetaDriver() {
  await connectDB();
  const driver = await User.findOne({ email: /meta/i }).lean();
  if (driver) {
    console.log('Driver Name:', driver.name);
    console.log('Profile Image len:', driver.profileImage?.length);
    if (driver.driverDetails?.documents) {
      for (const [k, v] of Object.entries(driver.driverDetails.documents)) {
        console.log(`Doc [${k}]: type=${typeof v}, len=${typeof v === 'string' ? v.length : 'N/A'}`);
      }
    }
  }
  await mongoose.disconnect();
}

checkMetaDriver().catch(console.error);
