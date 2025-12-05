const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const Document = require('../models/Document');
const { protect, authorize } = require('../middleware/auth');
const { generateAISummary, generateCompleteAnalysis } = require('../services/aiService');
const { uploadToMayan, searchMayanDocuments } = require('../services/mayanService');
const { checkProjectAccess, checkProjectWriteAccess } = require('../middleware/projectAuth');
const Project = require('../models/Project');

// Configuration de Multer pour l'upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

// Toutes les routes nécessitent une authentification
router.use(protect);

// @route   GET /api/documents
// @desc    Obtenir tous les documents (filtrés par projet si spécifié)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { search, tags, project } = req.query;
    
    let query = {};
    
    // Filtrer par projet si spécifié
    if (project) {
      // Vérifier l'accès au projet
      const projectObj = await Project.findById(project);
      if (!projectObj) {
        return res.status(404).json({
          success: false,
          message: 'Projet non trouvé',
        });
      }
      
      // Vérifier les permissions
      if (req.user.role !== 'admin' && projectObj.createdBy.toString() !== req.user.id) {
        const ProjectAccess = require('../models/ProjectAccess');
        const access = await ProjectAccess.findOne({
          project: project,
          user: req.user.id,
        });
        
        if (!access && !projectObj.settings?.allowPublicRead) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce projet',
          });
        }
      }
      
      query.project = project;
    } else {
      // Si pas de projet spécifié, inclure tous les documents accessibles
      if (req.user.role !== 'admin') {
        const ProjectAccess = require('../models/ProjectAccess');
        const userAccesses = await ProjectAccess.find({ user: req.user.id });
        const accessibleProjectIds = userAccesses.map(access => access.project);
        
        // Ajouter les projets créés par l'utilisateur
        const userProjects = await Project.find({ createdBy: req.user.id }).select('_id');
        accessibleProjectIds.push(...userProjects.map(p => p._id));
        
        // Ajouter les projets publics
        const publicProjects = await Project.find({ 'settings.allowPublicRead': true }).select('_id');
        accessibleProjectIds.push(...publicProjects.map(p => p._id));
        
        // Inclure les documents des projets accessibles OU les documents sans projet créés par l'utilisateur
        query.$or = [
          { project: { $in: accessibleProjectIds } },
          { project: null, uploadedBy: req.user.id },
        ];
      }
      // Pour les admins, pas de filtre sur le projet (ils voient tout)
    }
    
    // Filtrer par rôle
    if (req.user.role === 'guest') {
      query.status = 'ready';
    }
    
    // Recherche textuelle
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filtrer par tags
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    
    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('project', 'name description')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/documents/:id
// @desc    Obtenir un document par ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('project', 'name description');
    
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
      
      const project = await Project.findById(document.project);
      
      if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user.id) {
        const access = await ProjectAccess.findOne({
          project: document.project,
          user: req.user.id,
        });
        
        if (!access && !project.settings?.allowPublicRead) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé à ce projet',
          });
        }
      }
    } else {
      // Ancien système de permissions pour les documents sans projet
      if (
        req.user.role === 'user' &&
        document.uploadedBy._id.toString() !== req.user.id &&
        document.status !== 'ready'
      ) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        });
      }
    }
    
    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/documents/upload
