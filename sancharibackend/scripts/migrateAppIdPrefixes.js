import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../db.js';
import User from '../Models/User.js';

dotenv.config();

const migratePrefixes = async () => {
    try {
        console.log('Connecting to database for Application ID prefix migration...');
        await connectDB();

        // Step 1: Migrate Passengers / Customers first (SAN-P- -> SAN-C-) so we free up SAN-P-
        const passengers = await User.find({
            $or: [{ role: 'passenger' }, { role: { $exists: false } }, { role: null }]
        });
        console.log(`Found ${passengers.length} passengers.`);
        let updatedPassengers = 0;
        for (const passenger of passengers) {
            if (passenger.applicationId && passenger.applicationId.startsWith('SAN-P-')) {
                const newId = passenger.applicationId.replace('SAN-P-', 'SAN-C-');
                await User.findByIdAndUpdate(passenger._id, { applicationId: newId });
                console.log(`Updated Customer ${passenger.name}: ${passenger.applicationId} -> ${newId}`);
                updatedPassengers++;
            }
        }

        // Step 2: Migrate Drivers / Partners (SAN-D- -> SAN-P-)
        const drivers = await User.find({ role: 'driver' });
        console.log(`Found ${drivers.length} drivers.`);
        let updatedDrivers = 0;
        for (const driver of drivers) {
            if (driver.applicationId && driver.applicationId.startsWith('SAN-D-')) {
                const newId = driver.applicationId.replace('SAN-D-', 'SAN-P-');
                await User.findByIdAndUpdate(driver._id, { applicationId: newId });
                console.log(`Updated Driver/Partner ${driver.name}: ${driver.applicationId} -> ${newId}`);
                updatedDrivers++;
            }
        }

        console.log(`\nMigration successfully finished! Updated ${updatedPassengers} passengers (to SAN-C-) and ${updatedDrivers} drivers (to SAN-P-).`);
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

migratePrefixes();
