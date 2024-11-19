import { Telegraf } from 'telegraf';
import { Transaction } from './models/Transaction';
import { allowedUsers } from './config/allowedUsers';

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// ID của group được phép hoạt động
const ALLOWED_GROUP_ID = -4552514797;

bot.start((ctx) => ctx.reply('Chào mừng bạn đến với EURO66 BOT!'));

// Lệnh /in - Ghi nhận giao dịch nạp tiền
bot.command('in', async (ctx) => {
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
        return ctx.reply('Lệnh này chỉ hoạt động trong group.');
    }

    if (ctx.chat.id !== ALLOWED_GROUP_ID) {
        return ctx.reply('Bạn không có quyền thao tác bot trong group này.');
    }

    const username = ctx.message.from.username;
    if (!allowedUsers.includes(username || '')) {
        return ctx.reply('Bạn không có quyền thao tác bot này.');
    }

    const amount = parseInt(ctx.message.text.split(' ')[1], 10);
    if (isNaN(amount)) {
        return ctx.reply('Hãy nhập số tiền hợp lệ. Ví dụ: /in 1000000');
    }

    await Transaction.create({ type: 'in', amount, username });
    //ctx.reply(`Ghi nhận giao dịch nạp tiền: ${amount.toLocaleString('vi-VN')} VND`);

    const report = await getReport();
    ctx.reply(report);
});

// Lệnh /out - Ghi nhận giao dịch rút tiền
bot.command('out', async (ctx) => {
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
        return ctx.reply('Lệnh này chỉ hoạt động trong group.');
    }

    if (ctx.chat.id !== ALLOWED_GROUP_ID) {
        return ctx.reply('Bạn không có quyền thao tác bot trong group này.');
    }

    const username = ctx.message.from.username;
    if (!allowedUsers.includes(username || '')) {
        return ctx.reply('Bạn không có quyền thao tác bot này.');
    }

    const amount = parseInt(ctx.message.text.split(' ')[1], 10);
    if (isNaN(amount)) {
        return ctx.reply('Hãy nhập số tiền hợp lệ. Ví dụ: /out 1000000');
    }

    await Transaction.create({ type: 'out', amount, username });
    //ctx.reply(`Ghi nhận giao dịch rút tiền: ${amount.toLocaleString('vi-VN')} VND`);

    const report = await getReport();
    ctx.reply(report);
});

// Lệnh /report - Báo cáo giao dịch
bot.command('report', async (ctx) => {
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
        return ctx.reply('Lệnh này chỉ hoạt động trong group.');
    }

    if (ctx.chat.id !== ALLOWED_GROUP_ID) {
        return ctx.reply('Bạn không có quyền thao tác bot trong group này.');
    }

    const report = await getReport();
    ctx.reply(report);
});


const getReport = async function() {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(6);
    const inTransactions = transactions.filter((t) => t.type === 'in').slice(0, 3);
    const outTransactions = transactions.filter((t) => t.type === 'out').slice(0, 3);

    const totalIn = inTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOut = outTransactions.reduce((sum, t) => sum + t.amount, 0);

    const inRate = 0.04; // Deposit fee: 4%
    const inTotal = totalIn * (1 - inRate);

    const report = `
Deposit transactions (${inTransactions.length} times):
${inTransactions.map((t) => `  ${t.createdAt.toLocaleTimeString()}    ${t.amount.toLocaleString('vi-VN')} VND`).join('\n')}

Withdrawal transactions (${outTransactions.length} times):
${outTransactions.map((t) => `  ${t.createdAt.toLocaleTimeString()}    ${t.amount.toLocaleString('vi-VN')} VND`).join('\n')}

Deposit fee: ${(inRate * 100).toFixed(0)}%
Total deposit amount: ${totalIn.toLocaleString('vi-VN')} VND
Total after fee: ${inTotal.toLocaleString('vi-VN')} VND｜0

Total withdrawal amount: ${totalOut.toLocaleString('vi-VN')} VND｜0

Amount payable: ${(inTotal - totalOut).toLocaleString('vi-VN')} VND
Amount paid: 0 VND
Remaining amount: ${(inTotal - totalOut).toLocaleString('vi-VN')} VND
`;

    return report;
}
