const mongoose = require('mongoose');

const backupSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a backup name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'in_progress', 'failed'],
      default: 'in_progress',
    },
    size: {
      type: Number,
      default: 0,
    },
    path: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
backupSchema.index({ server: 1 });
backupSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Backup', backupSchema); 