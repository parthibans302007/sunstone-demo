const mongoose = require('mongoose');

const reportTemplateSchema = mongoose.Schema({
    name: { type: String, required: true },
    createdByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: { type: String, required: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    selectedFields: [{ type: String }],
    sortBy: { type: String, default: 'name' },
    sortOrder: { type: String, default: 'asc' },
    groupBy: { type: String, default: '' }
}, { timestamps: true });

const ReportTemplate = mongoose.model('ReportTemplate', reportTemplateSchema);
module.exports = ReportTemplate;
