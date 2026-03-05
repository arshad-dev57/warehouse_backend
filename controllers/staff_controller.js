// controllers/staffController.js

const User = require('../models/user');
const bcrypt = require('bcryptjs');

// @desc    Get all staff users
// @route   GET /api/staff
// @access  Private (Admin only)
const getStaff = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    console.log("===== GET STAFF =====");
    console.log("Role:", role);
    console.log("Status:", status);
    console.log("Search:", search);
    console.log("Page:", page);

    // Build filter
    const filter = {};
    if (role && role !== 'all') {
      filter.role = role;
    }
    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const staff = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await User.countDocuments(filter);

    // Get counts by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const managerCount = await User.countDocuments({ role: 'manager' });
    const staffCount = await User.countDocuments({ role: 'staff' });
    const activeCount = await User.countDocuments({ isActive: true });
    const inactiveCount = await User.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      data: staff,
      counts: {
        total,
        admin: adminCount,
        manager: managerCount,
        staff: staffCount,
        active: activeCount,
        inactive: inactiveCount
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single staff member
// @route   GET /api/staff/:id
// @access  Private (Admin only)
const getStaffById = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'name email');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: staff
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create staff member
// @route   POST /api/staff
// @access  Private (Admin only)
const createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      country
    } = req.body;

    console.log("===== CREATE STAFF =====");
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Role:", role);

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password and role'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create staff
    const staff = await User.create({
      name,
      email,
      password,
      phone,
      role,
      country,
      createdBy: req.user.id,
      isActive: true
    });

    staff.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staff
    });

  } catch (error) {
    console.error('Create staff error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate email'
      });
    }

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

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (Admin only)
const updateStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      isActive,
      country
    } = req.body;

    console.log("===== UPDATE STAFF =====");
    console.log("ID:", req.params.id);
    console.log("Name:", name);
    console.log("Role:", role);

    let staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check email uniqueness if updating
    if (email && email !== staff.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    staff = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        role,
        isActive,
        country
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    });

  } catch (error) {
    console.error('Update staff error:', error);
    
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

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private (Admin only)
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Prevent deleting yourself
    if (staff.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete - just mark as inactive
    staff.isActive = false;
    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Staff member deactivated successfully'
    });

  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle staff status
// @route   PATCH /api/staff/:id/toggle-status
// @access  Private (Admin only)
const toggleStaffStatus = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    staff.isActive = !staff.isActive;
    await staff.save();

    res.status(200).json({
      success: true,
      message: `Staff ${staff.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: staff.isActive }
    });

  } catch (error) {
    console.error('Toggle staff status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus
};