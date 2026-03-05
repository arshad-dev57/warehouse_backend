// controllers/productController.js

const Product = require('../models/Product');
const Category = require('../models/Category');
const Cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose'); // 👈 YEH IMPORT KARO

const getProducts = async (req, res) => {
  try {
    const {
      search,
      categoryId,
      stockStatus,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Stock status filter
    if (stockStatus) {
      const products = await Product.find(filter);
      const filteredIds = products
        .filter(p => p.stockStatus === stockStatus)
        .map(p => p._id);
      filter._id = { $in: filteredIds };
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('supplierId', 'name email phone');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
// controllers/product_controller.js

const createProduct = async (req, res) => {
    console.log("===== CREATE PRODUCT API HIT =====");
    console.log("Body:", req.body);
    console.log("Files:", req.files);
    console.log("User:", req.user?.id);

  try {
    const {
      name,
      sku,
      barcode,
      categoryId,
      sellingPrice,
      costPrice,
      currentStock,
      minimumStock,
      maximumStock,
      location,
      description,
      expiryDate
    } = req.body;

    // Validation
    if (!name || !sku || !categoryId || !sellingPrice || !costPrice || !currentStock) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // ✅ FIX: Check if categoryId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Check if SKU exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    // Get category name
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get image URLs from uploaded files
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => file.path); // Cloudinary URLs
    }

    // Create product
    const product = await Product.create({
      name,
      sku,
      barcode,
      categoryId,
      categoryName: category.name,
      sellingPrice: parseFloat(sellingPrice),
      costPrice: parseFloat(costPrice),
      currentStock: parseInt(currentStock),
      minimumStock: parseInt(minimumStock || 5),
      maximumStock: parseInt(maximumStock || 100),
      location: location || 'A-1-B1',
      imageUrls,
      description,
      expiryDate: expiryDate || null,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    // Clean up uploaded images if product creation fails
    if (req.files && req.files.length > 0 && typeof cloudinary !== 'undefined') {
      for (const file of req.files) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (cloudError) {
          console.error('Cloudinary cleanup error:', cloudError);
        }
      }
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate SKU or barcode'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin/Manager)
const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check SKU uniqueness if updating
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku: req.body.sku });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }
    }

    // Update category name if category changes
    if (req.body.categoryId && req.body.categoryId !== product.categoryId.toString()) {
      const category = await Category.findById(req.body.categoryId);
      if (category) {
        req.body.categoryName = category.name;
      }
    }

    // Handle new images
    let imageUrls = [...product.imageUrls];
    
    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => file.path);
      imageUrls = [...imageUrls, ...newImageUrls];
    }
    
    // Remove specific images if requested
    if (req.body.removeImages) {
      const imagesToRemove = JSON.parse(req.body.removeImages);
      
      // Delete from Cloudinary
      for (const imageUrl of imagesToRemove) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`warehouse/products/${publicId}`);
      }
      
      // Remove from array
      imageUrls = imageUrls.filter(url => !imagesToRemove.includes(url));
    }

    req.body.imageUrls = imageUrls;

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update product error:', error);
    
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

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images from Cloudinary
    if (product.imageUrls && product.imageUrls.length > 0) {
      for (const imageUrl of product.imageUrls) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`warehouse/products/${publicId}`);
      }
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$currentStock', '$minimumStock'] }
    }).populate('categoryId', 'name');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
};