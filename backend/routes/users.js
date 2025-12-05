const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(protect);

// @route   GET /api/users
// @desc    Obtenir tous les utilisateurs
// @access  Private/Admin
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/users/:id
// @desc    Obtenir un utilisateur par ID avec ses projets accessibles
// @access  Private/Admin
router.get('/:id', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }
    
    // Récupérer les projets accessibles par cet utilisateur
    const ProjectAccess = require('../models/ProjectAccess');
    const Project = require('../models/Project');
    
    const accesses = await ProjectAccess.find({ user: user._id })
      .populate('project', 'name description')
      .populate('grantedBy', 'name email');
    
    // Récupérer les projets créés par cet utilisateur
    const createdProjects = await Project.find({ createdBy: user._id });
    
    const userObj = user.toObject();
    userObj.projectAccesses = accesses;
    userObj.createdProjects = createdProjects;
    
    res.json({
      success: true,
      data: userObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/users
// @desc    Créer un nouvel utilisateur
// @access  Private/Admin
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const user = await User.create({
      name,
      email,
      password,
      role,
    });
    
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Mettre à jour un utilisateur
// @access  Private/Admin
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    const updateData = { name, email, role };
    if (password) {
      updateData.password = password;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Supprimer un utilisateur
// @access  Private/Admin
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }
    
    res.json({
      success: true,
      message: 'Utilisateur supprimé',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

