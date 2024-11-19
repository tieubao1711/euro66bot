"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const telegraf_1 = require("telegraf");
const Transaction_1 = require("./models/Transaction");
const allowedUsers_1 = require("./config/allowedUsers");
exports.bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
exports.bot.start((ctx) => ctx.reply('Chào mừng bạn đến với bot quản lý tiền!'));
exports.bot.command('in', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const username = ctx.message.from.username;
    if (!allowedUsers_1.allowedUsers.includes(username || '')) {
        return ctx.reply('Bạn không có quyền thao tác bot này.');
    }
    const amount = parseInt(ctx.message.text.split(' ')[1], 10);
    if (isNaN(amount)) {
        return ctx.reply('Hãy nhập số tiền hợp lệ. Ví dụ: /in 1000000');
    }
    yield Transaction_1.Transaction.create({ type: 'in', amount, username });
    ctx.reply(`Ghi nhận giao dịch 入款: ${amount.toLocaleString('vi-VN')} VND`);
}));
exports.bot.command('out', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const username = ctx.message.from.username;
    if (!allowedUsers_1.allowedUsers.includes(username || '')) {
        return ctx.reply('Bạn không có quyền thao tác bot này.');
    }
    const amount = parseInt(ctx.message.text.split(' ')[1], 10);
    if (isNaN(amount)) {
        return ctx.reply('Hãy nhập số tiền hợp lệ. Ví dụ: /out 1000000');
    }
    yield Transaction_1.Transaction.create({ type: 'out', amount, username });
    ctx.reply(`Ghi nhận giao dịch 下发: ${amount.toLocaleString('vi-VN')} VND`);
}));
exports.bot.command('report', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const transactions = yield Transaction_1.Transaction.find().sort({ createdAt: -1 }).limit(6);
    const inTransactions = transactions.filter((t) => t.type === 'in').slice(0, 3);
    const outTransactions = transactions.filter((t) => t.type === 'out').slice(0, 3);
    const totalIn = inTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOut = outTransactions.reduce((sum, t) => sum + t.amount, 0);
    const inRate = 0.04; // 4% 入款费率
    const inTotal = totalIn * (1 - inRate);
    const report = `
入款（${inTransactions.length}笔）：
${inTransactions.map((t) => `  ${t.createdAt.toLocaleTimeString()}    ${t.amount.toLocaleString('vi-VN')}`).join('\n')}

下发（${outTransactions.length}笔）：
${outTransactions.map((t) => `  ${t.createdAt.toLocaleTimeString()}    ${t.amount.toLocaleString('vi-VN')}`).join('\n')}

入款费率：${(inRate * 100).toFixed(0)}%
入款总数：${totalIn.toLocaleString('vi-VN')} VND
入款总计：${inTotal.toLocaleString('vi-VN')} VND｜0

下发总数：${totalOut.toLocaleString('vi-VN')} VND｜0

应回款：${(inTotal - totalOut).toLocaleString('vi-VN')} VND
已回款：0 VND
未回款：${(inTotal - totalOut).toLocaleString('vi-VN')} VND
`;
    ctx.reply(report);
}));
