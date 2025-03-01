const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/scriptController');
const { validate, scriptSchemas } = require('../middleware/validation');
const { authenticate, isScriptOwnerOrAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all scripts for the current user
router.get('/', scriptController.getAllScripts);

// Generate a new script
router.post('/generate', validate(scriptSchemas.generate), scriptController.generateScript);

// Get a single script by ID
router.get('/:scriptId', isScriptOwnerOrAdmin, scriptController.getScriptById);

// Update a script
router.put('/:scriptId', isScriptOwnerOrAdmin, validate(scriptSchemas.update), scriptController.updateScript);

// Delete a script
router.delete('/:scriptId', isScriptOwnerOrAdmin, scriptController.deleteScript);

// Get template scripts for a game type
router.get('/templates/:gameType', scriptController.getTemplateScripts);

// Apply a script to a server
router.post('/:scriptId/apply/:serverId', isScriptOwnerOrAdmin, scriptController.applyScriptToServer);

module.exports = router; 