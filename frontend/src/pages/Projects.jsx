import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Folder as FolderIcon,
  People as PeopleIcon,
  Description as DocumentIcon,
  Visibility as ViewIcon,
  Edit as EditAccessIcon,
  PersonAdd as AddUserIcon,
  Assessment as AnalyticsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const Projects = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [accessFormData, setAccessFormData] = useState({
    userId: '',
    permission: 'read',
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchProjects();
    if (hasRole('admin')) {
      fetchUsers();
    }
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      console.error('Détails de l\'erreur:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        enqueueSnackbar('Vous devez être connecté pour voir les projets', { variant: 'warning' });
      } else if (error.response?.status === 403) {
        enqueueSnackbar('Accès non autorisé', { variant: 'error' });
      } else {
        enqueueSnackbar('Erreur lors du chargement des projets', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const handleOpenDialog = (project = null) => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
      });
      setSelectedProject(project);
    } else {
      setFormData({
        name: '',
        description: '',
      });
      setSelectedProject(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProject(null);
    setFormData({
      name: '',
      description: '',
    });
  };

  const handleSaveProject = async () => {
    try {
      if (selectedProject) {
        await axios.put(`/api/projects/${selectedProject._id}`, formData);
        enqueueSnackbar('Projet modifié avec succès', { variant: 'success' });
      } else {
        await axios.post('/api/projects', formData);
        enqueueSnackbar('Projet créé avec succès', { variant: 'success' });
      }
      fetchProjects();
      handleCloseDialog();
    } catch (error) {
      enqueueSnackbar('Erreur lors de la sauvegarde', { variant: 'error' });
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Tous les documents seront également supprimés.')) {
      try {
        await axios.delete(`/api/projects/${projectId}`);
        enqueueSnackbar('Projet supprimé', { variant: 'success' });
        fetchProjects();
      } catch (error) {
        enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
      }
    }
  };

  const handleOpenAccessDialog = async (project) => {
    try {
      // Recharger le projet avec les accès à jour
      const response = await axios.get(`/api/projects/${project._id}`);
      setSelectedProject(response.data.data);
      setAccessFormData({
        userId: '',
        permission: 'read',
      });
      setAccessDialogOpen(true);
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      enqueueSnackbar('Erreur lors du chargement des accès', { variant: 'error' });
    }
  };

  const handleCloseAccessDialog = () => {
    setAccessDialogOpen(false);
    setSelectedProject(null);
  };

  const handleGrantAccess = async () => {
    if (!accessFormData.userId) {
      enqueueSnackbar('Veuillez sélectionner un utilisateur', { variant: 'warning' });
      return;
    }
    
    try {
      const response = await axios.post(`/api/projects/${selectedProject._id}/access`, accessFormData);
      enqueueSnackbar(response.data.message || 'Accès accordé avec succès', { variant: 'success' });
      
      // Réinitialiser le formulaire
      setAccessFormData({
        userId: '',
        permission: 'read',
      });
      
      // Recharger le projet avec les accès à jour (IMPORTANT: après l'ajout)
      const projectResponse = await axios.get(`/api/projects/${selectedProject._id}`);
      setSelectedProject(projectResponse.data.data);
      
      // Recharger les projets pour mettre à jour la liste (avec les nouveaux compteurs)
      await fetchProjects();
      
      // Recharger aussi les utilisateurs pour avoir les données à jour
      await fetchUsers();
      
      // Ne pas fermer le dialog pour voir la mise à jour immédiate
    } catch (error) {
      console.error('Erreur lors de l\'attribution de l\'accès:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Erreur lors de l\'attribution de l\'accès', 
        { variant: 'error' }
      );
    }
  };

  const handleMenuOpen = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {hasRole('admin') ? 'Gestion des Projets' : 'Mes Projets'}
        </Typography>
        {hasRole('admin') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Créer un projet
          </Button>
        )}
      </Box>

      {!hasRole('admin') ? (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 }
                }}
                onClick={() => navigate(`/projects/${project._id}/documents`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FolderIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{project.name}</Typography>
                      <Chip 
                        label={project.userPermission === 'admin' ? 'Propriétaire' : project.userPermission} 
                        size="small" 
                        color={project.userPermission === 'admin' ? 'primary' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  {project.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DocumentIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {project.documentCount || 0} documents
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h6">{project.name}</Typography>
                  </Box>
                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, project)}>
                    <MoreIcon />
                  </IconButton>
                </Box>
                
                {project.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {project.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DocumentIcon fontSize="small" color="action" />
                    <Typography variant="caption">
                      {project.documentCount || 0} documents
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="caption">
                      {project.accessCount || project.accesses?.length || 0} accès
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          ))}
        </Grid>
      )}

      {/* Menu contextuel */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { navigate(`/projects/${selectedProject?._id}/documents`); handleMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Voir les documents</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleOpenAccessDialog(selectedProject); handleMenuClose(); }}>
          <ListItemIcon>
            <AddUserIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Gérer les accès</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleOpenDialog(selectedProject); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleDeleteProject(selectedProject?._id); handleMenuClose(); }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog création/modification projet */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProject ? 'Modifier le projet' : 'Créer un nouveau projet'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Nom du projet"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSaveProject} variant="contained">
            {selectedProject ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog gestion des accès */}
      <Dialog open={accessDialogOpen} onClose={handleCloseAccessDialog} maxWidth="md" fullWidth>
        <DialogTitle>Gérer les accès - {selectedProject?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Section: Ajouter un accès */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Accorder un accès
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  select
                  label="Utilisateur"
                  value={accessFormData.userId}
                  onChange={(e) => setAccessFormData({ ...accessFormData, userId: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users
                    .filter(u => u._id !== user.id && u.role !== 'admin')
                    .map((usr) => (
                      <option key={usr._id} value={usr._id}>
                        {usr.name} ({usr.email})
                      </option>
                    ))}
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Permission"
                  value={accessFormData.permission}
                  onChange={(e) => setAccessFormData({ ...accessFormData, permission: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                  required
                >
                  <option value="read">Lecture seule</option>
                  <option value="read-write">Lecture et écriture</option>
                </TextField>
                <Button onClick={handleGrantAccess} variant="contained" sx={{ alignSelf: 'flex-start' }}>
                  Accorder l'accès
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* Section: Liste des accès existants */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Utilisateurs avec accès ({selectedProject?.accesses?.length || 0})
              </Typography>
              {selectedProject?.accesses && selectedProject.accesses.length > 0 ? (
                <List>
                  {selectedProject.accesses.map((access) => (
                    <ListItem
                      key={access._id || access.user?._id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={async () => {
                            if (window.confirm(`Retirer l'accès à ${access.user?.name || access.user?.email} ?`)) {
                              try {
                                await axios.delete(`/api/projects/${selectedProject._id}/access/${access.user._id}`);
                                enqueueSnackbar('Accès retiré avec succès', { variant: 'success' });
                                // Recharger le projet pour mettre à jour la liste
                                const projectResponse = await axios.get(`/api/projects/${selectedProject._id}`);
                                setSelectedProject(projectResponse.data.data);
                                fetchProjects();
                              } catch (error) {
                                enqueueSnackbar('Erreur lors du retrait de l\'accès', { variant: 'error' });
                              }
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {access.user?.name?.charAt(0) || access.user?.email?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={access.user?.name || access.user?.email || 'Utilisateur inconnu'}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {access.user?.email}
                            </Typography>
                            <Chip
                              label={access.permission === 'read-write' ? 'Lecture/Écriture' : 'Lecture seule'}
                              size="small"
                              color={access.permission === 'read-write' ? 'success' : 'default'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun utilisateur n'a accès à ce projet (en dehors du propriétaire).
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAccessDialog}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;
