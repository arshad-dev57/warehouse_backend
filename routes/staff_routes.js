        // routes/staffRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth_middleware');
const {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus
} = require('../controllers/staff_controller');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Staff routes
router.get('/', getStaff);
router.get('/:id', getStaffById);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.patch('/:id/toggle-status', toggleStaffStatus);
router.delete('/:id', deleteStaff);

module.exports = router;