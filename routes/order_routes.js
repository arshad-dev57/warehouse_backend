// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth_middleware');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrdersCount
} = require('../controllers/order_controller');

// All routes are protected
router.use(protect);

// Order routes
router.get('/', getOrders);
router.get('/counts', getOrdersCount);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);

module.exports = router;