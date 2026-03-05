const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/auth_controller');
const { protect } = require('../middleware/auth_middleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Private route
router.get('/me', protect, getMe);

module.exports = router;