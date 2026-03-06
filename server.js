const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const authRoutes = require('./routes/auth_routes');
const categoryRoutes = require('./routes/category_routes');
const productRoutes = require('./routes/product_Routes');
const stockRoutes = require('./routes/stock_routes');
const supplierRoutes = require('./routes/supplier_routes');
const dashboardRoutes = require('./routes/dashboard_routes');
const orderRoutes = require('./routes/order_routes');
const staffRoutes = require('./routes/staff_routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log("MongoDB Connected");
})
.catch((err) => {
  console.log(err);
});

app.get('/', (req, res) => {
  res.json({
    message: "Warehouse Management API running"
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);

module.exports = app;