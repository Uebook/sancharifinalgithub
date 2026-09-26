import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './Models/User.js';
import Ride from './Models/Ride.js';
import Booking from './Models/Booking.js';

dotenv.config();

// ─── Nagpur Coordinates ───────────────────────────────────────────
const NAGPUR_RAILWAY = {
  name: 'Nagpur Railway Station, Nagpur, Maharashtra',
  coordinates: [79.0849, 21.1458],  // [lng, lat]
};
const NAGPUR_AIRPORT = {
  name: 'Dr. Babasaheb Ambedkar International Airport, Nagpur',
  coordinates: [79.0472, 21.0922],  // [lng, lat]
};

// Distance: ~8.5 km, ~20 mins

async function seedFutureRides() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get the driver test account
    const driver = await User.findOne({ phone: '8439993031', role: 'driver' });
    const passenger = await User.findOne({ phone: '8439993031', role: 'passenger' });

    if (!driver) {
      console.error('❌ Driver account (8439993031) not found. Run seedTestAccounts.js first.');
      process.exit(1);
    }
    if (!passenger) {
      console.error('❌ Passenger account (8439993031) not found. Run seedTestAccounts.js first.');
      process.exit(1);
    }

    console.log(`✅ Driver: ${driver.name} (${driver._id})`);
    console.log(`✅ Passenger: ${passenger.name} (${passenger._id})`);

    // Clean up old test rides from this driver
    const deletedRides = await Ride.deleteMany({ host: driver._id });
    const deletedBookings = await Booking.deleteMany({
      $or: [{ passenger: passenger._id }, { driver: driver._id }],
      'pickup.address': { $regex: 'Nagpur Railway', $options: 'i' }
    });
    console.log(`🗑️  Cleared ${deletedRides.deletedCount} old rides, ${deletedBookings.deletedCount} old bookings`);

    const ridesToCreate = [];
    const bookingsToCreate = [];
    const now = new Date();

    for (let day = 1; day <= 15; day++) {
      const rideDate = new Date(now);
      rideDate.setDate(now.getDate() + day);
      rideDate.setHours(8 + (day % 4), [0, 15, 30, 45][day % 4], 0, 0); // varied times: 8:00, 9:15, 10:30, 11:45 etc.

      // ── CARPOOL RIDE (Ride model) ──────────────────────────────
      ridesToCreate.push({
        host: driver._id,
        type: 'local',
        status: 'scheduled',
        origin: {
          name: NAGPUR_RAILWAY.name,
          location: {
            type: 'Point',
            coordinates: NAGPUR_RAILWAY.coordinates,
          },
        },
        destination: {
          name: NAGPUR_AIRPORT.name,
          location: {
            type: 'Point',
            coordinates: NAGPUR_AIRPORT.coordinates,
          },
        },
        route: {
          distance: 8500,    // metres
          duration: 1200,    // seconds (~20 mins)
          polyline: '',
        },
        scheduledTime: rideDate,
        vehicleType: 'CAR',
        vehicle: 'Maruti Swift Dzire — MH31AB1234',
        totalSeats: 4,
        availableSeats: 3,
        pricePerSeat: 80 + (day % 3) * 10,  // ₹80–₹100 varied
        seatPricing: { front: 100, middle: 80, back: 80 },
        poolCategory: 'CITY_POOL',
        passengers: [],
        acPremium: 0,
        ladiesSeatReserved: 1,
        luggageSpace: true,
        preferences: {
          music: day % 2 === 0,
          ac: true,
          quiet: day % 3 === 0,
          pets: false,
          womenOnly: false,
        },
      });

      // ── ON-DEMAND BOOKING (Booking model) ─────────────────────
      const bookingDate = new Date(rideDate);
      bookingDate.setHours(rideDate.getHours() + 2); // 2h after pool ride

      bookingsToCreate.push({
        passenger: passenger._id,
        driver: driver._id,
        pickup: {
          address: NAGPUR_RAILWAY.name,
          coordinates: NAGPUR_RAILWAY.coordinates,
        },
        dropoff: {
          address: NAGPUR_AIRPORT.name,
          coordinates: NAGPUR_AIRPORT.coordinates,
        },
        rideType: 'city',
        vehicleType: 'CAR',
        seats: 1,
        status: 'pending',
        estimatedFare: 150 + (day % 5) * 20,  // ₹150–₹230 varied
        offeredFare: 0,
        finalFare: 0,
        isScheduled: true,
        scheduledAt: bookingDate,
        distanceKm: 8.5,
        durationMins: 20,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        otp: String(1000 + day * 7).slice(-4),
      });
    }

    const createdRides = await Ride.insertMany(ridesToCreate);
    console.log(`✅ Created ${createdRides.length} carpool rides (Ride model)`);

    const createdBookings = await Booking.insertMany(bookingsToCreate);
    console.log(`✅ Created ${createdBookings.length} on-demand bookings (Booking model)`);

    console.log('\n─────────────────────────────────────────────────────');
    console.log('🎉 Future rides created for next 15 days!');
    console.log('─────────────────────────────────────────────────────');
    console.log(`📍 From: ${NAGPUR_RAILWAY.name}`);
    console.log(`📍 To:   ${NAGPUR_AIRPORT.name}`);
    console.log(`📏 Distance: ~8.5 km | ⏱️ ~20 mins`);
    console.log(`🚗 Driver: ${driver.name} | ${driver.phone}`);
    console.log(`👤 Passenger: ${passenger.name} | ${passenger.phone}`);
    console.log('');
    console.log('Scheduled times:');
    createdRides.forEach((r, i) => {
      console.log(`  Day ${i+1}: ${new Date(r.scheduledTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} | ₹${r.pricePerSeat}/seat | ${r.availableSeats} seats`);
    });
    console.log('─────────────────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedFutureRides();
