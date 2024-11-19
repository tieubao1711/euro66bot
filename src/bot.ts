import { Context, Telegraf } from 'telegraf';
import { Transaction } from './models/Transaction';
import { allowedUsers } from './config/allowedUsers';
import { Group } from './models/Group';

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

bot.start((ctx) => ctx.reply('Chào mừng bạn đến với EURO66 BOT!'));

const isAllowed = async (ctx: Context): Promise<boolean> => {
    const groupId = ctx.chat?.id.toString();
    const username = ctx.message?.from.username;

    if (!groupId || !username) return false;

    const group = await Group.findOne({ groupId });
    if (!group) return false;

    return group.allowedUsers.includes(username);
};

bot.command('allow_group', async (ctx) => {
    if (!ctx.chat || ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
        return ctx.reply('Lệnh này chỉ sử dụng được trong nhóm.');
    }

    const groupId = ctx.chat.id.toString();

    try {
        let group = await Group.findOne({ groupId });
        if (!group) {
            group = await Group.create({ groupId });
        }

        return ctx.reply(`Nhóm ${groupId} đã được phép sử dụng bot.`);
    } catch (error) {
        console.error(error);
        return ctx.reply('Có lỗi xảy ra khi thêm nhóm.');
    }
});

bot.command('allow_user', async (ctx) => {
    const username = ctx.message.text.split(' ')[1];
    if (!username) {
        return ctx.reply('Hãy nhập username. Ví dụ: /allow_user username');
    }

    const groupId = ctx.chat?.id.toString();
    if (!groupId) {
        return ctx.reply('Lệnh này chỉ có thể sử dụng trong nhóm.');
    }

    try {
        const group = await Group.findOne({ groupId });
        if (!group) {
            return ctx.reply('Nhóm này chưa được phép sử dụng bot. Hãy sử dụng /allow_group trước.');
        }

        if (!group.allowedUsers.includes(username)) {
            group.allowedUsers.push(username);
            await group.save();
        }

        return ctx.reply(`Người dùng @${username} đã được phép sử dụng bot.`);
    } catch (error) {
        console.error(error);
        return ctx.reply('Có lỗi xảy ra khi thêm người dùng.');
    }
});

// Lệnh /in - Ghi nhận giao dịch nạp tiền
bot.command('in', async (ctx) => {
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
        return ctx.reply('Lệnh này chỉ hoạt động trong group.');
    }

    if (!(await isAllowed(ctx))) {
        return ctx.reply('Bạn không có quyền sử dụng lệnh này.');
    }

    const amount = parseInt(ctx.message.text.split(' ')[1], 10);
    if (isNaN(amount)) {
        return ctx.reply('Hãy nhập số tiền hợp lệ. Ví dụ: /in 1000000');
    }

    await Transaction.create({ type: 'in', amount, username: ctx.message?.from.username });
    //ctx.reply(`Ghi nhận giao dịch nạp tiền: ${amount.toLocaleString('vi-VN')} VND`);

    getReport(ctx);
});

// Lệnh /out - Ghi nhận giao dịch rút tiền
bot.command('out', async (ctx) => {
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
        return ctx.reply('Lệnh này chỉ hoạt động trong group.');
    }
    
    if (!(await isAllowed(ctx))) {
        return ctx.reply('Bạn không có quyền sử dụng lệnh này.');
    }

    const amount = parseInt(ctx.message.text.split(' ')[1], 10);
    if (isNaN(amount)) {
        return ctx.reply('Hãy nhập số tiền hợp lệ. Ví dụ: /out 1000000');
    }

    await Transaction.create({ type: 'out', amount, username: ctx.message?.from.username });
    //ctx.reply(`Ghi nhận giao dịch rút tiền: ${amount.toLocaleString('vi-VN')} VND`);

    getReport(ctx);
});

const getReport = async function(ctx: Context) {
    // Lấy mốc thời gian 6:00 sáng hôm nay theo GMT+7
    const now = new Date();
    const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), -1)); // 6 giờ sáng GMT+7 = 23:00 ngày hôm trước theo UTC
    const startOfTomorrowUTC = new Date(startOfTodayUTC);
    startOfTomorrowUTC.setUTCDate(startOfTodayUTC.getUTCDate() + 1); // 6 giờ sáng GMT+7 ngày mai

    // Lấy tất cả giao dịch từ 6:00 sáng hôm nay đến 6:00 sáng ngày mai
    const allTransactions = await Transaction.find({
        createdAt: {
            $gte: startOfTodayUTC,
            $lt: startOfTomorrowUTC,
        },
    });

    // Tính tổng số tiền nạp và rút
    const totalIn = allTransactions
        .filter((t) => t.type === 'in')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalOut = allTransactions
        .filter((t) => t.type === 'out')
        .reduce((sum, t) => sum + t.amount, 0);

    // Lấy 7 giao dịch gần nhất
    const recentTransactions = await Transaction.find().sort({ createdAt: -1 }).limit(7);
    const inTransactions = recentTransactions.filter((t) => t.type === 'in').slice(0, 3);
    const outTransactions = recentTransactions.filter((t) => t.type === 'out').slice(0, 3);

    const inRate = 0.04; // Deposit fee: 4%
    const inTotal = totalIn * (1 - inRate);

    const report = `
Giao dịch nạp tiền (${inTransactions.length} lần gần nhất):
${inTransactions.map((t) => `  ${t.createdAt.toLocaleTimeString('vi-VN')}    ${t.amount.toLocaleString('vi-VN')} VND`).join('\n')}

Giao dịch rút tiền (${outTransactions.length} lần gần nhất):
${outTransactions.map((t) => `  ${t.createdAt.toLocaleTimeString('vi-VN')}    ${t.amount.toLocaleString('vi-VN')} VND`).join('\n')}

Phí nạp tiền: ${(inRate * 100).toFixed(0)}%
Tổng số tiền nạp (toàn bộ): ${totalIn.toLocaleString('vi-VN')} VND
Tổng sau phí: ${inTotal.toLocaleString('vi-VN')} VND｜0

Tổng số tiền rút (toàn bộ): ${totalOut.toLocaleString('vi-VN')} VND｜0

Số tiền cần thanh toán: ${(inTotal - totalOut).toLocaleString('vi-VN')} VND
Số tiền đã thanh toán: 0 VND
Số tiền còn lại: ${(inTotal - totalOut).toLocaleString('vi-VN')} VND
`;

    // Gửi báo cáo cùng nút inline
    await ctx.reply(report, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Xem thống kê đầy đủ', // Văn bản nút
                        url: 'https://report.bundaumamtom.shop/' // URL của nút
                    }
                ]
            ]
        }
    });
};
