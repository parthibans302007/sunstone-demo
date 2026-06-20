const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // limit 10MB
});

const { 
    getStudents, 
    createStudent, 
    updateStudent, 
    deleteStudent, 
    bulkUploadStudents, 
    getStudentById, 
    getMyProfile, 
    addMentorshipNote,
    bulkUploadExcel,
    getImportHistory,
    rollbackImport
} = require('../controllers/studentController');
const { protect, admin, facultyOrAdmin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getStudents).post(protect, admin, createStudent);
router.route('/bulk').post(protect, admin, bulkUploadStudents);
router.route('/bulk-upload').post(protect, admin, upload.single('file'), bulkUploadExcel);
router.route('/import-history').get(protect, admin, getImportHistory);
router.route('/rollback/:batchId').post(protect, admin, rollbackImport);
router.route('/profile/me').get(protect, getMyProfile);
router.route('/:id/mentorship-notes').post(protect, facultyOrAdmin, addMentorshipNote);
router.route('/:id')
    .get(protect, getStudentById)
    .put(protect, admin, updateStudent)
    .delete(protect, admin, deleteStudent);

module.exports = router;
