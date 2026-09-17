import mongoose from "mongoose";

const plannedCommuteSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["BIKE", "CAR", "AUTO"],
      default: "BIKE",
    },
    homeLocation: {
      address: { type: String, required: true },
      coordinates: { type: [Number] },
    },
    officeLocation: {
      address: { type: String, required: true },
      coordinates: { type: [Number] },
    },
    homeToOfficeTime: {
      time: { type: String, default: "09:00 AM" },
      enabled: { type: Boolean, default: true },
    },
    officeToHomeTime: {
      time: { type: String, default: "06:00 PM" },
      enabled: { type: Boolean, default: true },
    },
    seatPreferences: {
      seatsCount: { type: Number, default: 1 },
      isAC: { type: Boolean, default: false },
      isLadiesOnly: { type: Boolean, default: false },
    },
    activeDays: [
      {
        type: String,
        enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
    ],
    waypoints: [
      {
        name: { type: String },
        coordinates: { type: [Number] },
      },
    ],
    routeDistance: { type: String },
    routeDuration: { type: String },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

const PlannedCommute = mongoose.model("PlannedCommute", plannedCommuteSchema);

export default PlannedCommute;
