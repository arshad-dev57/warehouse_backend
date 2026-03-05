// routes/supplierRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth_middleware');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplier_controller');

// All routes are protected
router.use(protect);

// Supplier routes
router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', authorize('admin', 'manager'), createSupplier);
router.put('/:id', authorize('admin', 'manager'), updateSupplier);
router.delete('/:id', authorize('admin'), deleteSupplier);

module.exports = router;