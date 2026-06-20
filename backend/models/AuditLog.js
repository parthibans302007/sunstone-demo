const mongoose = require('mongoose');

const auditLogSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    actionType: { type: String, required: true }, // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'MARK_ATTENDANCE', 'RUN_REPORT'
    module: { type: String, required: true }, // 'STUDENTS', 'ATTENDANCE', 'PLACEMENT', 'REPORTS', 'AUTH'
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: '' }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
