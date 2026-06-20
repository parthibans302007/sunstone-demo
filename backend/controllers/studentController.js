const Student = require('../models/Student');
const User = require('../models/User');
const xlsx = require('xlsx');
const ImportHistory = require('../models/ImportHistory');
const Category = require('../models/Category');

const getStudents = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'faculty') {
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
        } else if (req.user.role === 'student') {
            query = { user: req.user._id };
        }

        const students = await Student.find(query).populate('user', 'name email role').populate('category', 'name description');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createStudent = async (req, res) => {
    const { 
        name, email, rollNumber, category, contactNumber, parentContact, address,
        batch, course, semester, year, section, academicYear,
        gender, dob, community, bloodGroup, gpa, feesPaid, noDueStatus,
        backlogCount, internshipCompleted, notes
    } = req.body;
    try {
        const studentExists = await Student.findOne({ rollNumber });
        if (studentExists) {
            return res.status(400).json({ message: 'Student with this roll number already exists' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password: 'password123',
            role: 'student',
            isFirstLogin: false
        });

        const student = await Student.create({
            user: user._id, 
            rollNumber, 
            category, 
            contactNumber, 
            parentContact, 
            address,
            batch,
            course,
            semester: Number(semester) || 1,
            year: Number(year) || 1,
            section: section || 'A',
            academicYear: academicYear || '2025-2026',
            gender,
            dob,
            community,
            bloodGroup,
            gpa: Number(gpa) || 0,
            feesPaid: feesPaid === true || feesPaid === 'true',
            noDueStatus: noDueStatus === true || noDueStatus === 'true',
            backlogCount: Number(backlogCount) || 0,
            internshipCompleted: internshipCompleted === true || internshipCompleted === 'true',
            notes: notes || '',
            isActive: true
        });

        const fullStudent = await Student.findById(student._id).populate('user', 'name email').populate('category', 'name');
        
        const { logAction } = require('../utils/auditLogger');
        await logAction(req, 'STUDENT_ADDED', 'STUDENTS', null, fullStudent.toObject());

        res.status(201).json(fullStudent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateStudent = async (req, res) => {
    const { 
        name, email, rollNumber, category, contactNumber, parentContact, address,
        batch, course, semester, year, section, academicYear,
        gender, dob, community, bloodGroup, gpa, feesPaid, noDueStatus,
        internalMarks, semesterMarks, classTestMarks, backlogCount, internshipCompleted,
        overallPerformance, notes
    } = req.body;
    
    try {
        const student = await Student.findById(req.params.id);
        if (student) {
            const previousStudent = student.toObject();

            student.rollNumber = rollNumber || student.rollNumber;
            student.category = category || student.category;
            student.contactNumber = contactNumber !== undefined ? contactNumber : student.contactNumber;
            student.parentContact = parentContact !== undefined ? parentContact : student.parentContact;
            student.address = address !== undefined ? address : student.address;
            
            student.batch = batch !== undefined ? batch : student.batch;
            student.course = course !== undefined ? course : student.course;
            student.semester = semester !== undefined ? Number(semester) : student.semester;
            student.year = year !== undefined ? Number(year) : student.year;
            student.section = section !== undefined ? section : student.section;
            student.academicYear = academicYear !== undefined ? academicYear : student.academicYear;
            
            student.gender = gender !== undefined ? gender : student.gender;
            student.dob = dob !== undefined ? dob : student.dob;
            student.community = community !== undefined ? community : student.community;
            student.bloodGroup = bloodGroup !== undefined ? bloodGroup : student.bloodGroup;
            
            student.gpa = gpa !== undefined ? Number(gpa) : student.gpa;
            student.feesPaid = feesPaid !== undefined ? feesPaid : student.feesPaid;
            student.noDueStatus = noDueStatus !== undefined ? noDueStatus : student.noDueStatus;
            student.internalMarks = internalMarks !== undefined ? Number(internalMarks) : student.internalMarks;
            student.semesterMarks = semesterMarks !== undefined ? Number(semesterMarks) : student.semesterMarks;
            student.classTestMarks = classTestMarks !== undefined ? Number(classTestMarks) : student.classTestMarks;
            student.backlogCount = backlogCount !== undefined ? Number(backlogCount) : student.backlogCount;
            student.internshipCompleted = internshipCompleted !== undefined ? internshipCompleted : student.internshipCompleted;
            student.overallPerformance = overallPerformance !== undefined ? overallPerformance : student.overallPerformance;
            student.notes = notes !== undefined ? notes : student.notes;

            const updatedStudent = await student.save();

            // Update user name and email if provided
            if (name || email) {
                const user = await User.findById(student.user);
                if (user) {
                    if (name) user.name = name;
                    if (email) user.email = email;
                    await user.save();
                }
            }

            const fullStudent = await Student.findById(student._id)
                .populate('user', 'name email role')
                .populate('category', 'name description');

            const { logAction } = require('../utils/auditLogger');
            if (gpa !== undefined && Number(gpa) !== previousStudent.gpa) {
                await logAction(req, 'CGPA_UPDATED', 'STUDENTS', { gpa: previousStudent.gpa }, { gpa: Number(gpa), rollNumber: student.rollNumber });
            }
            await logAction(req, 'STUDENT_UPDATED', 'STUDENTS', previousStudent, updatedStudent.toObject());

            res.json(fullStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (student) {
            const previousState = student.toObject();
            await student.deleteOne();

            const { logAction } = require('../utils/auditLogger');
            await logAction(req, 'STUDENT_DELETED', 'STUDENTS', previousState, null);

            res.json({ message: 'Student removed' });
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const bulkUploadStudents = async (req, res) => {
    const { students } = req.body;
    if (!students || !Array.isArray(students)) {
        return res.status(400).json({ message: 'Invalid payload: students array is required' });
    }

    const results = {
        successCount: 0,
        failedCount: 0,
        errors: []
    };

    try {
        const categories = await Category.find({});
        const categoryMap = {};
        categories.forEach(c => {
            categoryMap[c.name.toLowerCase().trim()] = c._id;
        });

        for (let i = 0; i < students.length; i++) {
            const row = students[i];
            const rowNum = i + 1;
            const {
                name,
                email,
                rollNumber,
                departmentName,
                course,
                batch,
                semester,
                year,
                section,
                gpa,
                backlogCount,
                internshipCompleted,
                contactNumber,
                parentContact,
                address
            } = row;

            if (!rollNumber) {
                results.failedCount++;
                results.errors.push({ row: rowNum, error: 'Roll number is required' });
                continue;
            }

            // Lookup category by name
            let categoryId = null;
            if (departmentName) {
                categoryId = categoryMap[departmentName.toLowerCase().trim()];
                if (!categoryId) {
                    // Fallback to matching first category or creation
                    if (categories.length > 0) {
                        categoryId = categories[0]._id;
                    }
                }
            } else {
                if (categories.length > 0) {
                    categoryId = categories[0]._id;
                }
            }

            if (!categoryId) {
                results.failedCount++;
                results.errors.push({ row: rowNum, rollNumber, error: 'No department found in database' });
                continue;
            }

            try {
                // Check if student exists
                let student = await Student.findOne({ rollNumber });
                if (student) {
                    // Update student
                    student.category = categoryId;
                    student.course = course || student.course;
                    student.batch = batch || student.batch;
                    student.semester = semester !== undefined ? Number(semester) : student.semester;
                    student.year = year !== undefined ? Number(year) : student.year;
                    student.section = section || student.section;
                    student.gpa = gpa !== undefined ? Number(gpa) : student.gpa;
                    student.backlogCount = backlogCount !== undefined ? Number(backlogCount) : student.backlogCount;
                    student.internshipCompleted = internshipCompleted !== undefined ? (internshipCompleted === true || internshipCompleted === 'true' || internshipCompleted === 'Yes' || internshipCompleted === 'Completed') : student.internshipCompleted;
                    student.contactNumber = contactNumber || student.contactNumber;
                    student.parentContact = parentContact || student.parentContact;
                    student.address = address || student.address;
                    
                    await student.save();
                    
                    // Also update user name if provided
                    if (name) {
                        const user = await User.findById(student.user);
                        if (user) {
                            user.name = name;
                            await user.save();
                        }
                    }

                    results.successCount++;
                } else {
                    // Create student
                    if (!name || !email) {
                        results.failedCount++;
                        results.errors.push({ row: rowNum, rollNumber, error: 'Name and email are required for new students' });
                        continue;
                    }

                    // Check user email
                    const userExists = await User.findOne({ email });
                    if (userExists) {
                        results.failedCount++;
                        results.errors.push({ row: rowNum, rollNumber, error: `Email ${email} is already in use by another user` });
                        continue;
                    }

                    const user = await User.create({
                        name,
                        email,
                        password: 'password123',
                        role: 'student',
                        isFirstLogin: false
                    });

                    await Student.create({
                        user: user._id,
                        rollNumber,
                        category: categoryId,
                        course,
                        batch,
                        semester: Number(semester) || 1,
                        year: Number(year) || 1,
                        section: section || 'A',
                        gpa: Number(gpa) || 0,
                        backlogCount: Number(backlogCount) || 0,
                        internshipCompleted: internshipCompleted === true || internshipCompleted === 'true' || internshipCompleted === 'Yes' || internshipCompleted === 'Completed',
                        contactNumber,
                        parentContact,
                        address,
                        isActive: true
                    });

                    results.successCount++;
                }
            } catch (innerError) {
                results.failedCount++;
                results.errors.push({ row: rowNum, rollNumber, error: innerError.message });
            }
        }

        const { logAction } = require('../utils/auditLogger');
        await logAction(req, 'BULK_UPLOAD_PERFORMED', 'STUDENTS', null, { successCount: results.successCount, failedCount: results.failedCount });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('user', 'name email role')
            .populate('category', 'name description');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // RBAC: If student role, they can only view their own profile
        if (req.user.role === 'student' && student.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access Denied: You can only view your own profile' });
        }
        
        // RBAC: If faculty role, check department / assignments
        if (req.user.role === 'faculty') {
            const currentUser = await User.findById(req.user._id);
            if (currentUser) {
                const assignedBatches = currentUser.assignedBatches || [];
                const assignedCourses = currentUser.assignedCourses || [];
                const assignedSections = currentUser.assignedSections || [];
                
                const batchMatch = assignedBatches.length === 0 || assignedBatches.includes(student.batch);
                const courseMatch = assignedCourses.length === 0 || assignedCourses.includes(student.course);
                const sectionMatch = assignedSections.length === 0 || assignedSections.includes(student.section);
                
                if (!batchMatch || !courseMatch || !sectionMatch) {
                    return res.status(403).json({ message: 'Access Denied: Student is not in your assigned batch/course/section' });
                }
            }
        }
        
        // Compute attendance percentage
        const Attendance = require('../models/Attendance');
        const { isAttended } = require('../utils/attendanceHelper');
        const attendances = await Attendance.find({ "records.student": student._id });
        let total = 0;
        let present = 0;
        attendances.forEach(att => {
            const rec = att.records.find(r => r.student.toString() === student._id.toString());
            if (rec) {
                total++;
                if (isAttended(rec.status)) {
                    present++;
                }
            }
        });
        const attendancePercentage = total === 0 ? 100 : Math.round((present / total) * 100);

        // Compute rank relative to peers in the same course
        const peers = await Student.find({ course: student.course }).sort({ gpa: -1 });
        const rank = peers.findIndex(p => p._id.toString() === student._id.toString()) + 1;
        const totalStudents = peers.length;

        const studentObj = student.toObject();
        studentObj.attendancePercentage = attendancePercentage;
        studentObj.rank = rank;
        studentObj.totalStudents = totalStudents;

        res.json(studentObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user._id })
            .populate('user', 'name email role')
            .populate('category', 'name description');
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }
        
        // Compute attendance percentage
        const Attendance = require('../models/Attendance');
        const { isAttended } = require('../utils/attendanceHelper');
        const attendances = await Attendance.find({ "records.student": student._id });
        let total = 0;
        let present = 0;
        attendances.forEach(att => {
            const rec = att.records.find(r => r.student.toString() === student._id.toString());
            if (rec) {
                total++;
                if (isAttended(rec.status)) {
                    present++;
                }
            }
        });
        const attendancePercentage = total === 0 ? 100 : Math.round((present / total) * 100);

        // Compute rank relative to peers in the same course
        const peers = await Student.find({ course: student.course }).sort({ gpa: -1 });
        const rank = peers.findIndex(p => p._id.toString() === student._id.toString()) + 1;
        const totalStudents = peers.length;

        const studentObj = student.toObject();
        studentObj.attendancePercentage = attendancePercentage;
        studentObj.rank = rank;
        studentObj.totalStudents = totalStudents;

        res.json(studentObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addMentorshipNote = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const { type, content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }
        
        student.mentorshipNotes = student.mentorshipNotes || [];
        student.mentorshipNotes.push({
            author: req.user._id,
            authorName: req.user.name,
            type: type || 'Note',
            content
        });
        
        student.notes = `${type || 'Note'} (${req.user.name}): ${content}`;
        await student.save();
        
        const { logAction } = require('../utils/auditLogger');
        await logAction(req, 'STUDENT_MENTORSHIP_NOTE_ADDED', 'STUDENTS', null, { studentId: student._id, type, content });
        
        res.status(201).json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const bulkUploadExcel = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileName = req.file.originalname;
    const uploadedBy = req.user._id;
    const importBatchId = 'batch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const { logAction } = require('../utils/auditLogger');
    await logAction(req, 'IMPORT_STARTED', 'STUDENTS', null, { fileName, importBatchId });

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        const totalRows = rawRows.length;
        if (totalRows === 0) {
            await logAction(req, 'IMPORT_FAILED', 'STUDENTS', null, { fileName, importBatchId, error: 'Empty file' });
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        let mapping = {};
        if (req.body.mapping) {
            try {
                mapping = JSON.parse(req.body.mapping);
            } catch (err) {
                // ignore
            }
        }

        const dbFields = [
            'name', 'email', 'rollNumber', 'category', 'contactNumber', 'whatsappNumber', 'officialEmail',
            'fatherName', 'fatherOccupation', 'fatherMobile', 'motherName', 'motherOccupation', 'motherMobile',
            'guardianName', 'guardianMobile', 'year', 'semester', 'attendancePercentage', 'cgpa', 'backlogCount', 'internshipCompleted'
        ];

        const sheetHeaders = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

        const finalMapping = {};
        dbFields.forEach(field => {
            if (mapping[field] && sheetHeaders.includes(mapping[field])) {
                finalMapping[field] = mapping[field];
            } else {
                let match = null;
                if (field === 'name') {
                    match = sheetHeaders.find(h => ['student name', 'name', 'full name'].includes(h.toLowerCase().trim()));
                } else if (field === 'email') {
                    match = sheetHeaders.find(h => ['personal email id', 'personal email', 'email', 'email address', 'email id'].includes(h.toLowerCase().trim()));
                } else if (field === 'rollNumber') {
                    match = sheetHeaders.find(h => ['register no', 'register number', 'roll number', 'roll no', 'uid'].includes(h.toLowerCase().trim()));
                } else if (field === 'category') {
                    match = sheetHeaders.find(h => ['programme', 'program', 'department', 'category'].includes(h.toLowerCase().trim()));
                } else if (field === 'contactNumber') {
                    match = sheetHeaders.find(h => ['mobile no', 'mobile number', 'student mobile', 'phone'].includes(h.toLowerCase().trim()));
                } else if (field === 'whatsappNumber') {
                    match = sheetHeaders.find(h => ['whatsapp number', 'whatsapp no', 'whatsapp'].includes(h.toLowerCase().trim()));
                } else if (field === 'officialEmail') {
                    match = sheetHeaders.find(h => ['official email id', 'official email'].includes(h.toLowerCase().trim()));
                } else if (field === 'fatherName') {
                    match = sheetHeaders.find(h => ['father name', 'father\'s name'].includes(h.toLowerCase().trim()));
                } else if (field === 'fatherOccupation') {
                    match = sheetHeaders.find(h => ['father occupation', 'father\'s occupation'].includes(h.toLowerCase().trim()));
                } else if (field === 'fatherMobile') {
                    match = sheetHeaders.find(h => ['father mobile number', 'father mobile no', 'father\'s phone'].includes(h.toLowerCase().trim()));
                } else if (field === 'motherName') {
                    match = sheetHeaders.find(h => ['mother name', 'mother\'s name'].includes(h.toLowerCase().trim()));
                } else if (field === 'motherOccupation') {
                    match = sheetHeaders.find(h => ['mother occupation', 'mother\'s occupation'].includes(h.toLowerCase().trim()));
                } else if (field === 'motherMobile') {
                    match = sheetHeaders.find(h => ['mother mobile number', 'mother mobile no', 'mother\'s phone'].includes(h.toLowerCase().trim()));
                } else if (field === 'guardianName') {
                    match = sheetHeaders.find(h => ['guardian name'].includes(h.toLowerCase().trim()));
                } else if (field === 'guardianMobile') {
                    match = sheetHeaders.find(h => ['guardian mobile no', 'guardian mobile number', 'guardian phone'].includes(h.toLowerCase().trim()));
                } else if (field === 'year') {
                    match = sheetHeaders.find(h => ['year', 'academic year (1-4)'].includes(h.toLowerCase().trim()));
                } else if (field === 'semester') {
                    match = sheetHeaders.find(h => ['semester', 'sem'].includes(h.toLowerCase().trim()));
                } else if (field === 'attendancePercentage') {
                    match = sheetHeaders.find(h => ['attendance percentage', 'attendance %', 'attendance'].includes(h.toLowerCase().trim()));
                } else if (field === 'cgpa') {
                    match = sheetHeaders.find(h => ['cgpa', 'gpa', 'cumulative gpa'].includes(h.toLowerCase().trim()));
                } else if (field === 'backlogCount') {
                    match = sheetHeaders.find(h => ['number of arrears', 'arrears', 'backlog count', 'backlogs'].includes(h.toLowerCase().trim()));
                } else if (field === 'internshipCompleted') {
                    match = sheetHeaders.find(h => ['internship status', 'internship completed', 'internship'].includes(h.toLowerCase().trim()));
                } else if (field === 'uid') {
                    match = sheetHeaders.find(h => ['uid'].includes(h.toLowerCase().trim()));
                }
                if (match) {
                    finalMapping[field] = match;
                }
            }
        });

        let imported = 0;
        let updated = 0;
        let failed = 0;
        const errors = [];
        const previousStates = [];

        const categories = await Category.find({});
        const categoryMap = {};
        categories.forEach(c => {
            categoryMap[c.name.toLowerCase().trim()] = c._id;
        });

        const seenEmails = new Set();
        const seenRolls = new Set();

        const validRowsData = [];

        for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            const rowNum = i + 1;

            const mappedRow = {};
            dbFields.forEach(field => {
                const sheetCol = finalMapping[field];
                mappedRow[field] = sheetCol !== undefined ? String(row[sheetCol]).trim() : '';
            });

            if (row['UID']) {
                mappedRow['uid'] = String(row['UID']).trim();
            }

            const name = mappedRow.name;
            const email = mappedRow.email;
            const rollNumber = mappedRow.rollNumber;
            const programme = mappedRow.category;
            const contactNumber = mappedRow.contactNumber;
            const whatsappNumber = mappedRow.whatsappNumber;
            const officialEmail = mappedRow.officialEmail;
            const fatherName = mappedRow.fatherName;
            const fatherOccupation = mappedRow.fatherOccupation;
            const fatherMobile = mappedRow.fatherMobile;
            const motherName = mappedRow.motherName;
            const motherOccupation = mappedRow.motherOccupation;
            const motherMobile = mappedRow.motherMobile;
            const guardianName = mappedRow.guardianName;
            const guardianMobile = mappedRow.guardianMobile;

            const year = mappedRow.year ? parseInt(mappedRow.year) : 1;
            const semester = mappedRow.semester ? parseInt(mappedRow.semester) : 1;
            const attendancePercentage = mappedRow.attendancePercentage ? parseFloat(mappedRow.attendancePercentage) : 0;
            const cgpa = mappedRow.cgpa ? parseFloat(mappedRow.cgpa) : 0.0;
            const backlogCount = mappedRow.backlogCount ? parseInt(mappedRow.backlogCount) : 0;

            const internshipCompletedStr = mappedRow.internshipCompleted ? mappedRow.internshipCompleted.toLowerCase() : '';
            const internshipCompleted = ['yes', 'completed', 'true', '1'].includes(internshipCompletedStr);

            if (!name) {
                failed++;
                errors.push({ row: rowNum, error: 'Student Name is required' });
                continue;
            }
            if (!rollNumber) {
                failed++;
                errors.push({ row: rowNum, error: 'Register Number (Roll Number) is required' });
                continue;
            }
            if (!programme) {
                failed++;
                errors.push({ row: rowNum, error: 'Programme (Category) is required' });
                continue;
            }
            if (!email || !email.includes('@')) {
                failed++;
                errors.push({ row: rowNum, rollNumber, error: `Invalid email address: '${email}'` });
                continue;
            }

            const mobileFields = { contactNumber, whatsappNumber, fatherMobile, motherMobile, guardianMobile };
            let hasMobileError = false;
            for (const [key, value] of Object.entries(mobileFields)) {
                if (value) {
                    const cleanNum = value.replace(/[\s\+\-\(\)]/g, '');
                    if (isNaN(Number(cleanNum)) || cleanNum.length < 7) {
                        failed++;
                        errors.push({ row: rowNum, rollNumber, error: `Invalid mobile number for field ${key}: '${value}'` });
                        hasMobileError = true;
                        break;
                    }
                }
            }
            if (hasMobileError) continue;

            if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
                failed++;
                errors.push({ row: rowNum, rollNumber, error: `CGPA must be a number between 0.0 and 10.0 (got '${cgpa}')` });
                continue;
            }

            if (isNaN(attendancePercentage) || attendancePercentage < 0 || attendancePercentage > 100) {
                failed++;
                errors.push({ row: rowNum, rollNumber, error: `Attendance Percentage must be between 0 and 100 (got '${attendancePercentage}')` });
                continue;
            }

            if (isNaN(backlogCount) || backlogCount < 0 || backlogCount > 50) {
                failed++;
                errors.push({ row: rowNum, rollNumber, error: `Number of Arrears must be between 0 and 50 (got '${backlogCount}')` });
                continue;
            }

            if (seenEmails.has(email)) {
                failed++;
                errors.push({ row: rowNum, rollNumber, error: `Duplicate email inside the spreadsheet: '${email}'` });
                continue;
            }
            seenEmails.add(email);

            if (seenRolls.has(rollNumber)) {
                failed++;
                errors.push({ row: rowNum, rollNumber, error: `Duplicate Register Number inside the spreadsheet: '${rollNumber}'` });
                continue;
            }
            seenRolls.add(rollNumber);

            validRowsData.push({
                name, email, rollNumber, programme, contactNumber, whatsappNumber, officialEmail,
                fatherName, fatherOccupation, fatherMobile, motherName, motherOccupation, motherMobile,
                guardianName, guardianMobile, year, semester, attendancePercentage, cgpa, backlogCount, internshipCompleted,
                uid: mappedRow.uid
            });
        }

        for (let i = 0; i < validRowsData.length; i++) {
            const rowData = validRowsData[i];
            
            const progNameNorm = rowData.programme.toLowerCase().trim();
            let categoryId = categoryMap[progNameNorm];
            if (!categoryId) {
                const newCat = await Category.create({
                    name: rowData.programme,
                    description: `Department of ${rowData.programme}`
                });
                categoryMap[progNameNorm] = newCat._id;
                categoryId = newCat._id;
                categories.push(newCat);
            }

            const userWithEmail = await User.findOne({ email: rowData.email });
            const studentWithRoll = await Student.findOne({ rollNumber: rowData.rollNumber }).populate('user');

            if (userWithEmail && (!studentWithRoll || studentWithRoll.user._id.toString() !== userWithEmail._id.toString())) {
                failed++;
                errors.push({ rollNumber: rowData.rollNumber, error: `Email ${rowData.email} is already in use by another student` });
                continue;
            }

            if (studentWithRoll && studentWithRoll.user.email !== rowData.email) {
                failed++;
                errors.push({ rollNumber: rowData.rollNumber, error: `Register Number ${rowData.rollNumber} is already associated with email ${studentWithRoll.user.email}` });
                continue;
            }

            if (studentWithRoll) {
                previousStates.push({
                    studentId: studentWithRoll._id,
                    studentData: studentWithRoll.toObject(),
                    userData: studentWithRoll.user.toObject()
                });

                const userObj = await User.findById(studentWithRoll.user._id);
                userObj.name = rowData.name;
                await userObj.save();

                studentWithRoll.category = categoryId;
                studentWithRoll.uid = rowData.uid || studentWithRoll.uid;
                studentWithRoll.contactNumber = rowData.contactNumber || studentWithRoll.contactNumber;
                studentWithRoll.whatsappNumber = rowData.whatsappNumber || studentWithRoll.whatsappNumber;
                studentWithRoll.officialEmail = rowData.officialEmail || studentWithRoll.officialEmail;
                studentWithRoll.fatherName = rowData.fatherName || studentWithRoll.fatherName;
                studentWithRoll.fatherOccupation = rowData.fatherOccupation || studentWithRoll.fatherOccupation;
                studentWithRoll.fatherMobile = rowData.fatherMobile || studentWithRoll.fatherMobile;
                studentWithRoll.motherName = rowData.motherName || studentWithRoll.motherName;
                studentWithRoll.motherOccupation = rowData.motherOccupation || studentWithRoll.motherOccupation;
                studentWithRoll.motherMobile = rowData.motherMobile || studentWithRoll.motherMobile;
                studentWithRoll.guardianName = rowData.guardianName || studentWithRoll.guardianName;
                studentWithRoll.guardianMobile = rowData.guardianMobile || studentWithRoll.guardianMobile;

                studentWithRoll.year = rowData.year;
                studentWithRoll.semester = rowData.semester;
                studentWithRoll.attendancePercentage = rowData.attendancePercentage;
                studentWithRoll.cgpa = rowData.cgpa;
                studentWithRoll.backlogCount = rowData.backlogCount;
                studentWithRoll.internshipCompleted = rowData.internshipCompleted;
                studentWithRoll.importBatchId = importBatchId;

                await studentWithRoll.save();
                updated++;
            } else {
                const userObj = await User.create({
                    name: rowData.name,
                    email: rowData.email,
                    password: 'password123',
                    role: 'student',
                    isFirstLogin: false
                });

                await Student.create({
                    user: userObj._id,
                    rollNumber: rowData.rollNumber,
                    category: categoryId,
                    uid: rowData.uid,
                    contactNumber: rowData.contactNumber,
                    whatsappNumber: rowData.whatsappNumber,
                    officialEmail: rowData.officialEmail,
                    fatherName: rowData.fatherName,
                    fatherOccupation: rowData.fatherOccupation,
                    fatherMobile: rowData.fatherMobile,
                    motherName: rowData.motherName,
                    motherOccupation: rowData.motherOccupation,
                    motherMobile: rowData.motherMobile,
                    guardianName: rowData.guardianName,
                    guardianMobile: rowData.guardianMobile,
                    year: rowData.year,
                    semester: rowData.semester,
                    attendancePercentage: rowData.attendancePercentage,
                    cgpa: rowData.cgpa,
                    backlogCount: rowData.backlogCount,
                    internshipCompleted: rowData.internshipCompleted,
                    importBatchId
                });
                imported++;
            }
        }

        await ImportHistory.create({
            fileName,
            uploadedBy,
            totalRows,
            imported,
            updated,
            failed,
            importBatchId,
            status: 'Completed',
            errors,
            previousStates
        });

        await logAction(req, 'IMPORT_COMPLETED', 'STUDENTS', null, { 
            fileName, 
            importBatchId, 
            imported, 
            updated, 
            failed 
        });

        res.json({
            success: true,
            totalRows,
            imported,
            updated,
            failed,
            errors,
            importBatchId
        });
    } catch (error) {
        console.error('Import processing crash:', error);
        await logAction(req, 'IMPORT_FAILED', 'STUDENTS', null, { fileName, importBatchId, error: error.message });
        res.status(500).json({ message: 'Error processing Excel file: ' + error.message });
    }
};

const rollbackImport = async (req, res) => {
    const { batchId } = req.params;
    const { logAction } = require('../utils/auditLogger');
    
    try {
        const importHistory = await ImportHistory.findOne({ importBatchId: batchId });
        if (!importHistory) {
            return res.status(404).json({ message: 'Import history batch not found' });
        }

        if (importHistory.status === 'Rolled Back') {
            return res.status(400).json({ message: 'This import has already been rolled back' });
        }

        for (const state of importHistory.previousStates) {
            await Student.findByIdAndUpdate(state.studentId, state.studentData);
            await User.findByIdAndUpdate(state.studentData.user, state.userData);
        }

        const newStudents = await Student.find({ importBatchId: batchId });
        const updatedStudentIds = importHistory.previousStates.map(s => s.studentId.toString());
        const newlyCreatedStudents = newStudents.filter(s => !updatedStudentIds.includes(s._id.toString()));
        
        const newlyCreatedStudentUserIds = newlyCreatedStudents.map(s => s.user);
        const newlyCreatedStudentIds = newlyCreatedStudents.map(s => s._id);

        if (newlyCreatedStudentUserIds.length > 0) {
            await User.deleteMany({ _id: { $in: newlyCreatedStudentUserIds } });
        }
        if (newlyCreatedStudentIds.length > 0) {
            await Student.deleteMany({ _id: { $in: newlyCreatedStudentIds } });
        }

        importHistory.status = 'Rolled Back';
        await importHistory.save();

        const affectedCount = newlyCreatedStudents.length + importHistory.previousStates.length;
        await logAction(req, 'IMPORT_ROLLED_BACK', 'STUDENTS', null, { 
            fileName: importHistory.fileName, 
            importBatchId: batchId,
            recordsAffected: affectedCount
        });

        res.json({
            success: true,
            message: 'Import successfully rolled back',
            deletedCount: newlyCreatedStudents.length,
            restoredCount: importHistory.previousStates.length
        });
    } catch (error) {
        console.error('Rollback failed:', error);
        res.status(500).json({ message: 'Error rolling back import: ' + error.message });
    }
};

const getImportHistory = async (req, res) => {
    try {
        const history = await ImportHistory.find({})
            .populate('uploadedBy', 'name email')
            .sort({ uploadedAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching import history: ' + error.message });
    }
};

module.exports = { 
    getStudents, 
    createStudent, 
    updateStudent, 
    deleteStudent, 
    bulkUploadStudents,
    getStudentById,
    getMyProfile,
    addMentorshipNote,
    bulkUploadExcel,
    rollbackImport,
    getImportHistory
};
