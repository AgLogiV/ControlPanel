const { Backup, Server } = require('../models');
const logger = require('../utils/logger');
const backupService = require('../services/backupService');
const path = require('path');
const fs = require('fs');

// Get all backups for a server
const getServerBackups = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    // Check if server exists and belongs to user
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    const backups = await Backup.findAll({
      where: {
        serverId,
      },
      order: [['createdAt', 'DESC']],
    });
    
    res.status(200).json({ backups });
  } catch (error) {
    logger.error(`Get server backups error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get backups' });
  }
};

// Create a new backup
const createBackup = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, isAutomatic = false } = req.body;
    
    // Check if server exists and belongs to user
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Create backup record in database
    const backup = await Backup.create({
      name,
      serverId,
      isAutomatic,
      status: 'in_progress',
      filePath: '',
      size: 0,
    });
    
    // Perform backup
    const backupResult = await backupService.createBackup(server, backup.id);
    
    // Update backup record with results
    await backup.update({
      filePath: backupResult.filePath,
      size: backupResult.size,
      status: 'completed',
    });
    
    logger.info(`Backup created: ${name} for server ${server.name} by user ${req.user.username}`);
    
    res.status(201).json({
      message: 'Backup created successfully',
      backup,
    });
  } catch (error) {
    logger.error(`Create backup error: ${error.message}`);
    
    // Update backup status to failed if it was created
    try {
      if (req.body.backupId) {
        await Backup.update(
          { status: 'failed' },
          { where: { id: req.body.backupId } }
        );
      }
    } catch (updateError) {
      logger.error(`Failed to update backup status: ${updateError.message}`);
    }
    
    res.status(500).json({ error: 'Failed to create backup' });
  }
};

// Delete a backup
const deleteBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    
    const backup = await Backup.findByPk(backupId);
    
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    
    // Check if server belongs to user
    const server = await Server.findOne({
      where: {
        id: backup.serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete backup file
    if (backup.filePath && fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }
    
    // Delete backup from database
    await backup.destroy();
    
    logger.info(`Backup deleted: ${backup.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Backup deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete backup error: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
};

// Restore a backup
const restoreBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    
    const backup = await Backup.findByPk(backupId);
    
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    
    // Check if server belongs to user
    const server = await Server.findOne({
      where: {
        id: backup.serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if server is running
    if (server.status === 'running') {
      return res.status(400).json({
        error: 'Server must be stopped before restoring a backup',
      });
    }
    
    // Restore backup
    await backupService.restoreBackup(server, backup);
    
    logger.info(`Backup restored: ${backup.name} to server ${server.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Backup restored successfully',
    });
  } catch (error) {
    logger.error(`Restore backup error: ${error.message}`);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
};

// Download a backup
const downloadBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    
    const backup = await Backup.findByPk(backupId);
    
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    
    // Check if server belongs to user
    const server = await Server.findOne({
      where: {
        id: backup.serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if backup file exists
    if (!backup.filePath || !fs.existsSync(backup.filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    
    // Send file
    res.download(backup.filePath, path.basename(backup.filePath));
  } catch (error) {
    logger.error(`Download backup error: ${error.message}`);
    res.status(500).json({ error: 'Failed to download backup' });
  }
};

module.exports = {
  getServerBackups,
  createBackup,
  deleteBackup,
  restoreBackup,
  downloadBackup,
}; 