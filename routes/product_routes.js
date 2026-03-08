// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth_middleware');
const { upload } = require('../config/cloudinary');
const {
  checkBarcodeExists,
  getProductByBarcode,
  searchProducts,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
} = require('../controllers/product_controller');
router.use(protect);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/check-barcode/:barcode', checkBarcodeExists);
router.get('/search', searchProducts); 
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProductById);
router.post(
  '/',
  authorize('admin', 'manager'),
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'barcodeImage', maxCount: 1 }
  ]),
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