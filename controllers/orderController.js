// controllers/orderController.js

const Order = require('../models/Order');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Activity = require('../models/Activity');


// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    console.log("===== GET ORDERS =====");
    console.log("Status:", status);
    console.log("Search:", search);
    console.log("Page:", page);

    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      discount,
      notes
    } = req.body;

    console.log("===== CREATE ORDER =====");
    console.log("Customer:", customerName);
    console.log("Items:", items?.length);

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item'
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Get product details
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      // Check stock
      if (product.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.currentStock}`
        });
      }

      const itemTotal = product.sellingPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        price: product.sellingPrice,
        total: itemTotal
      });

      // Update product stock
      product.currentStock -= item.quantity;
      await product.save();

      // Create stock movement
      await StockMovement.create({
        productId: product._id,
        productName: product.name,
        type: 'stock_out',
        quantity: item.quantity,
        previousStock: product.currentStock + item.quantity,
        newStock: product.currentStock,
        reason: 'sale',
        reference: `Order for ${customerName || 'Walk-in Customer'}`,
        createdBy: req.user.id
      });
    }

    const discountAmount = discount || 0;
    const total = subtotal - discountAmount;

    // Create order
    const order = await Order.create({
      customerName,
      customerPhone,
      customerAddress,
      items: orderItems,
      subtotal,
      discount: discountAmount,
      total,
      notes,
      createdBy: req.user.id
    });

    // Create activity
    await Activity.create({
      user: req.user.id,
      userName: req.user.name,
      action: 'created new order',
      actionType: 'order',
      details: `Order ${order.orderNumber} created with ${items.length} items`
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('Create order error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    console.log("===== UPDATE ORDER STATUS =====");
    console.log("Order ID:", id);
    console.log("New Status:", status);

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status
    order.status = status;
    
    if (status === 'completed') {
      order.completedAt = new Date();
    }

    await order.save();

    // Create activity
    await Activity.create({
      user: req.user.id,
      userName: req.user.name,
      action: `updated order status to ${status}`,
      actionType: 'update',
      details: `Order ${order.orderNumber} marked as ${status}`
    });

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get orders count by status
// @route   GET /api/orders/counts
// @access  Private
const getOrdersCount = async (req, res) => {
  try {
    const counts = {
      pending: await Order.countDocuments({ status: 'pending' }),
      processing: await Order.countDocuments({ status: 'processing' }),
      completed: await Order.countDocuments({ status: 'completed' }),
      cancelled: await Order.countDocuments({ status: 'cancelled' })
    };

    res.status(200).json({
      success: true,
      data: counts
    });

  } catch (error) {
    console.error('Get orders count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrdersCount
};