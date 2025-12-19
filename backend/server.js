// // backend\server.js
// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';

// import Entry from './models/Entry.js';
// import User from './models/User.js';

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const MONGO_URL = process.env.MONGO_URL;
// const PORT = process.env.PORT || 3001;

// async function main() {
//     await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
//     console.log('MongoDB connected');

//     app.get('/entries', async (req, res) => {
//         try {
//             const telegramId = Number(req.query.telegramId);
//             if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });

//             const user = await User.findOne({ telegramId }).lean();
//             if (!user) return res.json({ entries: [] });

//             const entries = await Entry.find({ userId: user._id })
//                 .sort({ timestamp: -1 })
//                 .limit(200)
//                 .lean();

//             res.json({ entries });
//         } catch (err) {
//             console.error(err);
//             res.status(500).json({ error: 'internal' });
//         }
//     });

//     app.listen(PORT, () =>
//         console.log(`API running: http://localhost:${PORT}`)
//     );
// }

// main().catch(err => {
//     console.error('Startup error', err);
//     process.exit(1);
// });

// backend\server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import Entry from './models/Entry.js';
import User from './models/User.js';

dotenv.config();

const app = express();

// НАСТРОЙКИ CORS (ЗАМЕНИТЕ URL НА СВОЙ!)
const corsOptions = {
    origin: [
        'https://model-tracker-mini-app.vercel.app', // Ваш мини-апп на Vercel
        'https://your-mini-app.vercel.app'           // Другие домены при необходимости
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // Кеширование preflight запросов на 24 часа
};

app.use(cors(corsOptions));
app.use(express.json());

// Базовый эндпоинт для проверки здоровья
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        mongoConnected: mongoose.connection.readyState === 1
    });
});

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3001;

// Таймаут подключения к MongoDB
const mongoOptions = {
    serverSelectionTimeoutMS: 10000, // 10 секунд
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000
};

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URL, mongoOptions);
        console.log('✅ MongoDB connected successfully');
        
        // Обработчики событий подключения
        mongoose.connection.on('error', err => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
        });

        // Основной маршрут для получения записей
        app.get('/entries', async (req, res) => {
            try {
                console.log(`📥 GET /entries query:`, req.query);
                
                const telegramId = Number(req.query.telegramId);
                if (!telegramId || isNaN(telegramId)) {
                    return res.status(400).json({ 
                        error: 'Valid telegramId is required',
                        received: req.query.telegramId 
                    });
                }

                // Ищем пользователя
                const user = await User.findOne({ telegramId }).lean();
                if (!user) {
                    console.log(`👤 User ${telegramId} not found, returning empty array`);
                    return res.json({ entries: [] });
                }

                // Получаем записи пользователя
                const entries = await Entry.find({ userId: user._id })
                    .sort({ timestamp: -1 })
                    .limit(200)
                    .lean();

                console.log(`📊 Found ${entries.length} entries for user ${telegramId}`);
                res.json({ 
                    entries,
                    userFound: true,
                    count: entries.length 
                });
                
            } catch (err) {
                console.error('❌ Error in /entries:', err);
                res.status(500).json({ 
                    error: 'Internal server error',
                    message: err.message 
                });
            }
        });

        // Добавьте этот маршрут для обработки OPTIONS запросов (preflight)
        app.options('*', cors(corsOptions));

        // Запуск сервера
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 API running on port ${PORT}`);
            console.log(`🔗 Local: http://localhost:${PORT}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });

    } catch (err) {
        console.error('❌ Startup error:', err);
        process.exit(1);
    }
}

// Обработка graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, closing connections...');
    mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, closing connections...');
    mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    });
});

main();
