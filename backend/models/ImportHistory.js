const mongoose = require('mongoose');

const importHistorySchema = mongoose.Schema({
    fileName: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalRows: { type: Number, default: 0 },
    imported: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    importBatchId: { type: String, required: true, unique: true },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Completed', 'Failed', 'Rolled Back'], default: 'Completed' },
    errors: { type: Array, default: [] },
    previousStates: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        studentData: { type: Object },
        userData: { type: Object }
    }]
}, { timestamps: true });

const ImportHistory = mongoose.model('ImportHistory', importHistorySchema);
module.exports = ImportHistory;
