const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Server = require('../models/Server');
const Script = require('../models/Script');
const logger = require('../utils/logger');

// Authenticate middleware - verifies the JWT token and attaches the user to the request
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

// Check if user is the owner of the server or an admin
const isServerOwnerOrAdmin = async (req, res, next) => {
  try {
    const serverId = req.params.serverId;
    const server = await Server.findById(serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if user is admin or server owner
    if (req.user.isAdmin || server.userId.toString() === req.user._id.toString()) {
      req.server = server; // Attach server to request for convenience
      return next();
    }
    
    return res.status(403).json({ error: 'Not authorized to access this server' });
  } catch (error) {
    logger.error(`Server authorization error: ${error.message}`);
    return res.status(500).json({ error: 'Server authorization error' });
  }
};

// Check if user is the owner of the script or an admin
const isScriptOwnerOrAdmin = async (req, res, next) => {
  try {
    const scriptId = req.params.scriptId;
    const script = await Script.findById(scriptId);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Check if user is admin or script owner
    if (req.user.isAdmin || script.userId.toString() === req.user._id.toString()) {
      req.script = script; // Attach script to request for convenience
      return next();
    }
    
    return res.status(403).json({ error: 'Not authorized to access this script' });
  } catch (error) {
    logger.error(`Script authorization error: ${error.message}`);
    return res.status(500).json({ error: 'Script authorization error' });
  }
};

module.exports = {
  authenticate,
  isAdmin,
  isServerOwnerOrAdmin,
  isScriptOwnerOrAdmin
}; 