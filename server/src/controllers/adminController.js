const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Server = require('../models/serverModel');
const Event = require('../models/eventModel');
const os = require('os');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');

  res.json({
    success: true,
    count: users.length,
    data: users,
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json({
      success: true,
      data: user,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Create a new user
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user',
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    // If password is included, update it
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('Cannot delete your own account');
    }

    await user.remove();
    res.json({ success: true, message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Get system status
 * @route   GET /api/admin/system/status
 * @access  Private/Admin
 */
const getSystemStatus = asyncHandler(async (req, res) => {
  // Get CPU info
  const cpuInfo = {
    usage: Math.floor(Math.random() * 100), // Mock CPU usage
    cores: os.cpus().length,
    model: os.cpus()[0].model,
  };

  // Get memory info
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = Math.floor((usedMemory / totalMemory) * 100);

  const memoryInfo = {
    total: totalMemory,
    used: usedMemory,
    free: freeMemory,
    usage: memoryUsage,
  };

  // Mock disk info
  const diskInfo = {
    total: 1000000000000, // 1TB
    used: 350000000000, // 350GB
    free: 650000000000, // 650GB
    usage: 35, // 35%
  };

  // Mock network info
  const networkInfo = {
    in: Math.floor(Math.random() * 10000),
    out: Math.floor(Math.random() * 10000),
  };

  // Get server stats
  const servers = await Server.countDocuments();
  const activeServers = await Server.countDocuments({ status: 'online' });

  // Get user stats
  const users = await User.countDocuments();
  const activeUsers = await User.countDocuments({
    lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  // Get recent events
  const events = await Event.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name')
    .populate('server', 'name');

  res.json({
    success: true,
    data: {
      cpu: cpuInfo,
      memory: memoryInfo,
      disk: diskInfo,
      network: networkInfo,
      uptime: os.uptime(),
      servers: {
        total: servers,
        active: activeServers,
      },
      users: {
        total: users,
        active: activeUsers,
      },
      events: events,
    },
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSystemStatus,
}; 