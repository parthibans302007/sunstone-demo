const express = require('express');
const router = express.Router();
const { getRules, saveRules, getEligibleStudents } = require('../controllers/placementController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/rules').get(protect, getRules).post(protect, admin, saveRules);
router.route('/eligible').get(protect, getEligibleStudents);

module.exports = router;
