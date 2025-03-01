const { Script, Server } = require('../models');
const logger = require('../utils/logger');
const aiService = require('../services/aiService');

// Get all scripts for the current user
const getAllScripts = async (req, res) => {
  try {
    const scripts = await Script.findAll({
      where: {
        userId: req.user.id,
      },
      order: [['createdAt', 'DESC']],
    });
    
    res.status(200).json({ scripts });
  } catch (error) {
    logger.error(`Get all scripts error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get scripts' });
  }
};

// Get a single script by ID
const getScriptById = async (req, res) => {
  try {
    const { scriptId } = req.params;
    
    const script = await Script.findOne({
      where: {
        id: scriptId,
        userId: req.user.id,
      },
    });
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    res.status(200).json({ script });
  } catch (error) {
    logger.error(`Get script by ID error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get script' });
  }
};

// Generate a new script using AI
const generateScript = async (req, res) => {
  try {
    const {
      gameType,
      scriptType,
      name,
      language,
      parameters,
      serverId,
      isTemplate,
    } = req.body;
    
    // Check if server exists if serverId is provided
    if (serverId) {
      const server = await Server.findOne({
        where: {
          id: serverId,
          userId: req.user.id,
        },
      });
      
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }
    }
    
    // Generate script content using AI
    const content = await aiService.generateScript(
      gameType,
      scriptType,
      parameters,
      language
    );
    
    // Create script in database
    const script = await Script.create({
      name,
      type: scriptType,
      content,
      language,
      gameType,
      parameters,
      serverId: serverId || null,
      isTemplate,
      userId: req.user.id,
    });
    
    logger.info(`Script generated: ${name} by user ${req.user.username}`);
    
    res.status(201).json({
      message: 'Script generated successfully',
      script,
    });
  } catch (error) {
    logger.error(`Generate script error: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate script' });
  }
};

// Update a script
const updateScript = async (req, res) => {
  try {
    const { scriptId } = req.params;
    const {
      name,
      content,
      language,
      parameters,
      isTemplate,
    } = req.body;
    
    const script = await Script.findOne({
      where: {
        id: scriptId,
        userId: req.user.id,
      },
    });
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Update script
    await script.update({
      name: name || script.name,
      content: content || script.content,
      language: language || script.language,
      parameters: parameters || script.parameters,
      isTemplate: isTemplate !== undefined ? isTemplate : script.isTemplate,
    });
    
    logger.info(`Script updated: ${script.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Script updated successfully',
      script,
    });
  } catch (error) {
    logger.error(`Update script error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update script' });
  }
};

// Delete a script
const deleteScript = async (req, res) => {
  try {
    const { scriptId } = req.params;
    
    const script = await Script.findOne({
      where: {
        id: scriptId,
        userId: req.user.id,
      },
    });
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Delete script from database
    await script.destroy();
    
    logger.info(`Script deleted: ${script.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Script deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete script error: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete script' });
  }
};

// Get template scripts for a game type
const getTemplateScripts = async (req, res) => {
  try {
    const { gameType } = req.params;
    
    const scripts = await Script.findAll({
      where: {
        gameType,
        isTemplate: true,
      },
      order: [['createdAt', 'DESC']],
    });
    
    res.status(200).json({ scripts });
  } catch (error) {
    logger.error(`Get template scripts error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get template scripts' });
  }
};

// Apply a script to a server
const applyScriptToServer = async (req, res) => {
  try {
    const { scriptId, serverId } = req.params;
    
    const script = await Script.findOne({
      where: {
        id: scriptId,
        userId: req.user.id,
      },
    });
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
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
        error: 'Server must be stopped before applying a script',
      });
    }
    
    // Create a copy of the script for this server
    const serverScript = await Script.create({
      name: `${server.name} - ${script.name}`,
      type: script.type,
      content: script.content,
      language: script.language,
      gameType: script.gameType,
      parameters: script.parameters,
      serverId: server.id,
      isTemplate: false,
      userId: req.user.id,
    });
    
    logger.info(`Script applied to server: ${script.name} to ${server.name} by user ${req.user.username}`);
    
    res.status(200).json({
      message: 'Script applied to server successfully',
      script: serverScript,
    });
  } catch (error) {
    logger.error(`Apply script to server error: ${error.message}`);
    res.status(500).json({ error: 'Failed to apply script to server' });
  }
};

module.exports = {
  getAllScripts,
  getScriptById,
  generateScript,
  updateScript,
  deleteScript,
  getTemplateScripts,
  applyScriptToServer,
}; 