import { config as configDotenv } from 'dotenv';
configDotenv();

import { bot } from './bot';
import { connectDatabase } from './database';

import express from 'express';
import { Transaction } from './models/Transaction';

(async () => {
  await connectDatabase();
  bot.launch();
  console.log('Bot is running...');
})();

const app = express();
const PORT = process.env.PORT || 16982;

app.use(express.json());

// Endpoint API để lấy dữ liệu giao dịch
app.get('/api/transactions', async (req, res) => {
    try {
        // Lấy giao dịch trong 3 ngày gần nhất
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const transactions = await Transaction.find({ createdAt: { $gte: threeDaysAgo } }).sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu giao dịch.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
