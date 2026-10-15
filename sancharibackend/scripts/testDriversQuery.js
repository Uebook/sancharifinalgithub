import connectDB from '../db.js';
import mongoose from 'mongoose';
import User from '../Models/User.js';
import Booking from '../Models/Booking.js';
import Ride from '../Models/Ride.js';

async function testOptimized() {
  await connectDB();

  console.time('optimizedDriversQuery');
  const drivers = await User.find({ role: { $in: ['driver', 'DRIVER'] } })
    .select('-password -driverDetails.documents')
    .sort({ createdAt: -1 })
    .lean();
  console.timeEnd('optimizedDriversQuery');

  console.log(`Fetched ${drivers.length} drivers`);
  const payloadSize = Buffer.byteLength(JSON.stringify(drivers), 'utf8') / 1024;
  console.log(`Payload size: ${payloadSize.toFixed(2)} KB`);

  await mongoose.disconnect();
}

testOptimized().catch(console.error);
