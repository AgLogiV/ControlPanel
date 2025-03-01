const mongoose = require('mongoose');

// Import models
const User = require('./User');
const Server = require('./server');
const Script = require('./script');
const Backup = require('./backup');

// Export models
module.exports = {
  User,
  Server,
  Script,
  Backup
}; 