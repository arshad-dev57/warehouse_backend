// models/Product.js

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  barcode: {
    number: {  // barcode number
      type: String,
      sparse: true,
      trim: true
    },
    image: {   // barcode image URL
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v); // URL validation
        },
        message: 'Invalid barcode image URL'
      }
    }
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  categoryName: {
    type: String,
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: String,
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Price cannot be negative']
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  minimumStock: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  maximumStock: {
    type: Number,
    required: true,
    default: 100,
    min: 0
  },
  location: {
    type: String,
    required: true,
    default: 'A-1-B1',
    match: [/^[A-Z]-\d+-[A-Z]\d+$/, 'Location must be in format A-1-B1']
  },
  imageUrls: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid image URL'
    }
  }],
  description: {
    type: String,
    maxlength: 500
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for profit
ProductSchema.virtual('profit').get(function() {
  return this.sellingPrice - this.costPrice;
});

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.costPrice * 100).toFixed(1);
});

ProductSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minimumStock) return 'low_stock';
  if (this.currentStock >= this.maximumStock) return 'overstock';
  return 'in_stock';
});

// Index for search
ProductSchema.index({ name: 'text', sku: 'text', 'barcode.number': 'text' });

module.exports = mongoose.model('Product', ProductSchema);  