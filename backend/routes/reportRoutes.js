const express = require('express');
const router = express.Router();
const { getReports, getTemplates, saveTemplate, deleteTemplate } = require('../controllers/reportController');
const { protect, facultyOrAdmin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getReports);
router.route('/templates').get(protect, getTemplates).post(protect, saveTemplate);
router.route('/templates/:id').delete(protect, deleteTemplate);

module.exports = router;
