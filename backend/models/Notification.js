const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'success', 'danger'], default: 'info' },
    category: { type: String, enum: ['Attendance', 'Placement', 'Performance', 'System', 'Reports', 'Internship'], default: 'System' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
