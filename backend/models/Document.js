const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mayanId: {
      type: String,
      required: true,
      unique: true,
    },
    tags: [{
      type: String,
    }],
    metadata: {
      type: Map,
      of: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false, // Temporairement non requis pour migration
    },
    aiSummary: {
      summary: String,
      keyPoints: [String],
      category: String,
      language: String,
      generatedAt: Date,
      rating: {
        type: Number,
        min: 0,
        max: 5,
      },
    },
    aiEntities: {
      personnes: [String],
      organizations: [String],
      dates: [String],
      locations: [String],
      amounts: [String],
      keywords: [String],
      themes: [String],
      extractedAt: Date,
    },
    aiSentiment: {
      sentiment: String,
      sentiment_score: Number,
      ton: String,
      confidence_level: Number,
      emotions: [String],
      summary: String,
    },
    aiAnalytics: {
      complexity: String,
      word_count_estimate: Number,
      paragraph_count_estimate: Number,
      document_type: String,
      sector: String,
      recommendations: [String],
      risks: [String],
      opportunities: [String],
      next_steps: [String],
      insights: String,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'error'],
      default: 'processing',
    },
  },
  {
    timestamps: true,
  }
);

// Index pour la recherche
documentSchema.index({ filename: 'text', tags: 'text' });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ project: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);

