require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Category = require('./models/Category');
const Attendance = require('./models/Attendance');
const connectDB = require('./config/db');

const seedData = async () => {
    await connectDB();
    try {
        console.log('Clearing database for fresh seed...');
        await User.deleteMany({});
        await Student.deleteMany({});
        await Category.deleteMany({});
        await Attendance.deleteMany({});

        // 1. Create Categories (Departments)
        const catCS = await Category.create({ name: 'Computer Applications', description: 'Department of BCA and MCA' });
        const catBusiness = await Category.create({ name: 'Business Administration', description: 'Department of BBA and MBA' });
        const catEng = await Category.create({ name: 'Engineering', description: 'Department of B.Tech Engineering' });

        console.log('Categories seeded.');

        // 2. Create Users (Admin, Faculty, Students)
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@sunstone.edu',
            password: 'password123',
            role: 'admin',
            isFirstLogin: false
        });

        // Faculty member assigned specifically to:
        // - Batches: '2023', '2024'
        // - Courses: 'BCA', 'MBA'
        // - Sections: 'A', 'B'
        const facultyUser = await User.create({
            name: 'Faculty Member',
            email: 'faculty@sunstone.edu',
            password: 'password123',
            role: 'faculty',
            isFirstLogin: false,
            assignedBatches: ['2023', '2024'],
            assignedCourses: ['BCA', 'MBA'],
            assignedSections: ['A', 'B'],
            assignedSubjects: ['Database Systems', 'Financial Management', 'Computer Networks']
        });

        console.log('Core Admin & Faculty users seeded.');

        // 3. Create Student profiles and their corresponding User documents
        const mockStudentDefs = [
            // Student user expected by verification instructions
            { name: 'Student User', email: 'student@sunstone.edu', rollNumber: 'CS-2023-000', category: catCS._id, batch: '2023', course: 'BCA', semester: 5, year: 3, section: 'A', gpa: 8.0, feesPaid: true, noDueStatus: true, internalMarks: 80, semesterMarks: 80, classTestMarks: 80, backlogCount: 0, internshipCompleted: false, overallPerformance: 'Good', gender: 'Male', community: 'General', bloodGroup: 'O+' },
            // BCA, Batch 2023, Section A (Faculty can access)
            { name: 'Aarav Mehta', email: 'aarav@sunstone.edu', rollNumber: 'CS-2023-001', category: catCS._id, batch: '2023', course: 'BCA', semester: 5, year: 3, section: 'A', gpa: 8.7, feesPaid: true, noDueStatus: true, internalMarks: 85, semesterMarks: 82, classTestMarks: 90, backlogCount: 0, internshipCompleted: true, overallPerformance: 'Excellent', gender: 'Male', community: 'General', bloodGroup: 'O+' },
            { name: 'Aditi Sharma', email: 'aditi@sunstone.edu', rollNumber: 'CS-2023-002', category: catCS._id, batch: '2023', course: 'BCA', semester: 5, year: 3, section: 'A', gpa: 9.1, feesPaid: true, noDueStatus: true, internalMarks: 92, semesterMarks: 94, classTestMarks: 88, backlogCount: 0, internshipCompleted: true, overallPerformance: 'Excellent', gender: 'Female', community: 'General', bloodGroup: 'A+' },
            { name: 'Arjun Nair', email: 'arjun@sunstone.edu', rollNumber: 'CS-2023-003', category: catCS._id, batch: '2023', course: 'BCA', semester: 5, year: 3, section: 'A', gpa: 6.8, feesPaid: false, noDueStatus: false, internalMarks: 70, semesterMarks: 65, classTestMarks: 72, backlogCount: 0, internshipCompleted: false, overallPerformance: 'Average', gender: 'Male', community: 'OBC', bloodGroup: 'B+' },
            { name: 'Divya Patel', email: 'divya@sunstone.edu', rollNumber: 'CS-2023-004', category: catCS._id, batch: '2023', course: 'BCA', semester: 5, year: 3, section: 'B', gpa: 4.8, feesPaid: true, noDueStatus: true, internalMarks: 45, semesterMarks: 50, classTestMarks: 48, backlogCount: 2, internshipCompleted: false, overallPerformance: 'Poor', gender: 'Female', community: 'SC', bloodGroup: 'O-' },
            
            // MBA, Batch 2024, Section B (Faculty can access)
            { name: 'Karan Malhotra', email: 'karan@sunstone.edu', rollNumber: 'BU-2024-001', category: catBusiness._id, batch: '2024', course: 'MBA', semester: 3, year: 2, section: 'B', gpa: 7.9, feesPaid: true, noDueStatus: true, internalMarks: 78, semesterMarks: 80, classTestMarks: 82, backlogCount: 0, internshipCompleted: true, overallPerformance: 'Good', gender: 'Male', community: 'General', bloodGroup: 'AB+' },
            { name: 'Meera Sen', email: 'meera@sunstone.edu', rollNumber: 'BU-2024-002', category: catBusiness._id, batch: '2024', course: 'MBA', semester: 3, year: 2, section: 'B', gpa: 8.2, feesPaid: true, noDueStatus: true, internalMarks: 80, semesterMarks: 83, classTestMarks: 81, backlogCount: 0, internshipCompleted: true, overallPerformance: 'Good', gender: 'Female', community: 'OBC', bloodGroup: 'A-' },
            { name: 'Rohan Gupta', email: 'rohan@sunstone.edu', rollNumber: 'BU-2024-003', category: catBusiness._id, batch: '2024', course: 'MBA', semester: 3, year: 2, section: 'A', gpa: 5.5, feesPaid: false, noDueStatus: false, internalMarks: 58, semesterMarks: 56, classTestMarks: 60, backlogCount: 1, internshipCompleted: false, overallPerformance: 'Average', gender: 'Male', community: 'ST', bloodGroup: 'B-' },
            
            // B.Tech, Batch 2025, Section C (OUTSIDE Faculty scope - Admin only)
            { name: 'Ishaan Verma', email: 'ishaan@sunstone.edu', rollNumber: 'EN-2025-001', category: catEng._id, batch: '2025', course: 'B.Tech', semester: 1, year: 1, section: 'C', gpa: 8.5, feesPaid: true, noDueStatus: true, internalMarks: 88, semesterMarks: 84, classTestMarks: 86, backlogCount: 0, internshipCompleted: false, overallPerformance: 'Good', gender: 'Male', community: 'General', bloodGroup: 'O+' },
            { name: 'Kriti Deshmukh', email: 'kriti@sunstone.edu', rollNumber: 'EN-2025-002', category: catEng._id, batch: '2025', course: 'B.Tech', semester: 1, year: 1, section: 'C', gpa: 9.4, feesPaid: true, noDueStatus: true, internalMarks: 96, semesterMarks: 95, classTestMarks: 92, backlogCount: 0, internshipCompleted: false, overallPerformance: 'Excellent', gender: 'Female', community: 'General', bloodGroup: 'B+' },
            { name: 'Siddharth Roy', email: 'siddharth@sunstone.edu', rollNumber: 'EN-2025-003', category: catEng._id, batch: '2025', course: 'B.Tech', semester: 1, year: 1, section: 'C', gpa: 6.2, feesPaid: false, noDueStatus: false, internalMarks: 60, semesterMarks: 62, classTestMarks: 65, backlogCount: 0, internshipCompleted: false, overallPerformance: 'Average', gender: 'Male', community: 'OBC', bloodGroup: 'A+' },
            { name: 'Neha Joshi', email: 'neha@sunstone.edu', rollNumber: 'EN-2025-004', category: catEng._id, batch: '2025', course: 'B.Tech', semester: 1, year: 1, section: 'C', gpa: 5.1, feesPaid: true, noDueStatus: true, internalMarks: 50, semesterMarks: 52, classTestMarks: 48, backlogCount: 3, internshipCompleted: false, overallPerformance: 'Poor', gender: 'Female', community: 'SC', bloodGroup: 'O+' }
        ];

        const studentUserIds = [];
        const studentIds = [];

        for (const sDef of mockStudentDefs) {
            // Create user
            const u = await User.create({
                name: sDef.name,
                email: sDef.email,
                password: 'password123',
                role: 'student',
                isFirstLogin: false
            });
            studentUserIds.push(u._id);

            // Create student record
            const st = await Student.create({
                user: u._id,
                rollNumber: sDef.rollNumber,
                category: sDef.category,
                contactNumber: '+91 98765 43210',
                parentContact: '+91 91234 56789',
                address: '123 Academic Block, Campus Residency',
                batch: sDef.batch,
                course: sDef.course,
                semester: sDef.semester,
                year: sDef.year,
                section: sDef.section,
                academicYear: '2025-2026',
                isActive: true,
                gender: sDef.gender,
                dob: new Date('2004-06-15'),
                community: sDef.community,
                bloodGroup: sDef.bloodGroup,
                gpa: sDef.gpa,
                feesPaid: sDef.feesPaid,
                noDueStatus: sDef.noDueStatus,
                internalMarks: sDef.internalMarks,
                semesterMarks: sDef.semesterMarks,
                classTestMarks: sDef.classTestMarks,
                backlogCount: sDef.backlogCount,
                internshipCompleted: sDef.internshipCompleted,
                overallPerformance: sDef.overallPerformance
            });
            studentIds.push(st._id);
        }

        console.log(`Seeded ${studentIds.length} students with full profiles.`);

        // 4. Create Mock Attendance sheets to populate calculated attendance percentages
        const dates = [
            '2026-05-18',
            '2026-05-19',
            '2026-05-20',
            '2026-05-21',
            '2026-05-22'
        ];

        // Let's create daily attendance sheets for Category Computer Applications and Business Administration
        for (const dt of dates) {
            // CS Attendance (Subject: Database Systems)
            const csRecords = [];
            // We find CS students
            const csStudents = await Student.find({ category: catCS._id });
            csStudents.forEach((st, idx) => {
                // Give Aarav/Aditi 100% attendance, Arjun 80% (absent once), Divya 40% (mostly absent)
                let status = 'Present';
                if (st.rollNumber === 'CS-2023-003' && dt === '2026-05-20') {
                    status = 'Absent';
                }
                if (st.rollNumber === 'CS-2023-004' && (dt === '2026-05-18' || dt === '2026-05-20' || dt === '2026-05-22')) {
                    status = 'Absent';
                }
                csRecords.push({ student: st._id, status });
            });

            await Attendance.create({
                date: new Date(dt),
                category: catCS._id,
                subject: 'Database Systems',
                faculty: facultyUser._id,
                records: csRecords
            });

            // Business Attendance (Subject: Financial Management)
            const bizRecords = [];
            const bizStudents = await Student.find({ category: catBusiness._id });
            bizStudents.forEach((st) => {
                // Let's mark them Present
                let status = 'Present';
                if (st.rollNumber === 'BU-2024-003' && dt === '2026-05-21') {
                    status = 'Absent';
                }
                bizRecords.push({ student: st._id, status });
            });

            await Attendance.create({
                date: new Date(dt),
                category: catBusiness._id,
                subject: 'Financial Management',
                faculty: facultyUser._id,
                records: bizRecords
            });
        }

        console.log('Mock Attendance sheets seeded successfully.');
        console.log('Seeding process complete! You can log in using:');
        console.log('- Admin: admin@sunstone.edu / password123');
        console.log('- Faculty: faculty@sunstone.edu / password123');
        console.log('- Students: aarav@sunstone.edu, etc. / password123');

        process.exit(0);
    } catch (error) {
        console.error('Error during database seeding:', error);
        process.exit(1);
    }
};

seedData();
