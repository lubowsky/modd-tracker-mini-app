// backend\server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import Entry from './models/Entry.js';
import User from './models/User.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3001;

async function main() {
    await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');

    app.get('/entries', async (req, res) => {
        try {
            const telegramId = Number(req.query.telegramId);
            if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });

            const user = await User.findOne({ telegramId }).lean();
            if (!user) return res.json({ entries: [] });

            const entries = await Entry.find({ userId: user._id })
                .sort({ timestamp: -1 })
                .limit(200)
                .lean();

            res.json({ entries });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'internal' });
        }
    });

    app.listen(PORT, () =>
        console.log(`API running: http://localhost:${PORT}`)
    );
}

main().catch(err => {
    console.error('Startup error', err);
    process.exit(1);
});
