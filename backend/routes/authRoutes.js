const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken, logoutUser, getUserProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
