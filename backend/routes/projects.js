const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectAccess = require('../models/ProjectAccess');
const Document = require('../models/Document');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { checkProjectAccess } = require('../middleware/projectAuth');

// Toutes les routes nécessitent une authentification
router.use(protect);

// @route   GET /api/projects
// @desc    Obtenir tous les projets (admin voit tout, user voit ses projets)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Les admins voient tous les projets, les autres voient seulement leurs projets
    if (req.user.role !== 'admin') {
      // Récupérer les projets où l'utilisateur a accès
      const userAccesses = await ProjectAccess.find({ user: req.user.id });
      const projectIds = userAccesses.map(access => access.project.toString());
      
      // Ajouter les projets créés par l'utilisateur
      const userProjects = await Project.find({ createdBy: req.user.id }).select('_id').lean();
      projectIds.push(...userProjects.map(p => p._id.toString()));
      
      // Ajouter les projets publics en lecture
      const publicProjects = await Project.find({ 
        isActive: true,
        'settings.allowPublicRead': true 
      }).select('_id').lean();
      projectIds.push(...publicProjects.map(p => p._id.toString()));
      
      // Si l'utilisateur n'a accès à aucun projet, retourner un tableau vide
      if (projectIds.length === 0) {
        return res.json({
          success: true,
          count: 0,
          data: [],
        });
      }
      
      // Supprimer les doublons et convertir en ObjectId
      const uniqueProjectIds = [...new Set(projectIds)].map(id => new mongoose.Types.ObjectId(id));
      query._id = { $in: uniqueProjectIds };
    }
    
    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Pour chaque projet, ajouter les informations d'accès de l'utilisateur
    const projectsWithAccess = await Promise.all(
      projects.map(async (project) => {
        const access = await ProjectAccess.findOne({
          project: project._id,
          user: req.user.id,
        });
        
        // Récupérer tous les accès au projet (pour les admins)
        const allAccesses = req.user.role === 'admin' 
          ? await ProjectAccess.find({ project: project._id })
              .populate('user', 'name email role')
              .populate('grantedBy', 'name email')
          : [];
        
        const projectObj = project.toObject();
        projectObj.userPermission = 
          project.createdBy._id.toString() === req.user.id 
            ? 'admin' 
            : access?.permission || null;
        projectObj.isOwner = project.createdBy._id.toString() === req.user.id;
        
        // Ajouter les accès pour les admins
        if (req.user.role === 'admin') {
          projectObj.accesses = allAccesses;
          projectObj.accessCount = allAccesses.length;
        } else {
          projectObj.accessCount = 0; // Les non-admins ne voient pas le nombre d'accès
        }
        
        // Compter les documents dans le projet
        const docCount = await Document.countDocuments({ project: project._id });
        projectObj.documentCount = docCount;
        
        return projectObj;
      })
    );
    
    res.json({
      success: true,
      count: projectsWithAccess.length,
      data: projectsWithAccess,
    });
  } catch (error) {
    console.error('❌ [PROJECTS] Erreur lors de la récupération des projets:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Obtenir un projet par ID
// @access  Private
router.get('/:id', checkProjectAccess('read'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }
    
    // Récupérer les accès au projet
    const accesses = await ProjectAccess.find({ project: project._id })
      .populate('user', 'name email role')
      .populate('grantedBy', 'name email');
    
    const projectObj = project.toObject();
    projectObj.accesses = accesses;
    
    // Compter les documents
    const docCount = await Document.countDocuments({ project: project._id });
    projectObj.documentCount = docCount;
    
    res.json({
      success: true,
      data: projectObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/projects
// @desc    Créer un nouveau projet (Admin uniquement)
// @access  Private/Admin
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    
    const project = await Project.create({
      name,
      description,
      createdBy: req.user.id,
      settings: settings || {},
    });
    
    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Modifier un projet (Admin ou propriétaire)
// @access  Private/Admin
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }
    
    const { name, description, settings, isActive } = req.body;
    
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (settings) project.settings = { ...project.settings, ...settings };
    if (isActive !== undefined) project.isActive = isActive;
    
    await project.save();
    
    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email');
    
    res.json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Supprimer un projet (Admin uniquement)
// @access  Private/Admin
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }
    
    // Supprimer tous les accès au projet
    await ProjectAccess.deleteMany({ project: project._id });
    
    // Supprimer tous les documents du projet
    await Document.deleteMany({ project: project._id });
    
    // Supprimer le projet
    await project.deleteOne();
    
    res.json({
      success: true,
      message: 'Projet supprimé avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/projects/:id/access
// @desc    Donner accès à un projet à un utilisateur (Admin uniquement)
// @access  Private/Admin
router.post('/:id/access', authorize('admin'), async (req, res) => {
  try {
    const { userId, permission } = req.body;
    
    if (!userId || !permission || !['read', 'read-write'].includes(permission)) {
      return res.status(400).json({
        success: false,
        message: 'userId et permission (read ou read-write) requis',
      });
    }
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }
    
    // Vérifier si l'accès existe déjà (utiliser findOneAndUpdate pour éviter les problèmes de version)
    let access = await ProjectAccess.findOneAndUpdate(
      {
        project: project._id,
        user: userId,
      },
      {
        project: project._id,
        user: userId,
        permission,
        grantedBy: req.user.id,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );
    
    console.log('✅ [PROJECTS] Accès créé/mis à jour:', {
      accessId: access._id,
      project: project._id.toString(),
      user: userId.toString(),
      permission,
    });
    
    // Vérifier que l'accès existe bien dans la base
    const verifyAccess = await ProjectAccess.findById(access._id);
    if (!verifyAccess) {
      console.error('❌ [PROJECTS] Erreur: L\'accès n\'a pas été créé correctement');
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'accès',
      });
    }
    
    // Vérifier qu'on peut le retrouver par project et user
    const verifyByQuery = await ProjectAccess.findOne({
      project: project._id,
      user: userId,
    });
    if (!verifyByQuery) {
      console.error('❌ [PROJECTS] Erreur: L\'accès n\'est pas retrouvable par query');
      return res.status(500).json({
        success: false,
        message: 'Erreur: L\'accès n\'a pas été correctement sauvegardé',
      });
    }
    
    // Récupérer tous les accès du projet pour retourner le nombre total
    const allAccesses = await ProjectAccess.find({ project: project._id })
      .populate('user', 'name email role')
      .populate('grantedBy', 'name email');
    
    const populatedAccess = await ProjectAccess.findById(access._id)
      .populate('user', 'name email role')
      .populate('grantedBy', 'name email')
      .populate('project', 'name');
    
    console.log('✅ [PROJECTS] Accès retourné:', {
      id: populatedAccess._id,
      user: populatedAccess.user?.email,
      permission: populatedAccess.permission,
      project: populatedAccess.project?.name,
      totalAccesses: allAccesses.length,
    });
    
    res.status(201).json({
      success: true,
      data: populatedAccess,
      totalAccesses: allAccesses.length,
      message: 'Accès accordé avec succès',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur a déjà accès à ce projet',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/projects/:id/access/:userId
// @desc    Retirer l'accès d'un utilisateur à un projet (Admin uniquement)
// @access  Private/Admin
router.delete('/:id/access/:userId', authorize('admin'), async (req, res) => {
  try {
    const access = await ProjectAccess.findOneAndDelete({
      project: req.params.id,
      user: req.params.userId,
    });
    
    if (!access) {
      return res.status(404).json({
        success: false,
        message: 'Accès non trouvé',
      });
    }
    
    res.json({
      success: true,
      message: 'Accès retiré avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/projects/:id/users
// @desc    Obtenir tous les utilisateurs ayant accès à un projet
// @access  Private/Admin
router.get('/:id/users', authorize('admin'), async (req, res) => {
  try {
    const accesses = await ProjectAccess.find({ project: req.params.id })
      .populate('user', 'name email role')
      .populate('grantedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: accesses.length,
      data: accesses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
