const mongoose = require('mongoose');

const placementRuleSchema = mongoose.Schema({
    minCGPA: { type: Number, default: 6.0 },
    minAttendance: { type: Number, default: 75 },
    internshipRequired: { type: Boolean, default: false },
    maxBacklogs: { type: Number, default: 0 }
}, { timestamps: true });

const PlacementRule = mongoose.model('PlacementRule', placementRuleSchema);
module.exports = PlacementRule;
