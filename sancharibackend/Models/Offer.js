import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    badge: {
      type: String, // e.g., "CITY POOLING", "OUTSTATION", "ALL RIDES"
      required: true,
    },
    promoCode: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["flat", "percentage"],
      default: "flat",
    },
    flatDiscountAmount: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    redemptionCount: {
      type: Number,
      default: 0,
    },
    pillText: {
      type: String,
      default: "",
    },
    actionText: {
      type: String,
      default: "EXPLORE",
    },
    targetScreen: {
      type: String,
      default: "",
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
