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

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // MongoDB Connection with caching for serverless
  let cached = global.mongoose;

  if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
  }

  async function connectDB() {
    if (cached.conn) {
      console.log('Using cached MongoDB connection');
      return cached.conn;
    }

    if (!cached.promise) {
      const MONGODB_URI = process.env.MONGODB_URI;
      
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined');
      }

      const opts = {
        bufferCommands: false,
        bufferMaxEntries: 0,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        connectTimeoutMS: 10000,
      };

      console.log('Creating new MongoDB connection...');
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('✅ MongoDB Connected Successfully!');
        return mongoose;
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (e) {
      cached.promise = null;
      throw e;
    }

    return cached.conn;
  }

  // Connection middleware for all routes
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ 
        error: 'Database connection failed',
        details: error.message 
      });
    }
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

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message 
    });
  });

  // Export for Vercel serverless
  module.exports = app;

  // For local development
  if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
  }