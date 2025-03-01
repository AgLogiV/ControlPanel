const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, userSchemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Register a new user
router.post('/register', validate(userSchemas.register), authController.register);

// Login user
router.post('/login', validate(userSchemas.login), authController.login);

// Get current user profile
router.get('/profile', authenticate, authController.getProfile);

// Update user profile
router.put('/profile', authenticate, validate(userSchemas.update), authController.updateProfile);

module.exports = router; 