const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const { validate, serverSchemas } = require('../middleware/validation');
const { authenticate, isServerOwnerOrAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all servers for the current user
router.get('/', serverController.getAllServers);

// Create a new server
router.post('/', validate(serverSchemas.create), serverController.createServer);

// Get a single server by ID
router.get('/:serverId', isServerOwnerOrAdmin, serverController.getServerById);

// Update a server
router.put('/:serverId', isServerOwnerOrAdmin, validate(serverSchemas.update), serverController.updateServer);

// Delete a server
router.delete('/:serverId', isServerOwnerOrAdmin, serverController.deleteServer);

// Start a server
router.post('/:serverId/start', isServerOwnerOrAdmin, serverController.startServer);

// Stop a server
router.post('/:serverId/stop', isServerOwnerOrAdmin, serverController.stopServer);

// Restart a server
router.post('/:serverId/restart', isServerOwnerOrAdmin, serverController.restartServer);

// Get server stats
router.get('/:serverId/stats', isServerOwnerOrAdmin, serverController.getServerStats);

module.exports = router; 