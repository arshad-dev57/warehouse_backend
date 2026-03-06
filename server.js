const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Import Routes
const authRoutes = require('./routes/auth_routes');
const categoryRoutes = require('./routes/category_routes');
const productRoutes = require('./routes/product_routes');
const stockRoutes = require('./routes/stock_routes');
const supplierRoutes = require('./routes/supplier_routes');
const dashboardRoutes = require('./routes/dashboard_routes');
const orderRoutes = require('./routes/order_routes');
const staffRoutes = require('./routes/staff_routes');

  
// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
  })
  .catch((err) => {
    console.log('❌ MongoDB Connection Error:', err.message);
  });

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Warehouse Management API is running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Test DB route
app.get('/api/test-db', (req, res) => {
  res.json({ 
    message: 'Database connection is active',
    dbState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 🔹 Mount Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});