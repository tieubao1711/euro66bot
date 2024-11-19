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
        const { date, id: groupId } = req.query;

        // Kiểm tra groupId
        if (!groupId) {
            return res.status(400).json({ error: 'Vui lòng cung cấp groupId qua query parameter ?id={groupId}.' });
        }

        // Xử lý date: Nếu không có, lấy ngày hôm nay
        const parsedDate = date
            ? moment.tz(date as string, 'MM/DD/YYYY', 'Asia/Ho_Chi_Minh')
            : moment.tz('Asia/Ho_Chi_Minh').startOf('day').add(6, 'hours'); // 6:00 sáng hôm nay theo GMT+7

        if (!parsedDate.isValid()) {
            return res.status(400).json({ error: 'Ngày không hợp lệ. Định dạng đúng là MM/DD/YYYY.' });
        }

        // Tính mốc thời gian 6:00 sáng hôm nay và 6:00 sáng hôm sau
        const startOfDay = parsedDate.clone(); // 6:00 sáng ngày chỉ định
        const endOfDay = startOfDay.clone().add(1, 'day'); // 6:00 sáng ngày hôm sau

        // Truy vấn giao dịch từ MongoDB
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
