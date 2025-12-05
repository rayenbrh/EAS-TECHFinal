const Project = require('../models/Project');
const ProjectAccess = require('../models/ProjectAccess');

/**
 * Middleware pour vérifier l'accès à un projet
 * @param {String} requiredPermission - 'read' ou 'read-write'
 */
exports.checkProjectAccess = (requiredPermission = 'read') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id || req.body.project;
      
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'ID du projet requis',
        });
      }
      
      const project = await Project.findById(projectId);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Projet non trouvé',
        });
      }
      
      // Les admins ont toujours accès
      if (req.user.role === 'admin') {
        req.project = project;
        req.projectPermission = 'admin';
        return next();
      }
      
      // Vérifier si l'utilisateur est le propriétaire
      if (project.createdBy.toString() === req.user.id) {
        req.project = project;
        req.projectPermission = 'admin';
        return next();
      }
      
      // Vérifier les permissions via ProjectAccess
      const access = await ProjectAccess.findOne({
        project: projectId,
        user: req.user.id,
      });
      
      if (!access) {
        // Vérifier si le projet est public en lecture
        if (requiredPermission === 'read' && project.settings?.allowPublicRead) {
          req.project = project;
          req.projectPermission = 'read';
          return next();
        }
        
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à ce projet',
        });
      }
      
      // Vérifier le niveau de permission
      if (requiredPermission === 'read-write' && access.permission !== 'read-write') {
        return res.status(403).json({
          success: false,
          message: 'Permission insuffisante. Accès en écriture requis.',
        });
      }
      
      req.project = project;
      req.projectPermission = access.permission;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

/**
 * Middleware pour vérifier que l'utilisateur peut créer des documents dans un projet
 */
exports.checkProjectWriteAccess = exports.checkProjectAccess('read-write');

/**
 * Middleware pour vérifier que l'utilisateur peut lire les documents d'un projet
 */
exports.checkProjectReadAccess = exports.checkProjectAccess('read');
