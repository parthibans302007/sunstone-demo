const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const { isAttended } = require('../utils/attendanceHelper');

const initCronJobs = () => {
    // Run every day at 6:00 PM (18:00)
    cron.schedule('0 18 * * *', async () => {
        console.log('Running daily admin attendance summary job...');
        try {
            // Find Admin users to email
            const admins = await User.find({ role: 'admin' });
            if (admins.length === 0) return;
            const adminEmails = admins.map(a => a.email);

            // Get today's start and end logic
            const start = new Date();
            start.setHours(0,0,0,0);
            
            // Gather today's attendance sheets
            const todayAttendances = await Attendance.find({ 
                createdAt: { $gte: start } 
            });

            let totalMarked = 0;
            let totalAbsences = 0;

            todayAttendances.forEach(a => {
                a.records.forEach(r => {
                    totalMarked++;
                    if (r.status === 'Absent') totalAbsences++;
                });
            });

            // Calculate 'At Risk' students globally
            const students = await Student.find({}).populate('user');
            const allAttendances = await Attendance.find({});
            
            const atRiskStudents = [];
            students.forEach(s => {
                let total = 0;
                let present = 0;
                
                allAttendances.forEach(a => {
                    const rec = a.records.find(r => r.student.toString() === s._id.toString());
                    if (rec) {
                        total++;
                        if (isAttended(rec.status)) present++;
                    }
                });

                if (total > 0) {
                    const pct = Math.round((present / total) * 100);
                    if (pct < 75) {
                        atRiskStudents.push({ name: s.user?.name || 'Unknown', roll: s.rollNumber, pct });
                    }
                }
            });

            const htmlBody = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Daily Attendance Summary</h2>
                    <p>Here is your campus attendance summary for <strong>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Total Records Logged Today</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${totalMarked}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Total Absences Logged Today</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${totalAbsences}</td>
                        </tr>
                    </table>

                    <br/>
                    <h3 style="color: #d9534f;">Campus At-Risk Watchlist (Below 75%)</h3>
                    <ul>
                        ${atRiskStudents.length > 0 
                            ? atRiskStudents.map(s => `<li>${s.name} (${s.roll}) - <strong>${s.pct}%</strong></li>`).join('')
                            : '<li>Awesome! No students are currently at risk.</li>'
                        }
                    </ul>

                    <br/>
                    <p>View the full details on your <a href="${process.env.VITE_API_URL || 'http://localhost:5173'}/dashboard">Admin Dashboard</a>.</p>
                </div>
            `;

            for (const email of adminEmails) {
                await sendEmail({
                    to: email,
                    subject: `Daily Attendance Summary - Sunstone Management System`,
                    html: htmlBody
                });
            }

        } catch (error) {
            console.error('Error generating daily attendance report email:', error);
        }
    });
};

module.exports = initCronJobs;
