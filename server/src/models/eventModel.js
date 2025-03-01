const mongoose = require('mongoose');

const eventSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'server_start',
        'server_stop',
        'backup_create',
        'script_run',
        'user_login',
        'system_alert',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
eventSchema.index({ type: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ server: 1 });
eventSchema.index({ user: 1 });

module.exports = mongoose.model('Event', eventSchema); 