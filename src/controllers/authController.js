const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, username: user.username, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
};

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username },
        { email },
      ],
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });
    
    // Generate token
    const token = generateToken(user);
    
    logger.info(`New user registered: ${username}`);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    logger.info(`User logged in: ${user.username}`);
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.status(200).json({ user });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { username, email, firstName, lastName, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    // Check if updating password
    if (newPassword) {
      // Validate current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Update password
      user.password = newPassword;
    }
    
    // Update other fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    
    await user.save();
    
    logger.info(`User profile updated: ${user.username}`);
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      },
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
}; 