// routes/categoryRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth_middleware');
const {
  getCategories,
  createCategory
} = require('../controllers/category_controller');

router.use(protect);

router.get('/', getCategories);
router.post('/', authorize('admin', 'manager'), createCategory);

module.exports = router;