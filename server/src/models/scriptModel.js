const mongoose = require('mongoose');

const scriptSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a script name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['bash', 'python', 'nodejs', 'powershell'],
      required: [true, 'Please add a script type'],
    },
    content: {
      type: String,
      required: [true, 'Please add script content'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    runs: [
      {
        server: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Server',
        },
        status: {
          type: String,
          enum: ['success', 'error'],
          required: true,
        },
        output: {
          type: String,
          default: '',
        },
        startTime: {
          type: Date,
          default: Date.now,
        },
        endTime: {
          type: Date,
          default: null,
        },
        duration: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
scriptSchema.index({ owner: 1 });
scriptSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Script', scriptSchema); 