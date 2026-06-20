const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, admin, facultyOrAdmin } = require('../middleware/authMiddleware');

router.route('/').get(protect, facultyOrAdmin, getCategories).post(protect, admin, createCategory);
router.route('/:id').put(protect, admin, updateCategory).delete(protect, admin, deleteCategory);

module.exports = router;
