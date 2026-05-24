const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rollNumber: { type: String, required: true, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    contactNumber: { type: String },
    parentContact: { type: String },
    address: { type: String },
    
    // Academic fields
    batch: { type: String },
    course: { type: String }, // e.g. "BBA", "MBA", "BCA"
    semester: { type: Number }, // 1 to 8
    year: { type: Number }, // 1 to 4
    section: { type: String }, // "A", "B", "C"
    academicYear: { type: String }, // "2025-2026"
    isActive: { type: Boolean, default: true },
    
    // Personal fields
    gender: { type: String }, // "Male", "Female", "Other"
    dob: { type: Date },
    community: { type: String }, // "General", "OBC", "SC", "ST"
    bloodGroup: { type: String },

    // Performance & Financial & Other status fields
    gpa: { type: Number },
    feesPaid: { type: Boolean, default: false },
    noDueStatus: { type: Boolean, default: false },
    internalMarks: { type: Number }, // out of 100
    semesterMarks: { type: Number }, // out of 100
    classTestMarks: { type: Number }, // out of 100
    backlogCount: { type: Number, default: 0 },
    internshipCompleted: { type: Boolean, default: false },
    overallPerformance: { type: String } // "Excellent", "Good", "Average", "Poor"
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