// @desc    Télécharger un document vers le système de gestion documentaire dans un projet
// @access  Private/Admin/User
router.post('/upload', authorize('admin', 'user'), upload.single('file'), async (req, res) => {
  try {
    console.log('\n📤 [DOCUMENTS] Début de l\'upload de document');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Utilisateur:', req.user?.email || req.user?.id);
    console.log('📁 Fichier reçu:', req.file ? '✅ Oui' : '❌ Non');
    
    if (!req.file) {
      console.error('❌ [DOCUMENTS] Aucun fichier fourni dans la requête');
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni',
      });
    }
    
    console.log('📄 Informations du fichier:');
    console.log('   - Nom:', req.file.originalname);
    console.log('   - Taille:', (req.file.size / 1024).toFixed(2), 'KB');
    console.log('   - Type MIME:', req.file.mimetype);
    console.log('   - Tags:', req.body.tags || 'Aucun');
    console.log('   - Projet:', req.body.project || '❌ NON SPÉCIFIÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Vérifier que le projet est spécifié
    if (!req.body.project) {
      return res.status(400).json({
        success: false,
        message: 'Le projet est requis pour uploader un document',
      });
    }
    
    // Vérifier l'accès au projet et les permissions d'écriture
    const project = await Project.findById(req.body.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }
    
    // Vérifier les permissions
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user.id) {
      const ProjectAccess = require('../models/ProjectAccess');
      const access = await ProjectAccess.findOne({
        project: req.body.project,
        user: req.user.id,
      });
      
      if (!access || access.permission !== 'read-write') {
        return res.status(403).json({
          success: false,
          message: 'Permission insuffisante. Accès en écriture requis pour ce projet.',
        });
      }
    }
    
    // Upload vers Mayan EDMS
    console.log('🔄 [DOCUMENTS] Upload vers Mayan EDMS...');
    let mayanResponse;
    let mayanId;
    
    try {
      mayanResponse = await uploadToMayan(req.file);
      console.log('✅ [DOCUMENTS] Upload Mayan EDMS réussi');
      // Mayan peut retourner l'ID sous différentes clés
      mayanId = mayanResponse.id || mayanResponse.uuid || mayanResponse._id || mayanResponse.pk;
      console.log('   - Mayan ID:', mayanId);
    } catch (mayanError) {
      console.error('❌ [DOCUMENTS] Erreur upload Mayan EDMS:', mayanError.message);
      
      // Si Mayan EDMS n'est pas configuré ou non disponible, créer quand même le document en local
      if (mayanError.code === 'MAYAN_NOT_CONFIGURED' || mayanError.code === 'ECONNREFUSED') {
        console.log('⚠️  [DOCUMENTS] Mayan EDMS non disponible - Création du document en local uniquement');
        mayanId = `local-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      } else {
        // Pour d'autres erreurs, on peut quand même continuer avec un ID local
        console.log('⚠️  [DOCUMENTS] Erreur Mayan EDMS - Création du document en local uniquement');
        mayanId = `local-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      }
    }
    
    // Parser les tags
    let tags = [];
    try {
      if (req.body.tags) {
        tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      }
    } catch (parseError) {
      console.warn('⚠️  [DOCUMENTS] Erreur parsing tags, utilisation de tags vides');
      tags = [];
    }
    
    // Créer l'enregistrement dans MongoDB
    console.log('💾 [DOCUMENTS] Création de l\'enregistrement dans MongoDB...');
    const document = await Document.create({
      filename: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      mayanId: mayanId,
      tags: tags,
      uploadedBy: req.user.id,
      project: req.body.project,
      status: 'processing',
    });
    
    console.log('✅ [DOCUMENTS] Document créé dans MongoDB');
    console.log('   - Document ID:', document._id);
    console.log('   - Mayan ID:', document.mayanId);
    
    // Notification en temps réel
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('document:uploaded', {
          id: document._id,
          filename: document.filename,
          uploadedBy: req.user.name,
        });
        console.log('📢 [DOCUMENTS] Notification WebSocket envoyée');
      }
    } catch (ioError) {
      console.warn('⚠️  [DOCUMENTS] Erreur notification WebSocket:', ioError.message);
    }
    
    // Générer le résumé IA en arrière-plan (optionnel, peut être fait manuellement)
    // Désactivé par défaut pour éviter les coûts API inutiles
    // L'utilisateur peut déclencher l'analyse manuellement depuis l'interface
    if (process.env.AUTO_GENERATE_AI_SUMMARY === 'true') {
      console.log('🤖 [DOCUMENTS] Génération automatique du résumé IA en arrière-plan...');
      generateAISummary(document._id, req.file.buffer)
        .then(async (summary) => {
          console.log('✅ [DOCUMENTS] Résumé IA généré avec succès');
          document.aiSummary = summary;
          document.status = 'ready';
          await document.save();
          
          // Notification du résumé généré
          try {
            const io = req.app.get('io');
            if (io) {
              io.to(req.user.id).emit('document:summary', {
                id: document._id,
                filename: document.filename,
                projectId: document.project?._id,
              });
            }
          } catch (ioError) {
            console.warn('⚠️  [DOCUMENTS] Erreur notification résumé IA:', ioError.message);
          }
        })
        .catch((error) => {
          console.error('❌ [DOCUMENTS] Erreur génération résumé IA:', error.message);
          document.status = 'ready';
          document.save();
        });
    } else {
      // Marquer comme prêt sans génération automatique
      document.status = 'ready';
      await document.save();
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [DOCUMENTS] Upload terminé avec succès\n');
    
    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('\n❌ [DOCUMENTS] Erreur lors de l\'upload:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'upload du document',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// @route   POST /api/documents/search
// @desc    Rechercher des documents dans Mayan EDMS et MongoDB
// @access  Private
router.post('/search', async (req, res) => {
  try {
    const { query, tags } = req.body;
    
    // Recherche dans MongoDB
    let mongoQuery = {};
    
    if (query) {
      mongoQuery.$or = [
        { filename: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ];
    }
    
    if (tags && Array.isArray(tags)) {
      mongoQuery.tags = { $in: tags };
    }
    
    // Filtrer par rôle
    if (req.user.role === 'guest') {
      mongoQuery.status = 'ready';
    } else if (req.user.role === 'user') {
      mongoQuery.$or = [
        { uploadedBy: req.user.id },
        { status: 'ready' },
      ];
    }
    
    const mongoResults = await Document.find(mongoQuery)
      .populate('uploadedBy', 'name email')
      .populate('project', 'name description')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Recherche dans Mayan EDMS si une requête est fournie
    let mayanResults = [];
    if (query) {
      try {
        mayanResults = await searchMayanDocuments(query);
        // Mapper les résultats Mayan avec les documents MongoDB
        const mayanIds = mayanResults.map(doc => doc.id?.toString());
        if (mayanIds.length > 0) {
          const mayanDocs = await Document.find({ mayanId: { $in: mayanIds } })
            .populate('uploadedBy', 'name email');
          // Fusionner les résultats (éviter les doublons)
          const existingIds = new Set(mongoResults.map(doc => doc.mayanId));
          const newDocs = mayanDocs.filter(doc => !existingIds.has(doc.mayanId));
          mongoResults.push(...newDocs);
        }
      } catch (mayanError) {
        console.warn('Erreur recherche Mayan:', mayanError.message);
        // Continuer avec les résultats MongoDB uniquement
      }
    }
    
    res.json({
      success: true,
      count: mongoResults.length,
      data: mongoResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Supprimer un document (Admin ou utilisateur avec permission read-write sur le projet)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('project');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }
    
    // Vérifier les permissions
    if (req.user.role !== 'admin') {
      if (document.project) {
        // Vérifier l'accès au projet
        if (document.project.createdBy.toString() !== req.user.id) {
          const ProjectAccess = require('../models/ProjectAccess');
          const access = await ProjectAccess.findOne({
            project: document.project._id,
            user: req.user.id,
          });
          
          if (!access || access.permission !== 'read-write') {
            return res.status(403).json({
              success: false,
              message: 'Permission insuffisante. Accès en écriture requis pour supprimer des documents.',
            });
          }
        }
      } else {
        // Ancien système : seul le propriétaire peut supprimer
        if (document.uploadedBy.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Accès non autorisé',
          });
        }
      }
    }
    
    // Supprimer de Mayan EDMS
    try {
      await axios.delete(
        `${process.env.MAYAN_API_URL}/documents/${document.mayanId}/`,
        {
          auth: {
            username: process.env.MAYAN_USERNAME,
            password: process.env.MAYAN_PASSWORD,
          },
        }
      );
    } catch (mayanError) {
      console.error('Erreur suppression Mayan:', mayanError.message);
    }
    
    // Supprimer de MongoDB
    await document.deleteOne();
    
    res.json({
      success: true,
      message: 'Document supprimé',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/documents/:id/download
// @desc    Télécharger un document depuis Mayan EDMS
// @access  Private
router.get('/:id/download', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }
    
    // Vérifier les permissions
    if (
      req.user.role === 'user' &&
      document.uploadedBy.toString() !== req.user.id &&
      document.status !== 'ready'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }
    
    // Télécharger depuis Mayan EDMS
    const { downloadFromMayan } = require('../services/mayanService');
    const fileBuffer = await downloadFromMayan(document.mayanId);
    
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/documents/:id/rating
// @desc    Noter le résumé IA d'un document
// @access  Private
router.put('/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être entre 0 et 5',
      });
    }
    
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { 'aiSummary.rating': rating },
      { new: true }
    );
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé',
      });
    }
    
    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

