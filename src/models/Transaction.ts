import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'in' | 'out';
  amount: number;
  username: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    type: { type: String, enum: ['in', 'out'], required: true },
    amount: { type: Number, required: true },
    username: { type: String, required: true },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
