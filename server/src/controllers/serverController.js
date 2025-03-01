const asyncHandler = require('express-async-handler');
const Server = require('../models/serverModel');
const Event = require('../models/eventModel');

/**
 * @desc    Get all servers for current user
 * @route   GET /api/servers
 * @access  Private
 */
const getServers = asyncHandler(async (req, res) => {
  const servers = await Server.find({ owner: req.user._id });

  res.json({
    success: true,
    count: servers.length,
    data: servers,
  });
});

/**
 * @desc    Get server by ID
 * @route   GET /api/servers/:id
 * @access  Private
 */
const getServerById = asyncHandler(async (req, res) => {
  const server = await Server.findById(req.params.id);

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
    throw new Error('Not authorized to access this server');
  }

  res.json({
    success: true,
    data: server,
  });
});

/**
 * @desc    Create a new server
 * @route   POST /api/servers
 * @access  Private
 */
const createServer = asyncHandler(async (req, res) => {
  const { name, description, ip, port, type } = req.body;

  const server = await Server.create({
    name,
    description,
    ip,
    port,
    type,
    owner: req.user._id,
  });

  // Create event
  await Event.create({
    type: 'server_start',
    message: `Server ${server.name} created`,
    server: server._id,
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: server,
  });
});

/**
 * @desc    Update server
 * @route   PUT /api/servers/:id
 * @access  Private
 */
const updateServer = asyncHandler(async (req, res) => {
  const server = await Server.findById(req.params.id);

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
    throw new Error('Not authorized to update this server');
  }

  const updatedServer = await Server.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedServer,
  });
});

/**
 * @desc    Delete server
 * @route   DELETE /api/servers/:id
 * @access  Private
 */
const deleteServer = asyncHandler(async (req, res) => {
  const server = await Server.findById(req.params.id);

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
    throw new Error('Not authorized to delete this server');
  }

  await server.remove();

  // Create event
  await Event.create({
    type: 'server_stop',
    message: `Server ${server.name} deleted`,
    user: req.user._id,
  });

  res.json({
    success: true,
    message: 'Server removed',
  });
});

/**
 * @desc    Start server
 * @route   POST /api/servers/:id/start
 * @access  Private
 */
const startServer = asyncHandler(async (req, res) => {
  const server = await Server.findById(req.params.id);

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
    throw new Error('Not authorized to start this server');
  }

  // Check if server is already online
  if (server.status === 'online') {
    res.status(400);
    throw new Error('Server is already online');
  }

  // Update server status
  server.status = 'starting';
  await server.save();

  // Simulate server start (would be replaced with actual server start logic)
  setTimeout(async () => {
    server.status = 'online';
    await server.save();

    // Create event
    await Event.create({
      type: 'server_start',
      message: `Server ${server.name} started`,
      server: server._id,
      user: req.user._id,
    });
  }, 5000);

  res.json({
    success: true,
    message: 'Server is starting',
    data: server,
  });
});

/**
 * @desc    Stop server
 * @route   POST /api/servers/:id/stop
 * @access  Private
 */
const stopServer = asyncHandler(async (req, res) => {
  const server = await Server.findById(req.params.id);

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
    throw new Error('Not authorized to stop this server');
  }

  // Check if server is already offline
  if (server.status === 'offline') {
    res.status(400);
    throw new Error('Server is already offline');
  }

  // Update server status
  server.status = 'stopping';
  await server.save();

  // Simulate server stop (would be replaced with actual server stop logic)
  setTimeout(async () => {
    server.status = 'offline';
    await server.save();

    // Create event
    await Event.create({
      type: 'server_stop',
      message: `Server ${server.name} stopped`,
      server: server._id,
      user: req.user._id,
    });
  }, 5000);

  res.json({
    success: true,
    message: 'Server is stopping',
    data: server,
  });
});

/**
 * @desc    Restart server
 * @route   POST /api/servers/:id/restart
 * @access  Private
 */
const restartServer = asyncHandler(async (req, res) => {
  const server = await Server.findById(req.params.id);

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
    throw new Error('Not authorized to restart this server');
  }

  // Check if server is offline
  if (server.status === 'offline') {
    res.status(400);
    throw new Error('Server is offline. Please start it first');
  }

  // Update server status
  server.status = 'restarting';
  await server.save();

  // Simulate server restart (would be replaced with actual server restart logic)
  setTimeout(async () => {
    server.status = 'online';
    await server.save();

    // Create event
    await Event.create({
      type: 'server_start',
      message: `Server ${server.name} restarted`,
      server: server._id,
      user: req.user._id,
    });
  }, 8000);

  res.json({
    success: true,
    message: 'Server is restarting',
    data: server,
  });
});

module.exports = {
  getServers,
  getServerById,
  createServer,
  updateServer,
  deleteServer,
  startServer,
  stopServer,
  restartServer,
}; 