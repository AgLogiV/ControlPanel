const mongoose = require('mongoose');

const serverSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a server name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'starting', 'stopping', 'restarting', 'error'],
      default: 'offline',
    },
    ip: {
      type: String,
      required: [true, 'Please add an IP address'],
      trim: true,
    },
    port: {
      type: Number,
      required: [true, 'Please add a port number'],
    },
    type: {
      type: String,
      required: [true, 'Please add a server type'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stats: {
      cpu: {
        type: Number,
        default: 0,
      },
      memory: {
        type: Number,
        default: 0,
      },
      disk: {
        type: Number,
        default: 0,
      },
      uptime: {
        type: Number,
        default: 0,
      },
      players: {
        type: Number,
        default: 0,
      },
      maxPlayers: {
        type: Number,
        default: 0,
      },
    },
    version: {
      type: String,
      default: '',
    },
    lastBackup: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
serverSchema.index({ owner: 1 });
serverSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Server', serverSchema); 