import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../db.js';
import User from '../Models/User.js';
import Counter from '../Models/Counter.js';

dotenv.config();

const backfillApplicationIds = async () => {
    try {
        console.log('Connecting to database for Application ID backfill...');
        await connectDB();

        // 1. Process Drivers
        const drivers = await User.find({
            role: 'driver'
        }).sort({ createdAt: 1 });

        console.log(`Found ${drivers.length} drivers.`);
        let driverSeq = 0;

        // Check if counter already exists
        const existingDriverCounter = await Counter.findById('driver_app_id');
        if (existingDriverCounter) {
            driverSeq = existingDriverCounter.seq;
        }

        let updatedDrivers = 0;
        for (const driver of drivers) {
            if (!driver.applicationId) {
                driverSeq += 1;
                const formattedId = `SAN-D-${String(driverSeq).padStart(6, '0')}`;
                await User.findByIdAndUpdate(driver._id, { applicationId: formattedId });
                console.log(`Assigned ${formattedId} to Driver: ${driver.name} (${driver.email || driver.phone || driver._id})`);
                updatedDrivers++;
            }
        }

        // Update Driver Counter
        await Counter.findByIdAndUpdate(
            'driver_app_id',
            { seq: driverSeq },
            { upsert: true, new: true }
        );
        console.log(`Driver sequence updated to: ${driverSeq} (${updatedDrivers} drivers backfilled)`);

        // 2. Process Passengers
        const passengers = await User.find({
            $or: [{ role: 'passenger' }, { role: { $exists: false } }, { role: null }]
        }).sort({ createdAt: 1 });

        console.log(`Found ${passengers.length} passengers.`);
        let passengerSeq = 0;

        const existingPassengerCounter = await Counter.findById('passenger_app_id');
        if (existingPassengerCounter) {
            passengerSeq = existingPassengerCounter.seq;
        }

        let updatedPassengers = 0;
        for (const passenger of passengers) {
            if (!passenger.applicationId) {
                passengerSeq += 1;
                const formattedId = `SAN-P-${String(passengerSeq).padStart(6, '0')}`;
                await User.findByIdAndUpdate(passenger._id, { applicationId: formattedId });
                console.log(`Assigned ${formattedId} to Passenger: ${passenger.name} (${passenger.email || passenger.phone || passenger._id})`);
                updatedPassengers++;
            }
        }

        // Update Passenger Counter
        await Counter.findByIdAndUpdate(
            'passenger_app_id',
            { seq: passengerSeq },
            { upsert: true, new: true }
        );
        console.log(`Passenger sequence updated to: ${passengerSeq} (${updatedPassengers} passengers backfilled)`);

        // 3. Process Admins
        const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 });
        let adminSeq = 0;
        const existingAdminCounter = await Counter.findById('admin_app_id');
        if (existingAdminCounter) {
            adminSeq = existingAdminCounter.seq;
        }
        let updatedAdmins = 0;
        for (const admin of admins) {
            if (!admin.applicationId) {
                adminSeq += 1;
                const formattedId = `SAN-A-${String(adminSeq).padStart(6, '0')}`;
                await User.findByIdAndUpdate(admin._id, { applicationId: formattedId });
                console.log(`Assigned ${formattedId} to Admin: ${admin.name}`);
                updatedAdmins++;
            }
        }
        await Counter.findByIdAndUpdate('admin_app_id', { seq: adminSeq }, { upsert: true, new: true });

        console.log('\n--- Backfill Summary ---');
        console.log(`Total Drivers Backfilled: ${updatedDrivers} (Current Counter: SAN-D-${String(driverSeq).padStart(6, '0')})`);
        console.log(`Total Passengers Backfilled: ${updatedPassengers} (Current Counter: SAN-P-${String(passengerSeq).padStart(6, '0')})`);
        console.log(`Total Admins Backfilled: ${updatedAdmins}`);
        console.log('Application ID backfill complete!');

        process.exit(0);
    } catch (error) {
        console.error('Error during Application ID backfill:', error);
        process.exit(1);
    }
};

backfillApplicationIds();
