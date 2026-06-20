const PlacementRule = require('../models/PlacementRule');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { isAttended } = require('../utils/attendanceHelper');

const DEFAULT_RULE = {
    minCGPA: 6.0,
    minAttendance: 75,
    internshipRequired: false,
    maxBacklogs: 0
};

// Calculate placement readiness score
const calculateReadinessScore = (gpa, attendancePercentage, internshipCompleted, backlogCount) => {
    // CGPA weightage (40%): normalized to 100 max
    const cgpaScore = (gpa || 0) * 10 * 0.40;
    
    // Attendance weightage (30%)
    const attScore = (attendancePercentage || 0) * 0.30;
    
    // Internship weightage (20%)
    const internScore = (internshipCompleted ? 100 : 0) * 0.20;
    
    // Backlogs weightage (10%)
    const backlogScore = (backlogCount === 0 ? 100 : Math.max(0, 100 - (backlogCount * 25))) * 0.10;
    
    return Math.round(cgpaScore + attScore + internScore + backlogScore);
};

// Classify placement eligibility status
const classifyEligibility = (student, rule, attendancePercentage) => {
    const cgpa = student.gpa || 0;
    const backlogs = student.backlogCount || 0;
    const intern = student.internshipCompleted || false;
    
    const meetsCGPA = cgpa >= rule.minCGPA;
    const meetsAttendance = attendancePercentage >= rule.minAttendance;
    const meetsIntern = !rule.internshipRequired || intern;
    const meetsBacklogs = backlogs <= rule.maxBacklogs;
    
    if (meetsCGPA && meetsAttendance && meetsIntern && meetsBacklogs) {
        return 'Eligible';
    }
    
    // Check if close (Needs Improvement threshold: GPA within 1.0, Attendance within 10%, backlogs <= max + 1)
    const closeCGPA = cgpa >= (rule.minCGPA - 1.0);
    const closeAttendance = attendancePercentage >= (rule.minAttendance - 10);
    const closeBacklogs = backlogs <= (rule.maxBacklogs + 1);
    
    if (closeCGPA && closeAttendance && closeBacklogs) {
        return 'Needs Improvement';
    }
    
    return 'Not Eligible';
};

const getRules = async (req, res) => {
    try {
        let rule = await PlacementRule.findOne({});
        if (!rule) {
            rule = await PlacementRule.create(DEFAULT_RULE);
        }
        res.json(rule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const saveRules = async (req, res) => {
    const { minCGPA, minAttendance, internshipRequired, maxBacklogs } = req.body;
    try {
        let rule = await PlacementRule.findOne({});
        const { logAction } = require('../utils/auditLogger');
        
        if (rule) {
            const previousState = rule.toObject();
            rule.minCGPA = minCGPA !== undefined ? minCGPA : rule.minCGPA;
            rule.minAttendance = minAttendance !== undefined ? minAttendance : rule.minAttendance;
            rule.internshipRequired = internshipRequired !== undefined ? internshipRequired : rule.internshipRequired;
            rule.maxBacklogs = maxBacklogs !== undefined ? maxBacklogs : rule.maxBacklogs;
            await rule.save();
            
            await logAction(req, 'PLACEMENT_RULES_MODIFIED', 'PLACEMENT', previousState, rule.toObject());
        } else {
            rule = await PlacementRule.create({ minCGPA, minAttendance, internshipRequired, maxBacklogs });
            await logAction(req, 'PLACEMENT_RULES_MODIFIED', 'PLACEMENT', null, rule.toObject());
        }
        res.json(rule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEligibleStudents = async (req, res) => {
    try {
        let rule = await PlacementRule.findOne({});
        if (!rule) {
            rule = await PlacementRule.create(DEFAULT_RULE);
        }

        const User = require('../models/User');
        let query = {};
        if (req.user.role === 'student') {
            query = { user: req.user._id };
        } else if (req.user.role === 'faculty') {
            const currentUser = await User.findById(req.user._id);
            if (currentUser) {
                const assignedBatches = currentUser.assignedBatches || [];
                const assignedCourses = currentUser.assignedCourses || [];
                const assignedSections = currentUser.assignedSections || [];
                
                if (assignedBatches.length > 0 || assignedCourses.length > 0 || assignedSections.length > 0) {
                    query = {
                        batch: { $in: assignedBatches },
                        course: { $in: assignedCourses },
                        section: { $in: assignedSections }
                    };
                }
            }
        }

        const students = await Student.find(query)
            .populate('user', 'name email')
            .populate('category', 'name');

        const attendances = await Attendance.find({});
        const attendanceMap = {};
        
        attendances.forEach(att => {
            att.records.forEach(rec => {
                const sId = rec.student.toString();
                if (!attendanceMap[sId]) {
                    attendanceMap[sId] = { total: 0, present: 0 };
                }
                attendanceMap[sId].total++;
                if (isAttended(rec.status)) {
                    attendanceMap[sId].present++;
                }
            });
        });

        const enriched = students.map(s => {
            const att = attendanceMap[s._id.toString()] || { total: 0, present: 0 };
            const attendancePercentage = att.total === 0 ? 100 : Math.round((att.present / att.total) * 100);
            
            const readinessScore = calculateReadinessScore(
                s.gpa,
                attendancePercentage,
                s.internshipCompleted,
                s.backlogCount
            );
            
            const eligibility = classifyEligibility(s, rule, attendancePercentage);

            // Determine Score Category text
            let scoreCategory = 'High Risk';
            if (readinessScore >= 95) scoreCategory = 'Excellent';
            else if (readinessScore >= 80) scoreCategory = 'Ready';
            else if (readinessScore >= 65) scoreCategory = 'Needs Improvement';

            // Risk Assessment status
            let riskStatus = 'Safe';
            if (attendancePercentage < 75 || s.gpa < 5.0 || s.backlogCount > 1 || !s.internshipCompleted) {
                riskStatus = 'High Risk';
            } else if (attendancePercentage < 80 || s.gpa < 6.5 || s.backlogCount > 0) {
                riskStatus = 'Needs Attention';
            }

            return {
                _id: s._id,
                name: s.user?.name || 'Unknown Student',
                email: s.user?.email || 'N/A',
                rollNumber: s.rollNumber,
                department: s.category?.name || 'Unassigned',
                course: s.course || 'BCA',
                year: s.year || 1,
                semester: s.semester || 1,
                section: s.section || 'A',
                gpa: s.gpa || 0,
                attendancePercentage,
                internshipCompleted: s.internshipCompleted || false,
                backlogCount: s.backlogCount || 0,
                readinessScore,
                scoreCategory,
                eligibility,
                riskStatus
            };
        });

        res.json({
            rule,
            students: enriched
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRules,
    saveRules,
    getEligibleStudents,
    calculateReadinessScore,
    classifyEligibility
};
