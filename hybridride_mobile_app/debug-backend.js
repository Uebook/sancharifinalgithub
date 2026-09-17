import mongoose from "mongoose";
import User from "../hybridRide/Models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend
dotenv.config({ path: path.join(__dirname, "../hybridRide/.env") });

const findUser = async () => {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        const phone = "9956331236";
        const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
        console.log("Searching for phone ending in:", normalizedPhone);
        
        const user = await User.findOne({ phone: new RegExp(normalizedPhone + '$') });
        
        if (user) {
            console.log("FOUND USER:", JSON.stringify(user, null, 2));
        } else {
            console.log("User not found!");
            const count = await User.countDocuments();
            console.log("Total users in DB:", count);
            const samples = await User.find({}, { phone: 1 }).limit(5);
            console.log("Sample phones:", samples);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

findUser();
