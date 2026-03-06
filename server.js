const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const authRoutes      = require('./routes/auth_routes');
const categoryRoutes  = require('./routes/category_routes');
const productRoutes   = require('./routes/product_routes');
const stockRoutes     = require('./routes/stock_routes');
const supplierRoutes  = require('./routes/supplier_routes');
const dashboardRoutes = require('./routes/dashboard_routes');
const orderRoutes     = require('./routes/order_routes');
const staffRoutes     = require('./routes/staff_routes');

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Warehouse API is running ✅' });
});

// Mount Routes
app.use('/api/auth',            authRoutes);
app.use('/api/categories',      categoryRoutes);
app.use('/api/products',        productRoutes);
app.use('/api/stock',           stockRoutes);
app.use('/api/suppliers',       supplierRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/orders',          orderRoutes);
app.use('/api/staff',           staffRoutes);

// 404 handler — Express v5 fix
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
