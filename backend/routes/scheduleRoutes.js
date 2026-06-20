const express = require('express');
const router = express.Router();
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const { protect, facultyOrAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, facultyOrAdmin, getSchedules)
    .post(protect, facultyOrAdmin, createSchedule);

router.route('/:id')
    .put(protect, facultyOrAdmin, updateSchedule)
    .delete(protect, facultyOrAdmin, deleteSchedule);

module.exports = router;
