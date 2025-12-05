import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Image as ImageIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AutoAwesome as AIIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
      return <PdfIcon sx={{ fontSize: 48, color: 'error.main' }} />;
    case 'doc':
    case 'docx':
      return <DocIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
    case 'xls':
    case 'xlsx':
      return <ExcelIcon sx={{ fontSize: 48, color: 'success.main' }} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <ImageIcon sx={{ fontSize: 48, color: 'warning.main' }} />;
    default:
      return <DocIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
  }
};

const DocumentCard = ({ document, onView, onDelete, canDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getFileIcon(document.filename)}
              <Box>
                <Typography variant="h6" sx={{ fontSize: '0.95rem' }}>
                  {document.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(document.createdAt || document.uploadDate).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          </Box>

          {document.tags && document.tags.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {document.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" />
              ))}
            </Box>
          )}

          {document.aiSummary && (
            <Box>
              <Button
                size="small"
                startIcon={<AIIcon />}
                onClick={() => onView(document)}
                sx={{ mb: 1 }}
              >
                Voir le résumé IA
              </Button>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary">
            Taille: {(document.size / 1024).toFixed(2)} KB
          </Typography>
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            onView(document);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          Voir
        </MenuItem>
        {canDelete && (
          <MenuItem
            onClick={() => {
              onDelete(document.id || document._id);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            Supprimer
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

const ProjectDocuments = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userPermission, setUserPermission] = useState(null);

  useEffect(() => {
    fetchProject();
    fetchDocuments();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}`);
      setProject(response.data.data);
      // Déterminer la permission de l'utilisateur
      if (hasRole('admin') || response.data.data.createdBy._id === user.id) {
        setUserPermission('admin');
      } else {
        const access = response.data.data.accesses?.find(
          a => a.user._id === user.id
        );
        setUserPermission(access?.permission || null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      enqueueSnackbar('Erreur lors du chargement du projet', { variant: 'error' });
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/documents?project=${projectId}`);
      setDocuments(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      enqueueSnackbar('Erreur lors du chargement des documents', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onDrop = React.useCallback(async (acceptedFiles) => {
    if (userPermission !== 'admin' && userPermission !== 'read-write') {
      enqueueSnackbar('Vous n\'avez pas la permission d\'uploader des documents', { variant: 'error' });
      return;
    }

    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project', projectId);
        formData.append('tags', JSON.stringify(['nouveau', 'import']));

        await axios.post('/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        enqueueSnackbar(`${file.name} téléchargé avec succès`, { variant: 'success' });
      }

      fetchDocuments();
      setUploadDialogOpen(false);
    } catch (error) {
      enqueueSnackbar('Erreur lors du téléchargement', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }, [projectId, userPermission, enqueueSnackbar]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
  });

  const handleDeleteDocument = async (documentId) => {
    if (userPermission !== 'admin' && userPermission !== 'read-write') {
      enqueueSnackbar('Vous n\'avez pas la permission de supprimer des documents', { variant: 'error' });
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await axios.delete(`/api/documents/${documentId}`);
        enqueueSnackbar('Document supprimé', { variant: 'success' });
        fetchDocuments();
      } catch (error) {
        enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
      }
    }
  };

  const canUpload = userPermission === 'admin' || userPermission === 'read-write';
  const canDelete = userPermission === 'admin' || userPermission === 'read-write';

  const filteredDocuments = documents.filter((doc) =>
    doc.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/projects')}>
          <BackIcon />
        </IconButton>
        <FolderIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {project?.name || 'Chargement...'}
          </Typography>
          {project?.description && (
            <Typography variant="body2" color="text.secondary">
              {project.description}
            </Typography>
          )}
        </Box>
        {canUpload && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Télécharger
          </Button>
        )}
      </Box>

      {project && (
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={`Permission: ${userPermission === 'admin' ? 'Propriétaire' : userPermission || 'Aucune'}`}
            color={userPermission === 'admin' ? 'primary' : userPermission === 'read-write' ? 'success' : 'default'}
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`${documents.length} document(s)`}
            variant="outlined"
          />
        </Box>
      )}

      <TextField
        fullWidth
        placeholder="Rechercher des documents..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {filteredDocuments.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Aucun document dans ce projet
                </Typography>
                {canUpload && (
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                    sx={{ mt: 2 }}
                  >
                    Télécharger le premier document
                  </Button>
                )}
              </Paper>
            </Grid>
          ) : (
            filteredDocuments.map((document) => (
              <Grid item xs={12} sm={6} lg={4} key={document.id || document._id}>
                <DocumentCard
                  document={document}
                  onView={(doc) => navigate(`/documents/${doc.id || doc._id}`)}
                  onDelete={handleDeleteDocument}
                  canDelete={canDelete}
                />
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Télécharger des documents</DialogTitle>
        <DialogContent>
          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'Déposez les fichiers ici...'
                : 'Glissez-déposez des fichiers ou cliquez pour sélectionner'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Formats acceptés: PDF, Word, Excel, Images
            </Typography>
          </Paper>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Téléchargement en cours...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDocuments;
