const mongoose = require('mongoose');

const scheduledReportSchema = mongoose.Schema({
    name: { type: String, required: true },
    reportType: { type: String, required: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'], default: 'weekly' },
    recipients: [{ type: String }],
    format: { type: String, enum: ['csv', 'excel', 'pdf'], default: 'csv' },
    deliveryMethod: { type: String, enum: ['email', 'notification', 'link'], default: 'email' },
    isActive: { type: Boolean, default: true },
    createdByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const ScheduledReport = mongoose.model('ScheduledReport', scheduledReportSchema);
module.exports = ScheduledReport;
