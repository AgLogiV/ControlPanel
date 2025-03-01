const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('../utils/logger');

// Create backup directory if it doesn't exist
const ensureBackupDir = () => {
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

// Create a backup for a server
const createBackup = async (server, backupId) => {
  try {
    logger.info(`Creating backup for server ${server.id}`);
    
    // Ensure backup directory exists
    const backupDir = ensureBackupDir();
    
    // Create backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${server.name}-${timestamp}-${backupId}.tar.gz`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Get server directory
    const serverDir = path.join(process.cwd(), 'data', 'servers', server.id);
    
    // Create tar archive
    await execPromise(`tar -czf "${backupPath}" -C "${serverDir}" .`);
    
    // Get backup size
    const stats = fs.statSync(backupPath);
    const size = stats.size;
    
    logger.info(`Backup created for server ${server.id} at ${backupPath}`);
    
    return {
      filePath: backupPath,
      size,
    };
  } catch (error) {
    logger.error(`Error creating backup: ${error.message}`);
    throw error;
  }
};

// Restore a backup to a server
const restoreBackup = async (server, backup) => {
  try {
    logger.info(`Restoring backup ${backup.id} to server ${server.id}`);
    
    // Check if backup file exists
    if (!fs.existsSync(backup.filePath)) {
      throw new Error('Backup file not found');
    }
    
    // Get server directory
    const serverDir = path.join(process.cwd(), 'data', 'servers', server.id);
    
    // Create server directory if it doesn't exist
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    
    // Clear server directory
    await execPromise(`rm -rf "${serverDir}/"*`);
    
    // Extract backup to server directory
    await execPromise(`tar -xzf "${backup.filePath}" -C "${serverDir}"`);
    
    logger.info(`Backup ${backup.id} restored to server ${server.id}`);
    
    return true;
  } catch (error) {
    logger.error(`Error restoring backup: ${error.message}`);
    throw error;
  }
};

// Schedule backups for all servers
const scheduleBackups = async () => {
  try {
    logger.info('Scheduling backups for all servers');
    
    const { Server, Backup } = require('../models');
    
    // Get all servers with backup enabled
    const servers = await Server.findAll({
      where: {
        backupEnabled: true,
      },
    });
    
    logger.info(`Found ${servers.length} servers with backup enabled`);
    
    // Schedule backup for each server
    for (const server of servers) {
      try {
        // Create backup record
        const backup = await Backup.create({
          name: `Automatic backup - ${new Date().toISOString()}`,
          serverId: server.id,
          isAutomatic: true,
          status: 'in_progress',
          filePath: '',
          size: 0,
        });
        
        // Perform backup
        const backupResult = await createBackup(server, backup.id);
        
        // Update backup record
        await backup.update({
          filePath: backupResult.filePath,
          size: backupResult.size,
          status: 'completed',
        });
        
        logger.info(`Scheduled backup created for server ${server.id}`);
      } catch (error) {
        logger.error(`Error creating scheduled backup for server ${server.id}: ${error.message}`);
      }
    }
    
    logger.info('Scheduled backups completed');
  } catch (error) {
    logger.error(`Error scheduling backups: ${error.message}`);
  }
};

// Clean up old backups
const cleanupBackups = async (maxBackupsPerServer = 5) => {
  try {
    logger.info('Cleaning up old backups');
    
    const { Server, Backup } = require('../models');
    
    // Get all servers
    const servers = await Server.findAll();
    
    // Clean up backups for each server
    for (const server of servers) {
      try {
        // Get all backups for this server
        const backups = await Backup.findAll({
          where: {
            serverId: server.id,
          },
          order: [['createdAt', 'DESC']],
        });
        
        // Keep only the latest backups
        if (backups.length > maxBackupsPerServer) {
          const backupsToDelete = backups.slice(maxBackupsPerServer);
          
          for (const backup of backupsToDelete) {
            // Delete backup file
            if (backup.filePath && fs.existsSync(backup.filePath)) {
              fs.unlinkSync(backup.filePath);
            }
            
            // Delete backup from database
            await backup.destroy();
            
            logger.info(`Deleted old backup ${backup.id} for server ${server.id}`);
          }
        }
      } catch (error) {
        logger.error(`Error cleaning up backups for server ${server.id}: ${error.message}`);
      }
    }
    
    logger.info('Backup cleanup completed');
  } catch (error) {
    logger.error(`Error cleaning up backups: ${error.message}`);
  }
};

module.exports = {
  createBackup,
  restoreBackup,
  scheduleBackups,
  cleanupBackups,
}; 