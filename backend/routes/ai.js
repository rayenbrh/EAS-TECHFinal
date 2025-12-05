const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  generateAISummary,
  extractEntities,
  analyzeSentiment,
  generateAnalytics,
  compareDocuments,
  generateTags,
  generateCompleteAnalysis,
  extractTextFromDocument,
  checkAIService,
} = require('../services/aiService');
const Document = require('../models/Document');
const { checkProjectAccess } = require('../middleware/projectAuth');

router.use(protect);

// @route   GET /api/ai/health
// @desc    Vérifier l'état du service IA
// @access  Private
router.get('/health', async (req, res) => {
  try {
    const isAvailable = await checkAIService();
    res.json({
      success: true,
      available: isAvailable,
      service: process.env.AI_SERVICE_URL ? 'Service IA Local' : 'OpenRouter API',
      url: process.env.AI_SERVICE_URL || process.env.OPENROUTER_API_URL || 'Non configuré',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      available: false,
      message: error.message,
    });
  }
});

// @route   POST /api/ai/summarize
// @desc    Générer un résumé IA pour un document
// @access  Private
router.post('/summarize', async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId requis',
      });
    }

    const document = await Document.findById(documentId).populate('project');
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Vérifier l'accès au projet si le document appartient à un projet
    if (document.project) {
      const Project = require('../models/Project');
      const ProjectAccess = require('../models/ProjectAccess');
      
      if (req.user.role !== 'admin' && document.project.createdBy.toString() !== req.user.id) {
        const access = await ProjectAccess.findOne({
          project: document.project._id,
          user: req.user.id,
        });
        
        if (!access && !document.project.settings?.allowPublicRead) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce projet',
          });
        }
      }
    }

    // Générer le résumé
    const summary = await generateAISummary(documentId);
    
    // Mettre à jour le document (utiliser findByIdAndUpdate pour éviter les conflits de version)
    await Document.findByIdAndUpdate(
      documentId,
      {
        $set: {
          aiSummary: summary,
          status: 'ready',
        },
      },
      { new: true, runValidators: true }
    );
    
    // Notification via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('document:summary', {
        id: document._id,
        filename: document.filename,
        projectId: document.project?._id,
      });
    }
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('❌ [AI-ROUTE] Erreur génération résumé:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/ai/extract-text
// @desc    Extraire le texte d'un document
// @access  Private
router.post('/extract-text', async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId requis',
      });
    }

    const document = await Document.findById(documentId).populate('project');
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Vérifier l'accès au projet
    if (document.project) {
      const Project = require('../models/Project');
      const ProjectAccess = require('../models/ProjectAccess');
      
      if (req.user.role !== 'admin' && document.project.createdBy.toString() !== req.user.id) {
        const access = await ProjectAccess.findOne({
          project: document.project._id,
          user: req.user.id,
        });
        
        if (!access && !document.project.settings?.allowPublicRead) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce projet',
          });
        }
      }
    }

    const text = await extractTextFromDocument(documentId);
    
    res.json({
      success: true,
      data: { text },
    });
  } catch (error) {
    console.error('❌ [AI-ROUTE] Erreur extraction texte:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/ai/extract-entities
// @desc    Extraire les entités d'un document
// @access  Private
router.post('/extract-entities', async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId requis',
      });
    }

    const document = await Document.findById(documentId).populate('project');
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Vérifier l'accès au projet
    if (document.project) {
      const Project = require('../models/Project');
      const ProjectAccess = require('../models/ProjectAccess');
      
      if (req.user.role !== 'admin' && document.project.createdBy.toString() !== req.user.id) {
        const access = await ProjectAccess.findOne({
          project: document.project._id,
          user: req.user.id,
        });
        
        if (!access && !document.project.settings?.allowPublicRead) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce projet',
          });
        }
      }
    }

    const entities = await extractEntities(documentId);
    
    res.json({
      success: true,
      data: entities,
    });
  } catch (error) {
    console.error('❌ [AI-ROUTE] Erreur extraction entités:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/ai/analyze-sentiment
// @desc    Analyser le sentiment d'un document
// @access  Private
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId requis',
      });
    }

    const document = await Document.findById(documentId).populate('project');
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Vérifier l'accès au projet
    if (document.project) {
      const Project = require('../models/Project');
      const ProjectAccess = require('../models/ProjectAccess');
      
      if (req.user.role !== 'admin' && document.project.createdBy.toString() !== req.user.id) {
        const access = await ProjectAccess.findOne({
          project: document.project._id,
          user: req.user.id,
        });
        
        if (!access && !document.project.settings?.allowPublicRead) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce projet',
          });
        }
      }
    }

    const sentiment = await analyzeSentiment(documentId);
    
    res.json({
      success: true,
      data: sentiment,
    });
  } catch (error) {
    console.error('❌ [AI-ROUTE] Erreur analyse sentiment:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/ai/analytics
// @desc    Générer des analytics pour un document
// @access  Private
router.post('/analytics', async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId requis',
      });
    }

    const document = await Document.findById(documentId).populate('project');
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Vérifier l'accès au projet
    if (document.project) {
      const Project = require('../models/Project');
      const ProjectAccess = require('../models/ProjectAccess');
      
      if (req.user.role !== 'admin' && document.project.createdBy.toString() !== req.user.id) {
        const access = await ProjectAccess.findOne({
          project: document.project._id,
          user: req.user.id,
        });
        
        if (!access && !document.project.settings?.allowPublicRead) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce projet',
          });
        }
      }
    }

    const analytics = await generateAnalytics(documentId);
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('❌ [AI-ROUTE] Erreur génération analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/ai/complete-analysis
// @desc    Générer une analyse complète (résumé + entités + analytics)
// @access  Private
router.post('/complete-analysis', async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId requis',
      });
    }

    const document = await Document.findById(documentId).populate('project');
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Vérifier l'accès au projet
    if (document.project) {
      const Project = require('../models/Project');
      const ProjectAccess = require('../models/ProjectAccess');
      
      if (req.user.role !== 'admin' && document.project.createdBy.toString() !== req.user.id) {
        const access = await ProjectAccess.findOne({
          project: document.project._id,
          user: req.user.id,
        });
        
        if (!access && !document.project.settings?.allowPublicRead) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce projet',
          });
        }
      }
    }

    const analysis = await generateCompleteAnalysis(documentId);
    
    // Log pour déboguer
    console.log('📊 [AI-ROUTE] Analyse complète générée:');
    console.log('  - Résumé:', analysis.summary && Object.keys(analysis.summary).length > 0 ? '✅' : '❌');
    console.log('  - Entités:', analysis.entities && Object.keys(analysis.entities).length > 0 ? '✅' : '❌');
    if (analysis.entities) {
      console.log('    * Personnes:', analysis.entities.personnes?.length || 0);
      console.log('    * Organisations:', analysis.entities.organizations?.length || 0);
      console.log('    * Dates:', analysis.entities.dates?.length || 0);
      console.log('    * Lieux:', analysis.entities.locations?.length || 0);
    }
    console.log('  - Sentiment:', analysis.sentiment && Object.keys(analysis.sentiment).length > 0 ? '✅' : '❌');
    console.log('  - Analytics:', analysis.analytics && Object.keys(analysis.analytics).length > 0 ? '✅' : '❌');
    
    // Mettre à jour le document avec toutes les analyses
    // Utiliser findByIdAndUpdate pour éviter les conflits de version
    const updateData = {
      status: 'ready',
    };
    
    // Ajouter seulement les analyses qui ont du contenu
    if (analysis.summary && Object.keys(analysis.summary).length > 0) {
      updateData.aiSummary = analysis.summary;
    }
    // Toujours sauvegarder les entités même si elles sont vides (structure importante)
    if (analysis.entities) {
      updateData.aiEntities = {
        personnes: analysis.entities.personnes || [],
        organizations: analysis.entities.organizations || [],
        dates: analysis.entities.dates || [],
        locations: analysis.entities.locations || [],
        amounts: analysis.entities.amounts || [],
        keywords: analysis.entities.keywords || [],
        themes: analysis.entities.themes || [],
        extractedAt: analysis.entities.extractedAt || new Date(),
      };
    }
    if (analysis.sentiment && Object.keys(analysis.sentiment).length > 0) {
      updateData.aiSentiment = analysis.sentiment;
    }
    if (analysis.analytics && Object.keys(analysis.analytics).length > 0) {
      updateData.aiAnalytics = analysis.analytics;
    }
    
    console.log('💾 [AI-ROUTE] Mise à jour du document avec:', Object.keys(updateData));
    
    const updatedDoc = await Document.findByIdAndUpdate(
      documentId,
      {
        $set: updateData,
      },
      { new: true, runValidators: true }
    );
    
    console.log('✅ [AI-ROUTE] Document mis à jour avec succès');
    console.log('  - aiSummary sauvegardé:', updatedDoc.aiSummary ? '✅' : '❌');
    console.log('  - aiEntities sauvegardé:', updatedDoc.aiEntities ? '✅' : '❌');
    if (updatedDoc.aiEntities) {
      console.log('    * Personnes dans DB:', updatedDoc.aiEntities.personnes?.length || 0);
      console.log('    * Organisations dans DB:', updatedDoc.aiEntities.organizations?.length || 0);
    }
    
    // Notification via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('document:analysis_complete', {
        id: document._id,
        filename: document.filename,
        projectId: document.project?._id,
      });
    }
    
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('❌ [AI-ROUTE] Erreur analyse complète:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/ai/compare
// @desc    Comparer deux documents
// @access  Private
router.post('/compare', async (req, res) => {
  try {
    const { documentId1, documentId2 } = req.body;
    
    if (!documentId1 || !documentId2) {
      return res.status(400).json({
        success: false,
        message: 'documentId1 et documentId2 requis',
      });
    }

    const comparison = await compareDocuments(documentId1, documentId2);
    
    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('❌ [AI-ROUTE] Erreur comparaison:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/ai/generate-tags
// @desc    Générer des tags automatiques pour un document
// @access  Private
router.post('/generate-tags', async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentId requis',
      });
    }

    const document = await Document.findById(documentId).populate('project');
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }

    // Vérifier l'accès au projet (read-write requis pour modifier les tags)
    if (document.project) {
      const Project = require('../models/Project');
      const ProjectAccess = require('../models/ProjectAccess');
      
      if (req.user.role !== 'admin' && document.project.createdBy.toString() !== req.user.id) {
        const access = await ProjectAccess.findOne({
          project: document.project._id,
          user: req.user.id,
        });
        
        if (!access || access.permission !== 'read-write') {
          return res.status(403).json({
            success: false,
            message: 'Permission insuffisante. Accès en écriture requis.',
          });
        }
      }
    }

    const tags = await generateTags(documentId);
    
    // Mettre à jour les tags du document (utiliser findByIdAndUpdate pour éviter les conflits de version)
    const existingTags = new Set(document.tags || []);
    tags.forEach(tag => existingTags.add(tag));
    
    await Document.findByIdAndUpdate(
      documentId,
      {
        $set: {
          tags: Array.from(existingTags),
        },
      },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: { tags: Array.from(existingTags) },
    });
  } catch (error) {
    console.error('❌ [AI-ROUTE] Erreur génération tags:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/ai/project-analytics/:projectId
// @desc    Obtenir les analytics agrégées pour un projet
// @access  Private
router.get('/project-analytics/:projectId', checkProjectAccess('read'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const Document = require('../models/Document');
    
    const documents = await Document.find({ project: projectId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    // Calculer les statistiques
    const stats = {
      totalDocuments: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
      documentsWithAI: documents.filter(doc => doc.aiSummary).length,
      averageRating: 0,
      categories: {},
      tags: {},
      uploadsByMonth: {},
      topUploaders: {},
    };

    let totalRatings = 0;
    let ratingCount = 0;

    documents.forEach(doc => {
      // Catégories
      if (doc.aiSummary?.category) {
        stats.categories[doc.aiSummary.category] = (stats.categories[doc.aiSummary.category] || 0) + 1;
      }

      // Tags
      if (doc.tags && doc.tags.length > 0) {
        doc.tags.forEach(tag => {
          stats.tags[tag] = (stats.tags[tag] || 0) + 1;
        });
      }

      // Uploads par mois
      const month = new Date(doc.createdAt).toISOString().substring(0, 7);
      stats.uploadsByMonth[month] = (stats.uploadsByMonth[month] || 0) + 1;

      // Top uploaders
      if (doc.uploadedBy) {
        const uploaderId = doc.uploadedBy._id.toString();
        stats.topUploaders[uploaderId] = {
          name: doc.uploadedBy.name,
          email: doc.uploadedBy.email,
          count: (stats.topUploaders[uploaderId]?.count || 0) + 1,
        };
      }

      // Ratings
      if (doc.aiSummary?.rating) {
        totalRatings += doc.aiSummary.rating;
        ratingCount++;
      }
    });

    stats.averageRating = ratingCount > 0 ? (totalRatings / ratingCount).toFixed(2) : 0;
    stats.topUploaders = Object.values(stats.topUploaders)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ [AI-ROUTE] Erreur analytics projet:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
