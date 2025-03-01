const express = require('express');
const {
  getBackups,
  getBackupById,
  createBackup,
  deleteBackup,
  restoreBackup,
} = require('../controllers/backupController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);

// Backup routes
router.route('/')
  .get(getBackups)
  .post(createBackup);

router.route('/:id')
  .get(getBackupById)
  .delete(deleteBackup);

// Backup actions
router.post('/:id/restore', restoreBackup);

module.exports = router; 