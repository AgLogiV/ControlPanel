const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticate, isServerOwnerOrAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all backups for a server
router.get('/server/:serverId', isServerOwnerOrAdmin, backupController.getServerBackups);

// Create a backup for a server
router.post('/server/:serverId', isServerOwnerOrAdmin, backupController.createBackup);

// Delete a backup
router.delete('/:backupId', backupController.deleteBackup);

// Restore a backup to a server
router.post('/:backupId/restore/:serverId', isServerOwnerOrAdmin, backupController.restoreBackup);

// Download a backup
router.get('/:backupId/download', backupController.downloadBackup);

module.exports = router; 