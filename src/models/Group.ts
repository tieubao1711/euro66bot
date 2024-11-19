import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true },
    allowedUsers: { type: [String], default: [] }, // Danh sách username được phép
});

export const Group = mongoose.model('Group', groupSchema);
