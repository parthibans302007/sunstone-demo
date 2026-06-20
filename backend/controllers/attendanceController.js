const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { sendEmail } = require('../utils/emailService');
const { isAttended } = require('../utils/attendanceHelper');

const dispatchAlerts = async (records, subject, date) => {
    try {
        const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
        
        for (const rec of records) {
            if (rec.status === 'Absent') {
                // Fetch student and user details
                const student = await Student.findById(rec.student).populate('user');
                if (!student || !student.user) continue;

                const email = student.user.email;
                const name = student.user.name;

                // 1. Send Absent Alert
                await sendEmail({
                    to: email,
                    subject: `Absence Notice: ${subject}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #d9534f;">Absence Automatically Recorded</h2>
                            <p>Hi ${name},</p>
                            <p>You have been marked <strong>Absent</strong> for <strong>${subject}</strong> on <strong>${formattedDate}</strong>.</p>
                            <p>If you believe this is a mistake, please reach out to the faculty or submit a correction request through the portal.</p>
                            <br/>
                            <p>Best regards,<br/>Sunstone Management System</p>
                        </div>
                    `
                });

                // 2. Check overall attendance for warning 
                const allAttendances = await Attendance.find({ "records.student": student._id });
                let totalClasses = 0;
                let attendedClasses = 0;

                allAttendances.forEach(a => {
                    const studentRecord = a.records.find(r => r.student.toString() === student._id.toString());
                    if (studentRecord) {
                        totalClasses++;
                        if (isAttended(studentRecord.status)) attendedClasses++;
                    }
                });

                const pct = totalClasses === 0 ? 0 : Math.round((attendedClasses / totalClasses) * 100);
                
                if (pct < 75) {
                    await sendEmail({
                        to: email,
                        subject: `⚠️ WARNING: Attendance Drops Below 75%`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2px solid #f0ad4e; border-radius: 8px;">
                                <h2 style="color: #f0ad4e;">Attendance Warning</h2>
                                <p>Hi ${name},</p>
                                <p>Your overall attendance has dropped to <strong>${pct}%</strong>, which is below the required 75% threshold.</p>
                                <p>Please ensure you attend the upcoming classes to avoid academic penalties.</p>
                                <br/>
                                <p>Best regards,<br/>Sunstone Management System Academic Committee</p>
                            </div>
                        `
                    });
                }
            }
        }
    } catch (e) {
        console.error("Failed to process background email alerts", e);
    }
};

const markAttendance = async (req, res) => {
    const { date, category, subject, records } = req.body;
    try {
        let attendance = await Attendance.findOne({ date, category, subject });
        const { logAction } = require('../utils/auditLogger');
        
        if (attendance) {
            // Update existing
            const previousState = attendance.toObject();
            attendance.records = records;
            attendance.faculty = req.user._id;
            await attendance.save();
            
            await logAction(req, 'ATTENDANCE_MODIFIED', 'ATTENDANCE', previousState, attendance.toObject());
            
            const io = req.app.get('io');
            if (io) io.emit('attendanceUpdate', { action: 'updated', date, category, subject });
            res.json(attendance);
        } else {
            attendance = await Attendance.create({
                date, category, subject, records, faculty: req.user._id
            });
            
            await logAction(req, 'ATTENDANCE_MARKED', 'ATTENDANCE', null, attendance.toObject());
            
            const io = req.app.get('io');
            if (io) io.emit('attendanceUpdate', { action: 'created', date, category, subject });
            res.status(201).json(attendance);
        }

        // Trigger email alerts in the background (non-blocking)
        dispatchAlerts(records, subject, date);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAttendance = async (req, res) => {
    const { date, category, subject, studentId } = req.query;
    const User = require('../models/User');
    let query = {};
    if (date) query.date = date;
    if (category) query.category = category;
    if (subject) query.subject = subject;

    try {
        // Enforce student role boundaries
        if (req.user.role === 'student') {
            const student = await Student.findOne({ user: req.user._id });
            if (!student) {
                return res.json([]);
            }
            query["records.student"] = student._id;
            
            const attendances = await Attendance.find(query)
                .populate('category', 'name')
                .populate('faculty', 'name');
            
            // Map each attendance to only include this student's status
            const filteredAttendances = attendances.map(att => {
                const myRecord = att.records.find(r => r.student.toString() === student._id.toString());
                return {
                    _id: att._id,
                    date: att.date,
                    subject: att.subject,
                    category: att.category,
                    faculty: att.faculty,
                    status: myRecord ? myRecord.status : null,
                    remarks: myRecord ? myRecord.remarks : ''
                };
            });
            return res.json(filteredAttendances);
        }

        // For Faculty & Admin
        // If query is specifically for a single student profile view
        if (studentId) {
            query["records.student"] = studentId;
            const attendances = await Attendance.find(query)
                .populate('category', 'name')
                .populate('faculty', 'name');
            
            const filteredAttendances = attendances.map(att => {
                const myRecord = att.records.find(r => r.student.toString() === studentId.toString());
                return {
                    _id: att._id,
                    date: att.date,
                    subject: att.subject,
                    category: att.category,
                    faculty: att.faculty,
                    status: myRecord ? myRecord.status : null,
                    remarks: myRecord ? myRecord.remarks : ''
                };
            });
            return res.json(filteredAttendances);
        }

        // Faculty role specific filters: view only their department/assignments
        if (req.user.role === 'faculty') {
            const currentUser = await User.findById(req.user._id);
            if (currentUser) {
                const assignedBatches = currentUser.assignedBatches || [];
                const assignedCourses = currentUser.assignedCourses || [];
                const assignedSections = currentUser.assignedSections || [];
                
                if (assignedBatches.length > 0 || assignedCourses.length > 0 || assignedSections.length > 0) {
                    const studentQuery = {
                        batch: { $in: assignedBatches },
                        course: { $in: assignedCourses },
                        section: { $in: assignedSections }
                    };
                    const studentIds = await Student.find(studentQuery).select('_id');
                    query["records.student"] = { $in: studentIds.map(s => s._id) };
                }
            }
        }

        const attendances = await Attendance.find(query)
            .populate('category', 'name')
            .populate('faculty', 'name')
            .populate({
                path: 'records.student',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            });
        res.json(attendances);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { markAttendance, getAttendance };
