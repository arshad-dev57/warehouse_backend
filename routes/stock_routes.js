// routes/stockRoutes.js - Update routes

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth_middleware');
const {
  addStock,
  removeStock,  
  getStockHistory, 
} = require('../controllers/stock_controller');
router.use(protect);
router.post('/in', addStock);
router.post('/out', removeStock); 
router.get('/history/:productId', getStockHistory);

module.exports = router;