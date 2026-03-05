// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth_middleware');
const { upload } = require('../config/cloudinary');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
} = require('../controllers/product_controller');

// All routes are protected
router.use(protect);

// Public routes
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProductById);

// Admin/Manager routes with image upload
router.post(
  '/',
  authorize('admin', 'manager'),
  upload.array('images', 5), // Max 5 images
  createProduct
);

router.put(
  '/:id',
  authorize('admin', 'manager'),
  upload.array('images', 5),
  updateProduct
);

router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;