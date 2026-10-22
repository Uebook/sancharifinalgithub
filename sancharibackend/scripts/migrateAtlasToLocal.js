import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const ATLAS_URI = 'mongodb+srv://shubham_dubey:SO3t7fTGROvXNng2@cluster0.vakdouu.mongodb.net/test?appName=Cluster0';
const LOCAL_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sanchari_prod';

async function migrate() {
    console.log('🔄 Connecting to MongoDB Atlas...');
    const sourceConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to MongoDB Atlas.');

    console.log('🔄 Connecting to Local MongoDB...');
    const targetConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to Local MongoDB.');

    const sourceDb = sourceConn.db;
    const targetDb = targetConn.db;

    const collections = await sourceDb.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections to copy...\n`);

    for (const col of collections) {
        const name = col.name;
        if (name.startsWith('system.')) continue;

        const docs = await sourceDb.collection(name).find({}).toArray();
        if (docs.length > 0) {
            console.log(`Copying ${docs.length} documents for [${name}]...`);
            await targetDb.collection(name).deleteMany({});
            await targetDb.collection(name).insertMany(docs);
        } else {
            console.log(`Skipping empty collection [${name}].`);
        }
    }

    console.log('\n🎉 ALL ATLAS DATA HAS BEEN SUCCESSFULLY COPIED TO LOCAL MONGO DB!');
    await sourceConn.close();
    await targetConn.close();
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
});
