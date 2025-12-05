const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du projet est requis'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      allowPublicRead: {
        type: Boolean,
        default: false,
      },
      allowPublicWrite: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index pour la recherche
projectSchema.index({ name: 'text', description: 'text' });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ isActive: 1 });

module.exports = mongoose.model('Project', projectSchema);
