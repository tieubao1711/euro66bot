import mongoose, { Schema, Document } from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['in', 'out'], required: true },
  amount: { type: Number, required: true },
  username: { type: String, required: true },
  groupId: { type: String, required: true }, // Nhóm Telegram
  createdAt: { type: Date, default: Date.now },
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
