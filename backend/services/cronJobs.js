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
                    <p>View the full details on your <a href="${process.env.FRONTEND_URL || ''}/dashboard">Admin Dashboard</a></p>
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

    // Scheduled Report Processor (Runs every hour to check active schedules)
    cron.schedule('0 * * * *', async () => {
        console.log('Processing scheduled reports...');
        try {
            const ScheduledReport = require('../models/ScheduledReport');
            const { getReports } = require('../controllers/reportController');
            
            const schedules = await ScheduledReport.find({ isActive: true }).populate('createdByUser');
            const now = new Date();
            
            for (const schedule of schedules) {
                // Determine if it should run now based on frequency and current hour/day
                let shouldRun = false;
                const currentHour = now.getHours();
                const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
                const currentDateOfMonth = now.getDate();

                if (schedule.frequency === 'daily') {
                    // Run daily at 6:00 AM
                    if (currentHour === 6) shouldRun = true;
                } else if (schedule.frequency === 'weekly') {
                    // Run weekly on Monday at 6:00 AM
                    if (currentHour === 6 && currentDayOfWeek === 1) shouldRun = true;
                } else if (schedule.frequency === 'monthly') {
                    // Run monthly on the 1st of the month at 6:00 AM
                    if (currentHour === 6 && currentDateOfMonth === 1) shouldRun = true;
                } else if (schedule.frequency === 'custom') {
                    // Custom runs every hour or at 6:00 AM as a fallback
                    if (currentHour === 6) shouldRun = true;
                }

                if (shouldRun) {
                    console.log(`Running scheduled report: ${schedule.name} (${schedule.reportType})`);
                    
                    // Mock req/res objects
                    const mockReq = {
                        query: {
                            reportType: schedule.reportType,
                            ...schedule.filters
                        },
                        user: schedule.createdByUser
                    };

                    let responseData = null;
                    const mockRes = {
                        status: () => mockRes,
                        json: (data) => { responseData = data; }
                    };

                    // Execute report logic to fetch the live database data
                    await getReports(mockReq, mockRes);

                    if (responseData) {
                        // Deliver report
                        const summary = responseData.summary;
                        const studentCount = responseData.pagination?.totalItems || 0;
                        
                        // Construct Report Content (HTML Summary)
                        let reportHtml = `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 8px;">
                                <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-top: 0;">Scheduled Report: ${schedule.name}</h2>
                                <p>This is an automated delivery of your scheduled report.</p>
                                
                                <h3 style="margin-top: 20px;">Report Specifications</h3>
                                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                                    <tr style="border-bottom: 1px solid #edf2f7;">
                                        <td style="padding: 8px; font-weight: bold; width: 150px; background-color: #f7fafc;">Report Type</td>
                                        <td style="padding: 8px;">${schedule.reportType}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #edf2f7;">
                                        <td style="padding: 8px; font-weight: bold; background-color: #f7fafc;">Frequency</td>
                                        <td style="padding: 8px; text-transform: capitalize;">${schedule.frequency}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #edf2f7;">
                                        <td style="padding: 8px; font-weight: bold; background-color: #f7fafc;">Format</td>
                                        <td style="padding: 8px; text-transform: uppercase;">${schedule.format}</td>
                                    </tr>
                                </table>

                                <h3 style="margin-top: 24px;">Summary Metrics</h3>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px;">
                                    <div style="padding: 12px; background-color: #ebf8ff; border-radius: 6px; border-left: 4px solid #3182ce;">
                                        <div style="font-size: 11px; text-transform: uppercase; color: #4a5568; font-weight: bold;">Total Students</div>
                                        <div style="font-size: 20px; font-weight: black; color: #2b6cb0; margin-top: 4px;">${studentCount}</div>
                                    </div>
                                    <div style="padding: 12px; background-color: #f0fff4; border-radius: 6px; border-left: 4px solid #38a169;">
                                        <div style="font-size: 11px; text-transform: uppercase; color: #4a5568; font-weight: bold;">Average CGPA</div>
                                        <div style="font-size: 20px; font-weight: black; color: #276749; margin-top: 4px;">${summary?.avgGPA || 0}</div>
                                    </div>
                                    <div style="padding: 12px; background-color: #fffaf0; border-radius: 6px; border-left: 4px solid #dd6b20;">
                                        <div style="font-size: 11px; text-transform: uppercase; color: #4a5568; font-weight: bold;">Average Attendance</div>
                                        <div style="font-size: 20px; font-weight: black; color: #7b341e; margin-top: 4px;">${summary?.avgAttendance || 0}%</div>
                                    </div>
                                    <div style="padding: 12px; background-color: #fff5f5; border-radius: 6px; border-left: 4px solid #e53e3e;">
                                        <div style="font-size: 11px; text-transform: uppercase; color: #4a5568; font-weight: bold;">Fees Pending</div>
                                        <div style="font-size: 20px; font-weight: black; color: #9b2c2c; margin-top: 4px;">${summary?.feesPendingCount || 0}</div>
                                    </div>
                                </div>
                            `;

                            if (summary?.topPerformers && summary.topPerformers.length > 0) {
                                reportHtml += `
                                    <h3 style="margin-top: 24px;">Top Performers</h3>
                                    <ul style="margin: 10px 0; padding-left: 20px;">
                                        ${summary.topPerformers.map(p => `<li><strong>${p.name}</strong> (${p.roll}) - CGPA: ${p.gpa}</li>`).join('')}
                                    </ul>
                                `;
                            }

                            reportHtml += `
                                    <br/>
                                    <p style="font-size: 12px; color: #718096; border-top: 1px solid #edf2f7; padding-top: 12px;">This is an automated system notification from Sunstone Management ERP. To modify this schedule, please update settings in the report scheduler dashboard.</p>
                                </div>
                            `;

                        // 1. Deliver via Email
                        if (schedule.deliveryMethod === 'email' || schedule.deliveryMethod === 'link') {
                            for (const recipient of schedule.recipients) {
                                await sendEmail({
                                    to: recipient,
                                    subject: `[Scheduled Report] ${schedule.name}`,
                                    html: reportHtml
                                });
                            }
                        }

                        // 2. Deliver via Dashboard Notification
                        if (schedule.deliveryMethod === 'notification') {
                            const Notification = require('../models/Notification');
                            await Notification.create({
                                title: `Report Generated: ${schedule.name}`,
                                message: `Your scheduled report for ${schedule.reportType} has been successfully generated. Avg GPA: ${summary?.avgGPA || 0}, Avg Attendance: ${summary?.avgAttendance || 0}%.`,
                                category: 'Reports',
                                priority: 'info',
                                user: schedule.createdByUser._id
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Scheduled reports cron error:', error);
        }
    });
};

module.exports = initCronJobs;
