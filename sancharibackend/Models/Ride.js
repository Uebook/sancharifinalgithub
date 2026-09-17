import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["local", "outstation", "intercity", "rental"],
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    cancellationReason: { type: String },

    origin: {
      name: { type: String, required: true },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },

    destination: {
      name: { type: String, required: true },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },

    route: {
      polyline: { type: String },
      distance: { type: Number },
      duration: { type: Number },
    },

    scheduledTime: {
      type: Date,
      required: true,
    },

    vehicle: { type: String },
    vehicleType: {
      type: String,
      enum: ["CAR", "BIKE", "TRAVELER", "AUTO"],
      default: "CAR",
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    pricePerSeat: {
      type: Number,
      required: true,
      min: 0,
    },

    seatPricing: {
      front: { type: Number },
      middle: { type: Number },
      back: { type: Number },
    },

    passengers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        seatsBooked: { type: Number, default: 1 },

        bookingStatus: {
          type: String,
          enum: ["pending", "confirmed", "cancelled", "completed"],
          default: "confirmed",
        },

        pickupStatus: {
          type: String,
          enum: ["pending", "picked_up", "dropped_off"],
          default: "pending",
        },

        otp: { type: String },
        cancellationReason: { type: String },
        paymentMethod: {
          type: String,
          enum: ["cash", "wallet", "razorpay"],
          default: "cash",
        },
        paymentStatus: {
          type: String,
          enum: ["pending", "completed", "paid"],
          default: "pending",
        },
      },
    ],

    poolCategory: {
      type: String,
      enum: ["CITY_POOL", "OUTSTATION_POOL", "OUTSTATION_RENTAL"],
      default: "CITY_POOL",
    },

    waypoints: [
      {
        name: { type: String },
        location: {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: { type: [Number] },
        },
        order: { type: Number },
        picksUpRiderCount: { type: Number, default: 1 },
      },
    ],

    acPremium: { type: Number, default: 0 },
    ladiesSeatReserved: { type: Number, default: 0 },
    luggageSpace: { type: Boolean, default: false },

    preferences: {
      music: { type: Boolean, default: false },
      ac: { type: Boolean, default: false },
      quiet: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      womenOnly: { type: Boolean, default: false },
    },
    rentalDetails: {
      pricePerKm: { type: Number },
      minKmPerDay: { type: Number },
      driverAllowance: { type: Number },
      tripType: { type: String, enum: ['ROUND', 'ONEWAY'] }
    },
  },
  { timestamps: true }
);

const Ride = mongoose.model("Ride", rideSchema);

// Add geo-spatial indexes for origin and destination
rideSchema.index({ "origin.location": "2dsphere" });
rideSchema.index({ "destination.location": "2dsphere" });

export default Ride;
