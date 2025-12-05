import React, { useState, useEffect } from 'react';
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
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  PersonAdd as AddUserIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const roleColors = {
  admin: 'error',
  user: 'primary',
  guest: 'default',
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectAccessDialogOpen, setProjectAccessDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: '',
  });
  const [accessFormData, setAccessFormData] = useState({
    projectId: '',
    permission: 'read',
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.data || response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      enqueueSnackbar('Erreur lors du chargement des utilisateurs', { variant: 'error' });
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      console.error('Détails de l\'erreur:', error.response?.data || error.message);
      // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas de projets
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        enqueueSnackbar('Erreur lors du chargement des projets', { variant: 'error' });
      }
    }
  };

  const handleOpenDialog = async (user = null) => {
    if (user) {
      // Récupérer les détails complets de l'utilisateur avec ses accès
      try {
        const response = await axios.get(`/api/users/${user._id || user.id}`);
        const userData = response.data.data;
        setEditingUser(userData);
        setSelectedUser(userData);
        setFormData({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          password: '',
        });
      } catch (error) {
        setEditingUser(user);
        setFormData({
          name: user.name,
          email: user.email,
          role: user.role,
          password: '',
        });
      }
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'user',
        password: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      password: '',
    });
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser._id || editingUser.id}`, formData);
        enqueueSnackbar('Utilisateur modifié avec succès', { variant: 'success' });
      } else {
        await axios.post('/api/users', formData);
        enqueueSnackbar('Utilisateur créé avec succès', { variant: 'success' });
      }
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Erreur lors de la sauvegarde', { variant: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        enqueueSnackbar('Utilisateur supprimé', { variant: 'success' });
        fetchUsers();
      } catch (error) {
        enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
      }
    }
  };

  const handleOpenProjectAccessDialog = (user) => {
    setSelectedUser(user);
    setAccessFormData({
      projectId: '',
      permission: 'read',
    });
    setProjectAccessDialogOpen(true);
  };

  const handleCloseProjectAccessDialog = () => {
    setProjectAccessDialogOpen(false);
    setSelectedUser(null);
  };

  const handleGrantProjectAccess = async () => {
    try {
      await axios.post(`/api/projects/${accessFormData.projectId}/access`, {
        userId: selectedUser._id || selectedUser.id,
        permission: accessFormData.permission,
      });
      enqueueSnackbar('Accès au projet accordé avec succès', { variant: 'success' });
      fetchUsers();
      handleCloseProjectAccessDialog();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Erreur lors de l\'attribution de l\'accès', { variant: 'error' });
    }
  };

  const handleRemoveProjectAccess = async (projectId, userId) => {
    if (window.confirm('Retirer l\'accès à ce projet ?')) {
      try {
        await axios.delete(`/api/projects/${projectId}/access/${userId}`);
        enqueueSnackbar('Accès retiré avec succès', { variant: 'success' });
        fetchUsers();
      } catch (error) {
        enqueueSnackbar('Erreur lors du retrait de l\'accès', { variant: 'error' });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Gestion des utilisateurs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddUserIcon />}
          onClick={() => handleOpenDialog()}
        >
          Ajouter un utilisateur
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Liste des utilisateurs" />
          <Tab label="Accès aux projets" />
        </Tabs>
      </Card>

      {tabValue === 0 && (
        <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Date de création</TableCell>
                  <TableCell>Dernière activité</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id || user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {user.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {user.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={roleColors[user.role]}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell>
                      {user.lastActive ? new Date(user.lastActive).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenProjectAccessDialog(user)}
                        sx={{ mr: 1 }}
                        title="Gérer les accès aux projets"
                      >
                        <FolderIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user._id || user.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      )}

      {/* Dialog pour ajouter/modifier un utilisateur */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Nom"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={formData.role}
                label="Rôle"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">Utilisateur</MenuItem>
                <MenuItem value="guest">Invité</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText={
                editingUser
                  ? 'Laissez vide pour conserver le mot de passe actuel'
                  : 'Requis pour les nouveaux utilisateurs'
              }
              required={!editingUser}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {editingUser ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog gestion des accès aux projets */}
      <Dialog open={projectAccessDialogOpen} onClose={handleCloseProjectAccessDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Gérer les accès aux projets - {selectedUser?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Accorder un nouvel accès
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Projet</InputLabel>
                <Select
                  value={accessFormData.projectId}
                  label="Projet"
                  onChange={(e) => setAccessFormData({ ...accessFormData, projectId: e.target.value })}
                >
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Permission</InputLabel>
                <Select
                  value={accessFormData.permission}
                  label="Permission"
                  onChange={(e) => setAccessFormData({ ...accessFormData, permission: e.target.value })}
                >
                  <MenuItem value="read">Lecture seule</MenuItem>
                  <MenuItem value="read-write">Lecture et écriture</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleGrantProjectAccess}
                disabled={!accessFormData.projectId}
              >
                Accorder l'accès
              </Button>
            </Box>

            <Typography variant="h6" gutterBottom>
              Accès existants
            </Typography>
            {selectedUser?.projectAccesses && selectedUser.projectAccesses.length > 0 ? (
              <List>
                {selectedUser.projectAccesses.map((access) => (
                  <ListItem key={access._id}>
                    <ListItemText
                      primary={access.project?.name || 'Projet inconnu'}
                      secondary={`Permission: ${access.permission === 'read-write' ? 'Lecture et écriture' : 'Lecture seule'}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveProjectAccess(access.project._id, selectedUser._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucun accès aux projets
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProjectAccessDialog}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vue d'ensemble des accès aux projets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sélectionnez un utilisateur dans l'onglet "Liste des utilisateurs" pour gérer ses accès aux projets.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Users;

