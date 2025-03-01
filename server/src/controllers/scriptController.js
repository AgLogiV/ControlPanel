const asyncHandler = require('express-async-handler');
const Script = require('../models/scriptModel');
const Server = require('../models/serverModel');
const Event = require('../models/eventModel');

/**
 * @desc    Get all scripts for current user
 * @route   GET /api/scripts
 * @access  Private
 */
const getScripts = asyncHandler(async (req, res) => {
  const scripts = await Script.find({ owner: req.user._id });

  res.json({
    success: true,
    count: scripts.length,
    data: scripts,
  });
});

/**
 * @desc    Get script by ID
 * @route   GET /api/scripts/:id
 * @access  Private
 */
const getScriptById = asyncHandler(async (req, res) => {
  const script = await Script.findById(req.params.id);

  if (!script) {
    res.status(404);
    throw new Error('Script not found');
  }

  // Check if user owns the script or is admin
  if (
    script.owner.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to access this script');
  }

  res.json({
    success: true,
    data: script,
  });
});

/**
 * @desc    Create a new script
 * @route   POST /api/scripts
 * @access  Private
 */
const createScript = asyncHandler(async (req, res) => {
  const { name, description, type, content } = req.body;

  const script = await Script.create({
    name,
    description,
    type,
    content,
    owner: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: script,
  });
});

/**
 * @desc    Update script
 * @route   PUT /api/scripts/:id
 * @access  Private
 */
const updateScript = asyncHandler(async (req, res) => {
  const script = await Script.findById(req.params.id);

  if (!script) {
    res.status(404);
    throw new Error('Script not found');
  }

  // Check if user owns the script or is admin
  if (
    script.owner.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this script');
  }

  const updatedScript = await Script.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedScript,
  });
});

/**
 * @desc    Delete script
 * @route   DELETE /api/scripts/:id
 * @access  Private
 */
const deleteScript = asyncHandler(async (req, res) => {
  const script = await Script.findById(req.params.id);

  if (!script) {
    res.status(404);
    throw new Error('Script not found');
  }

  // Check if user owns the script or is admin
  if (
    script.owner.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this script');
  }

  await script.remove();

  res.json({
    success: true,
    message: 'Script removed',
  });
});

/**
 * @desc    Run script on a server
 * @route   POST /api/scripts/:id/run
 * @access  Private
 */
const runScript = asyncHandler(async (req, res) => {
  const script = await Script.findById(req.params.id);
  const { serverId, params } = req.body;

  if (!script) {
    res.status(404);
    throw new Error('Script not found');
  }

  // Check if user owns the script or is admin
  if (
    script.owner.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to run this script');
  }

  // If serverId is provided, check if server exists and user has access
  let server = null;
  if (serverId) {
    server = await Server.findById(serverId);

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
      throw new Error('Not authorized to run scripts on this server');
    }

    // Check if server is online
    if (server.status !== 'online') {
      res.status(400);
      throw new Error('Server must be online to run scripts');
    }
  }

  // Simulate script execution (would be replaced with actual script execution logic)
  const startTime = new Date();
  
  // Mock execution delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000; // Duration in seconds
  
  // Mock output
  const output = `Script executed successfully.\nType: ${script.type}\nParams: ${JSON.stringify(params || {})}\nDuration: ${duration}s`;
  
  // Create run record
  const runData = {
    server: serverId,
    status: 'success',
    output,
    startTime,
    endTime,
    duration,
  };
  
  // Add run to script
  script.runs.unshift(runData);
  await script.save();
  
  // Create event
  await Event.create({
    type: 'script_run',
    message: `Script ${script.name} executed on ${server ? server.name : 'local system'}`,
    server: serverId,
    user: req.user._id,
    metadata: {
      scriptId: script._id,
      duration,
      status: 'success',
    },
  });

  res.json({
    success: true,
    data: {
      script: {
        _id: script._id,
        name: script.name,
      },
      server: server ? {
        _id: server._id,
        name: server.name,
      } : null,
      status: 'success',
      output,
      startTime,
      endTime,
      duration,
    },
  });
});

module.exports = {
  getScripts,
  getScriptById,
  createScript,
  updateScript,
  deleteScript,
  runScript,
}; 