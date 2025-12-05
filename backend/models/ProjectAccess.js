const mongoose = require('mongoose');

const projectAccessSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permission: {
      type: String,
      enum: ['read', 'read-write'],
      default: 'read',
      required: true,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index unique pour éviter les doublons
projectAccessSchema.index({ project: 1, user: 1 }, { unique: true });
projectAccessSchema.index({ user: 1 });
projectAccessSchema.index({ project: 1 });

module.exports = mongoose.model('ProjectAccess', projectAccessSchema);
