import { config as configDotenv } from 'dotenv';
configDotenv();

import { bot } from './bot';
import { connectDatabase } from './database';

import express, { Request, Response } from 'express';
import path from 'path';
import { Transaction } from './models/Transaction';

import moment from 'moment-timezone';

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

app.get('/api/transactions', async (req: any, res: any) => {
  try {
    // Lấy ngày từ query parameter
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ngày theo định dạng ?date=MM/DD/YYYY.' });
    }

    // Kiểm tra định dạng ngày
    const parsedDate = moment.tz(date as string, 'MM/DD/YYYY', 'Asia/Ho_Chi_Minh');
    if (!parsedDate.isValid()) {
      return res.status(400).json({ error: 'Ngày không hợp lệ. Định dạng đúng là MM/DD/YYYY.' });
    }

    // Tính mốc thời gian 6:00 sáng hôm nay và 6:00 sáng ngày mai theo GMT+7
    const startOfDay = parsedDate.clone().add(6, 'hours'); // 6:00 sáng ngày chỉ định
    const endOfDay = startOfDay.clone().add(1, 'day'); // 6:00 sáng hôm sau

    // Lấy giao dịch theo khoảng thời gian và groupId
    const groupId = req.query.id as string;

    if (!groupId) {
      return res.status(400).json({ error: 'Vui lòng cung cấp groupId qua query parameter ?id={groupId}.' });
    }

    const transactions = await Transaction.find({
      groupId,
      createdAt: {
        $gte: startOfDay.toDate(),
        $lt: endOfDay.toDate(),
      },
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
