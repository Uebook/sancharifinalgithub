import connectDB from '../db.js';
import mongoose from 'mongoose';
import User from '../Models/User.js';

async function testDocSizes() {
  await connectDB();

  console.time('findUserExactRole');
  const drivers = await User.find({ role: 'driver' }).lean();
  console.timeEnd('findUserExactRole');

  console.log('Total drivers:', drivers.length);
  drivers.forEach(d => {
    const sizeInKB = Math.round(Buffer.byteLength(JSON.stringify(d), 'utf8') / 1024);
    console.log(`Driver ${d.name} (${d.applicationId || d._id}): ~${sizeInKB} KB`);
  });

  console.time('findWithoutLargeDocs');
  const lightDrivers = await User.find({ role: 'driver' }).select('-driverDetails.documents -documents').lean();
  console.timeEnd('findWithoutLargeDocs');

  await mongoose.disconnect();
}

testDocSizes().catch(console.error);
