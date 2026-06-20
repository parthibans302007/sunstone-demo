const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ReportTemplate = require('../models/ReportTemplate');
const { isAttended } = require('../utils/attendanceHelper');

const getReports = async (req, res) => {
    try {
        const {
            reportType,
            batch,
            course,
            semester,
            year,
            section,
            category,
            academicYear,
            isActive,
            feesPaid,
            noDueStatus,
            internshipCompleted,
            passStatus,
            search,
            sortBy = 'name',
            sortOrder = 'asc',
            groupBy = '',
            page = 1,
            limit = 50
        } = req.query;

        // Fetch user from DB to get the latest assignments
        const currentUser = await User.findById(req.user._id);
        const isFaculty = currentUser.role === 'faculty';
        const isStudent = currentUser.role === 'student';

        // Enforce role-based access for Faculty
        if (isFaculty) {
            const assignedBatches = currentUser.assignedBatches || [];
            const assignedCourses = currentUser.assignedCourses || [];
            const assignedSections = currentUser.assignedSections || [];

            // If faculty explicitly requests a batch/course/section outside their assignment, deny
            if (batch) {
                const batchList = batch.split(',');
                if (batchList.some(b => !assignedBatches.includes(b))) {
                    return res.status(403).json({ message: `Access Denied: You are not authorized to view reports for Batch ${batch}.` });
                }
            }
            if (course) {
                const courseList = course.split(',');
                if (courseList.some(c => !assignedCourses.includes(c))) {
                    return res.status(403).json({ message: `Access Denied: You are not authorized to view reports for Course ${course}.` });
                }
            }
            if (section) {
                const sectionList = section.split(',');
                if (sectionList.some(s => !assignedSections.includes(s))) {
                    return res.status(403).json({ message: `Access Denied: You are not authorized to view reports for Section ${section}.` });
                }
            }
        }

        // Fetch students and populate user/category
        let students;
        if (isStudent) {
            students = await Student.find({ user: currentUser._id })
                .populate('user', 'name email role')
                .populate('category', 'name description');
        } else if (isFaculty) {
            const assignedBatches = currentUser.assignedBatches || [];
            const assignedCourses = currentUser.assignedCourses || [];
            const assignedSections = currentUser.assignedSections || [];
            students = await Student.find({
                batch: { $in: assignedBatches },
                course: { $in: assignedCourses },
                section: { $in: assignedSections }
            })
                .populate('user', 'name email role')
                .populate('category', 'name description');
        } else {
            students = await Student.find({})
                .populate('user', 'name email role')
                .populate('category', 'name description');
        }

        // Fetch all attendance records to calculate attendance percentage
        const attendances = await Attendance.find({});
        
        // Calculate attendance percentages
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

        // Map and enrich students data
        let enrichedStudents = students.map(s => {
            const attStats = attendanceMap[s._id.toString()] || { total: 0, present: 0 };
            const attendancePercentage = attStats.total === 0 ? 100 : Math.round((attStats.present / attStats.total) * 100);
            
            // Check if passed based on GPA >= 5.0 and backlog count === 0
            const isPassed = (s.gpa || 0) >= 5.0 && (s.backlogCount || 0) === 0;

            return {
                _id: s._id,
                name: s.user?.name || 'Unknown',
                email: s.user?.email || 'N/A',
                rollNumber: s.rollNumber,
                categoryName: s.category?.name || 'N/A',
                categoryId: s.category?._id || null,
                contactNumber: s.contactNumber || 'N/A',
                parentContact: s.parentContact || 'N/A',
                address: s.address || 'N/A',
                batch: s.batch || 'N/A',
                course: s.course || 'N/A',
                semester: s.semester || 1,
                year: s.year || 1,
                section: s.section || 'A',
                academicYear: s.academicYear || 'N/A',
                isActive: s.isActive !== undefined ? s.isActive : true,
                gender: s.gender || 'N/A',
                dob: s.dob || null,
                community: s.community || 'N/A',
                bloodGroup: s.bloodGroup || 'N/A',
                gpa: s.gpa || 0,
                feesPaid: s.feesPaid || false,
                noDueStatus: s.noDueStatus || false,
                internalMarks: s.internalMarks || 0,
                semesterMarks: s.semesterMarks || 0,
                classTestMarks: s.classTestMarks || 0,
                backlogCount: s.backlogCount || 0,
                internshipCompleted: s.internshipCompleted || false,
                overallPerformance: s.overallPerformance || 'Average',
                attendancePercentage,
                isPassed
            };
        });

        // Apply Query Filters
        if (batch) {
            const batchList = batch.split(',');
            enrichedStudents = enrichedStudents.filter(s => batchList.includes(s.batch));
        }
        if (course) {
            const courseList = course.split(',');
            enrichedStudents = enrichedStudents.filter(s => courseList.includes(s.course));
        }
        if (semester) {
            const semList = semester.split(',').map(Number);
            enrichedStudents = enrichedStudents.filter(s => semList.includes(s.semester));
        }
        if (year) {
            enrichedStudents = enrichedStudents.filter(s => s.year === Number(year));
        }
        if (section) {
            const secList = section.split(',');
            enrichedStudents = enrichedStudents.filter(s => secList.includes(s.section));
        }
        if (category) {
            enrichedStudents = enrichedStudents.filter(s => s.categoryId && s.categoryId.toString() === category);
        }
        if (academicYear) {
            enrichedStudents = enrichedStudents.filter(s => s.academicYear === academicYear);
        }
        if (isActive !== undefined) {
            const activeBool = isActive === 'true';
            enrichedStudents = enrichedStudents.filter(s => s.isActive === activeBool);
        }
        if (feesPaid !== undefined) {
            const feesBool = feesPaid === 'true';
            enrichedStudents = enrichedStudents.filter(s => s.feesPaid === feesBool);
        }
        if (noDueStatus !== undefined) {
            const nodueBool = noDueStatus === 'true';
            enrichedStudents = enrichedStudents.filter(s => s.noDueStatus === nodueBool);
        }
        if (internshipCompleted !== undefined) {
            const internBool = internshipCompleted === 'true';
            enrichedStudents = enrichedStudents.filter(s => s.internshipCompleted === internBool);
        }
        if (passStatus) {
            if (passStatus === 'pass') {
                enrichedStudents = enrichedStudents.filter(s => s.isPassed);
            } else if (passStatus === 'fail') {
                enrichedStudents = enrichedStudents.filter(s => !s.isPassed);
            }
        }

        // Filter based on Report Type specifics
        if (reportType === 'topPerformers') {
            // Sorted by GPA, and GPA must be reasonably high
            enrichedStudents = enrichedStudents.filter(s => s.gpa >= 7.0);
        } else if (reportType === 'atRiskStudents') {
            // At risk: attendance < 75% OR backlogs > 0 OR poor overall performance
            enrichedStudents = enrichedStudents.filter(s => s.attendancePercentage < 75 || s.backlogCount > 0 || s.overallPerformance === 'Poor');
        }

        // Apply Search (Name or Register Number)
        if (search) {
            const searchLower = search.toLowerCase();
            enrichedStudents = enrichedStudents.filter(s => 
                s.name.toLowerCase().includes(searchLower) || 
                s.rollNumber.toLowerCase().includes(searchLower)
            );
        }

        // Calculate Summary Metrics
        const totalStudents = enrichedStudents.length;
        const passedStudents = enrichedStudents.filter(s => s.isPassed).length;
        const failedStudents = totalStudents - passedStudents;
        
        let avgGPA = 0;
        let avgAttendance = 0;
        let feesPendingCount = 0;
        let internshipCompletedCount = 0;
        let noDueCount = 0;

        if (totalStudents > 0) {
            avgGPA = parseFloat((enrichedStudents.reduce((sum, s) => sum + s.gpa, 0) / totalStudents).toFixed(2));
            avgAttendance = Math.round(enrichedStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) / totalStudents);
            feesPendingCount = enrichedStudents.filter(s => !s.feesPaid).length;
            internshipCompletedCount = enrichedStudents.filter(s => s.internshipCompleted).length;
            noDueCount = enrichedStudents.filter(s => s.noDueStatus).length;
        }

        const topPerformers = [...enrichedStudents]
            .sort((a, b) => b.gpa - a.gpa)
            .slice(0, 5)
            .map(s => ({ name: s.name, roll: s.rollNumber, gpa: s.gpa }));

        const studentsNeedingAttention = enrichedStudents
            .filter(s => s.attendancePercentage < 75 || s.backlogCount > 0 || !s.feesPaid)
            .map(s => ({ name: s.name, roll: s.rollNumber, reason: s.attendancePercentage < 75 ? 'Low Attendance' : s.backlogCount > 0 ? 'Backlogs' : 'Fees Pending' }));

        const summary = {
            totalStudents,
            passedStudents,
            failedStudents,
            avgGPA,
            avgAttendance,
            feesPendingCount,
            noDueCount,
            internshipCompletedCount,
            topPerformers,
            studentsNeedingAttention: studentsNeedingAttention.slice(0, 5)
        };

        // Apply Sorting
        enrichedStudents.sort((a, b) => {
            let fieldA = a[sortBy];
            let fieldB = b[sortBy];

            if (typeof fieldA === 'string') {
                fieldA = fieldA.toLowerCase();
                fieldB = fieldB.toLowerCase();
            }

            if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
            if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        // Grouping logic if requested
        let groupedData = null;
        if (groupBy) {
            const groups = {};
            enrichedStudents.forEach(s => {
                const key = s[groupBy] || 'N/A';
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(s);
            });

            groupedData = Object.keys(groups).map(key => {
                const groupStudents = groups[key];
                const gTotal = groupStudents.length;
                const gPassed = groupStudents.filter(st => st.isPassed).length;
                const gAvgGPA = gTotal === 0 ? 0 : parseFloat((groupStudents.reduce((sum, st) => sum + st.gpa, 0) / gTotal).toFixed(2));
                const gAvgAttendance = gTotal === 0 ? 0 : Math.round(groupStudents.reduce((sum, st) => sum + st.attendancePercentage, 0) / gTotal);

                return {
                    groupKey: key,
                    totalStudents: gTotal,
                    passedStudents: gPassed,
                    failedStudents: gTotal - gPassed,
                    avgGPA: gAvgGPA,
                    avgAttendance: gAvgAttendance,
                    students: groupStudents
                };
            });
        }

        // Apply Pagination (only to raw list, if not grouped)
        const totalItems = enrichedStudents.length;
        const totalPages = Math.ceil(totalItems / Number(limit));
        const paginatedStudents = groupBy ? null : enrichedStudents.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));

        const { logAction } = require('../utils/auditLogger');
        await logAction(req, 'REPORT_GENERATED', 'REPORTS', null, { reportType, course, batch, semester, format: req.query.format || 'JSON' });

        res.json({
            summary,
            students: groupBy ? null : paginatedStudents,
            groupedData,
            pagination: {
                totalItems,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Report Templates operations
const getTemplates = async (req, res) => {
    try {
        const templates = await ReportTemplate.find({ createdByUser: req.user._id });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const saveTemplate = async (req, res) => {
    const { name, reportType, filters, selectedFields, sortBy, sortOrder, groupBy } = req.body;
    try {
        if (!name || !reportType) {
            return res.status(400).json({ message: 'Template name and report type are required' });
        }
        const template = await ReportTemplate.create({
            name,
            reportType,
            filters,
            selectedFields,
            sortBy,
            sortOrder,
            groupBy,
            createdByUser: req.user._id
        });
        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const template = await ReportTemplate.findById(req.params.id);
        if (template) {
            if (template.createdByUser.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this template' });
            }
            await template.deleteOne();
            res.json({ message: 'Template removed successfully' });
        } else {
            res.status(404).json({ message: 'Template not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getReports,
    getTemplates,
    saveTemplate,
    deleteTemplate
};
