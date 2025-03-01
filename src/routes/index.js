const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const serverRoutes = require('./server');
const scriptRoutes = require('./script');
const backupRoutes = require('./backup');

// Mount routes
router.use('/auth', authRoutes);
router.use('/servers', serverRoutes);
router.use('/scripts', scriptRoutes);
router.use('/backups', backupRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

module.exports = router; 