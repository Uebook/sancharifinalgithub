import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const checkDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas successfully.');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('\n--- COLLECTIONS SUMMARY ---');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`Collection: ${col.name} -> ${count} documents`);
        }
        console.log('---------------------------\n');
        process.exit(0);
    } catch (err) {
        console.error('Error inspecting DB:', err);
        process.exit(1);
    }
};

checkDb();
