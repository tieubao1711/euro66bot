import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true },
    allowedUsers: { type: [String], default: [] }, // Danh sách username được phép
    inRate: { type: Number, default: 0.04 }, // Phí nạp tiền mặc định: 4%
});

export const Group = mongoose.model('Group', groupSchema);
