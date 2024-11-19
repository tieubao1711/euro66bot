import { config as configDotenv } from 'dotenv';
configDotenv();

import { bot } from './bot';
import { connectDatabase } from './database';

import express from 'express';
import path from 'path';
import { Transaction } from './models/Transaction';

// Kết nối đến MongoDB
(async () => {
  await connectDatabase();
  bot.launch();
  console.log('Bot is running...');
})();

const app = express();
const PORT = process.env.PORT || 16982;

// Sử dụng middleware JSON
app.use(express.json());

// Phục vụ file tĩnh trong thư mục `public`
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint API để lấy dữ liệu giao dịch
app.get('/api/transactions', async (req: any, res: any) => {
  try {
    // Lấy groupId từ query parameter
    const groupId = req.query.id as string;

    if (!groupId) {
      return res.status(400).json({ error: 'Không tồn tại groupId!' });
    }

    // Lấy giao dịch trong 3 ngày gần nhất
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Tìm các giao dịch theo groupId và createdAt
    const transactions = await Transaction.find({
      groupId,
      createdAt: { $gte: threeDaysAgo },
    }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu giao dịch.' });
  }
});


// Route mặc định chuyển hướng đến file HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Chạy server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
