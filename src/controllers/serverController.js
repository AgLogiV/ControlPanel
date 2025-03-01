const { Server } = require('../models');
const logger = require('../utils/logger');
const dockerService = require('../services/dockerService');

// Get all servers for the current user
const getAllServers = async (req, res) => {
  try {
    const servers = await Server.findAll({
      where: {
        userId: req.user.id,
      },
      order: [['createdAt', 'DESC']],
    });
    
    res.status(200).json({ servers });
  } catch (error) {
    logger.error(`Get all servers error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get servers' });
  }
};

// Get a single server by ID
const getServerById = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    res.status(200).json({ server });
  } catch (error) {
    logger.error(`Get server by ID error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get server' });
  }
};

// Create a new server
const createServer = async (req, res) => {
  try {
    const {
      name,
      gameType,
      port,
      memory,
      cpu,
      disk,
      autoRestart,
      backupEnabled,
      backupSchedule,
    } = req.body;
    
    // Create server in database
    const server = await Server.create({
      name,
      gameType,
      port,
      memory,
      cpu,
      disk,
      autoRestart,
      backupEnabled,
      backupSchedule,
      userId: req.user.id,
      status: 'stopped',
    });
    
    logger.info(`Server created: ${name} by user ${req.user.username}`);
    
    res.status(201).json({
      message: 'Server created successfully',
      server,
    });
  } catch (error) {
    logger.error(`Create server error: ${error.message}`);
    res.status(500).json({ error: 'Failed to create server' });
  }
};

// Update a server
const updateServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const {
      name,
      port,
      memory,
      cpu,
      disk,
      autoRestart,
      backupEnabled,
      backupSchedule,
    } = req.body;
    
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if server is running
    if (server.status === 'running') {
      return res.status(400).json({
        error: 'Server must be stopped before updating',
      });
    }
    
    // Update server
    await server.update({
      name: name || server.name,
      port: port || server.port,
      memory: memory || server.memory,
      cpu: cpu || server.cpu,
      disk: disk || server.disk,
      autoRestart: autoRestart !== undefined ? autoRestart : server.autoRestart,
      backupEnabled: backupEnabled !== undefined ? backupEnabled : server.backupEnabled,
      backupSchedule: backupSchedule || server.backupSchedule,
    });
    
    logger.info(`Server updated: ${server.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Server updated successfully',
      server,
    });
  } catch (error) {
    logger.error(`Update server error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update server' });
  }
};

// Delete a server
const deleteServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if server is running
    if (server.status === 'running') {
      // Stop the server first
      await dockerService.stopContainer(server.containerId);
    }
    
    // Delete container if it exists
    if (server.containerId) {
      await dockerService.removeContainer(server.containerId);
    }
    
    // Delete server from database
    await server.destroy();
    
    logger.info(`Server deleted: ${server.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Server deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete server error: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete server' });
  }
};

// Start a server
const startServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if server is already running
    if (server.status === 'running') {
      return res.status(400).json({
        error: 'Server is already running',
      });
    }
    
    // Update server status
    await server.update({
      status: 'starting',
    });
    
    // Start the server container
    const containerId = await dockerService.startServer(server);
    
    // Update server with container ID and status
    await server.update({
      containerId,
      status: 'running',
      lastStarted: new Date(),
    });
    
    logger.info(`Server started: ${server.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Server started successfully',
      server,
    });
  } catch (error) {
    logger.error(`Start server error: ${error.message}`);
    
    // Update server status to error if something went wrong
    try {
      const server = await Server.findOne({
        where: {
          id: req.params.serverId,
          userId: req.user.id,
        },
      });
      
      if (server) {
        await server.update({
          status: 'error',
        });
      }
    } catch (updateError) {
      logger.error(`Failed to update server status: ${updateError.message}`);
    }
    
    res.status(500).json({ error: 'Failed to start server' });
  }
};

// Stop a server
const stopServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if server is already stopped
    if (server.status === 'stopped') {
      return res.status(400).json({
        error: 'Server is already stopped',
      });
    }
    
    // Update server status
    await server.update({
      status: 'stopping',
    });
    
    // Stop the server container
    await dockerService.stopContainer(server.containerId);
    
    // Update server status
    await server.update({
      status: 'stopped',
      lastStopped: new Date(),
    });
    
    logger.info(`Server stopped: ${server.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Server stopped successfully',
      server,
    });
  } catch (error) {
    logger.error(`Stop server error: ${error.message}`);
    
    // Update server status to error if something went wrong
    try {
      const server = await Server.findOne({
        where: {
          id: req.params.serverId,
          userId: req.user.id,
        },
      });
      
      if (server) {
        await server.update({
          status: 'error',
        });
      }
    } catch (updateError) {
      logger.error(`Failed to update server status: ${updateError.message}`);
    }
    
    res.status(500).json({ error: 'Failed to stop server' });
  }
};

// Restart a server
const restartServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Update server status
    await server.update({
      status: 'stopping',
    });
    
    // Stop the server container if it's running
    if (server.containerId) {
      await dockerService.stopContainer(server.containerId);
    }
    
    // Update server status
    await server.update({
      status: 'starting',
    });
    
    // Start the server container
    const containerId = await dockerService.startServer(server);
    
    // Update server with container ID and status
    await server.update({
      containerId,
      status: 'running',
      lastStarted: new Date(),
    });
    
    logger.info(`Server restarted: ${server.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Server restarted successfully',
      server,
    });
  } catch (error) {
    logger.error(`Restart server error: ${error.message}`);
    
    // Update server status to error if something went wrong
    try {
      const server = await Server.findOne({
        where: {
          id: req.params.serverId,
          userId: req.user.id,
        },
      });
      
      if (server) {
        await server.update({
          status: 'error',
        });
      }
    } catch (updateError) {
      logger.error(`Failed to update server status: ${updateError.message}`);
    }
    
    res.status(500).json({ error: 'Failed to restart server' });
  }
};

// Get server stats
const getServerStats = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const server = await Server.findOne({
      where: {
        id: serverId,
        userId: req.user.id,
      },
    });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    // Check if server is running
    if (server.status !== 'running') {
      return res.status(400).json({
        error: 'Server is not running',
      });
    }
    
    // Get server stats
    const stats = await dockerService.getContainerStats(server.containerId);
    
    res.status(200).json({
      stats,
    });
  } catch (error) {
    logger.error(`Get server stats error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get server stats' });
  }
};

module.exports = {
  getAllServers,
  getServerById,
  createServer,
  updateServer,
  deleteServer,
  startServer,
  stopServer,
  restartServer,
  getServerStats,
}; 