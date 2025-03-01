const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Backup = require('../models/backupModel');
const Server = require('../models/serverModel');
const Event = require('../models/eventModel');

/**
 * @desc    Get all backups
 * @route   GET /api/backups
 * @access  Private
 */
const getBackups = asyncHandler(async (req, res) => {
  const backups = await Backup.find({ createdBy: req.user._id })
    .populate('server', 'name status')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: backups.length,
    data: backups,
  });
});

/**
 * @desc    Get backup by ID
 * @route   GET /api/backups/:id
 * @access  Private
 */
const getBackupById = asyncHandler(async (req, res) => {
  const backup = await Backup.findById(req.params.id)
    .populate('server', 'name status')
    .populate('createdBy', 'name');

  if (!backup) {
    res.status(404);
    throw new Error('Backup not found');
  }

  // Check if user owns the backup or is admin
  if (
    backup.createdBy._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to access this backup');
  }

  res.json({
    success: true,
    data: backup,
  });
});

/**
 * @desc    Create a new backup
 * @route   POST /api/backups
 * @access  Private
 */
const createBackup = asyncHandler(async (req, res) => {
  const { name, description, serverId } = req.body;

  // Check if server exists
  const server = await Server.findById(serverId);

  if (!server) {
    res.status(404);
    throw new Error('Server not found');
  }

  // Check if user owns the server or is admin
  if (
    server.owner.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to create backups for this server');
  }

  // Create backup directory if it doesn't exist
  const backupDir = path.join(__dirname, '../../data/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Generate backup path
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = path.join(backupDir, `${server.name}-${timestamp}.zip`);

  // Create backup
  const backup = await Backup.create({
    name,
    description,
    server: serverId,
    status: 'in_progress',
    size: 0,
    path: backupPath,
    createdBy: req.user._id,
  });

  // Create event
  await Event.create({
    type: 'backup_create',
    message: `Backup ${name} started for server ${server.name}`,
    server: serverId,
    user: req.user._id,
  });

  // Simulate backup process (would be replaced with actual backup logic)
  setTimeout(async () => {
    // Mock backup size (random between 10MB and 1GB)
    const size = Math.floor(Math.random() * (1024 * 1024 * 1024 - 10 * 1024 * 1024) + 10 * 1024 * 1024);
    
    // Update backup status and size
    backup.status = 'completed';
    backup.size = size;
    await backup.save();

    // Update server's lastBackup field
    server.lastBackup = new Date();
    await server.save();

    // Create completion event
    await Event.create({
      type: 'backup_create',
      message: `Backup ${name} completed for server ${server.name}`,
      server: serverId,
      user: req.user._id,
      metadata: {
        backupId: backup._id,
        size,
      },
    });
  }, 5000);

  res.status(201).json({
    success: true,
    data: backup,
  });
});

/**
 * @desc    Delete backup
 * @route   DELETE /api/backups/:id
 * @access  Private
 */
const deleteBackup = asyncHandler(async (req, res) => {
  const backup = await Backup.findById(req.params.id);

  if (!backup) {
    res.status(404);
    throw new Error('Backup not found');
  }

  // Check if user owns the backup or is admin
  if (
    backup.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this backup');
  }

  // Delete backup file if it exists
  if (fs.existsSync(backup.path)) {
    fs.unlinkSync(backup.path);
  }

  await backup.remove();

  res.json({
    success: true,
    message: 'Backup removed',
  });
});

/**
 * @desc    Restore backup
 * @route   POST /api/backups/:id/restore
 * @access  Private
 */
const restoreBackup = asyncHandler(async (req, res) => {
  const backup = await Backup.findById(req.params.id);

  if (!backup) {
    res.status(404);
    throw new Error('Backup not found');
  }

  // Check if user owns the backup or is admin
  if (
    backup.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to restore this backup');
  }

  // Check if backup file exists
  if (!fs.existsSync(backup.path)) {
    res.status(404);
    throw new Error('Backup file not found');
  }

  // Get server
  const server = await Server.findById(backup.server);

  if (!server) {
    res.status(404);
    throw new Error('Server not found');
  }

  // Check if server is offline
  if (server.status !== 'offline') {
    res.status(400);
    throw new Error('Server must be offline to restore a backup');
  }

  // Simulate restore process (would be replaced with actual restore logic)
  setTimeout(async () => {
    // Create event
    await Event.create({
      type: 'backup_create',
      message: `Backup ${backup.name} restored to server ${server.name}`,
      server: server._id,
      user: req.user._id,
      metadata: {
        backupId: backup._id,
      },
    });
  }, 8000);

  res.json({
    success: true,
    message: 'Backup restoration started',
    data: backup,
  });
});

module.exports = {
  getBackups,
  getBackupById,
  createBackup,
  deleteBackup,
  restoreBackup,
}; 