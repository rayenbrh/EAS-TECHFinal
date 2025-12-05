import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
  Rating,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
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
  ExpandMore as ExpandMoreIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useSnackbar } from 'notistack';

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

const DocumentCard = ({ document, onView, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

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
              {document.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Box>
          )}

          {document.aiSummary && (
            <Box>
              <Button
                size="small"
                startIcon={<AIIcon />}
                onClick={() => setShowSummary(true)}
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
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          Télécharger
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete(document.id);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Supprimer
        </MenuItem>
      </Menu>

      <Dialog open={showSummary} onClose={() => setShowSummary(false)} maxWidth="md" fullWidth>
        <DialogTitle>Résumé IA - {document.filename}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {document.aiSummary?.summary || 'Résumé non disponible'}
          </Typography>
          
          {document.aiSummary?.keyPoints && (
            <>
              <Typography variant="h6" gutterBottom>
                Points clés:
              </Typography>
              <List>
                {document.aiSummary.keyPoints.map((point, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${point}`} />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="body2" gutterBottom>
              Ce résumé vous a-t-il été utile?
            </Typography>
            <Rating defaultValue={0} size="large" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSummary(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const Documents = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [expandedProjects, setExpandedProjects] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedProject) {
      enqueueSnackbar('Veuillez sélectionner un projet avant d\'uploader', { variant: 'warning' });
      return;
    }

    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project', selectedProject);
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
      setSelectedProject('');
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Erreur lors du téléchargement', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }, [enqueueSnackbar, selectedProject]);

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
    disabled: !selectedProject || uploading,
  });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data.data || response.data);
    } catch (error) {
      // Données de démonstration
      setDocuments([
        {
          id: 1,
          filename: 'Rapport_Annuel_2024.pdf',
          uploadDate: new Date(),
          size: 2456789,
          tags: ['rapport', 'finance', '2024'],
          aiSummary: {
            summary: 'Ce rapport présente les résultats financiers de l\'année 2024 avec une croissance de 15% du chiffre d\'affaires.',
            keyPoints: [
              'Croissance de 15% du CA',
              'Expansion sur 3 nouveaux marchés',
              'Investissement dans l\'IA',
            ],
          },
        },
        {
          id: 2,
          filename: 'Contrat_Client_ABC.docx',
          uploadDate: new Date(Date.now() - 86400000),
          size: 156789,
          tags: ['contrat', 'client'],
          aiSummary: {
            summary: 'Contrat de prestation de services avec le client ABC pour une durée de 12 mois.',
            keyPoints: [
              'Durée: 12 mois',
              'Montant: 50 000€',
              'Date de début: 01/01/2024',
            ],
          },
        },
        {
          id: 3,
          filename: 'Budget_2024.xlsx',
          uploadDate: new Date(Date.now() - 172800000),
          size: 89456,
          tags: ['budget', 'finance'],
        },
        {
          id: 4,
          filename: 'Presentation_Produit.pdf',
          uploadDate: new Date(Date.now() - 259200000),
          size: 3456789,
          tags: ['présentation', 'produit'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDeleteDocument = async (documentId) => {
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

  // Grouper les documents par projet
  const groupedDocuments = React.useMemo(() => {
    const grouped = {};
    const withoutProject = [];

    documents.forEach((doc) => {
      // Filtrer par recherche
      if (searchQuery && !doc.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      if (doc.project && (doc.project._id || doc.project)) {
        const projectId = doc.project._id || doc.project;
        const projectName = doc.project.name || 'Projet inconnu';
        
        if (!grouped[projectId]) {
          grouped[projectId] = {
            id: projectId,
            name: projectName,
            documents: [],
          };
        }
        grouped[projectId].documents.push(doc);
      } else {
        withoutProject.push(doc);
      }
    });

    return { grouped, withoutProject };
  }, [documents, searchQuery]);

  const handleAccordionChange = (projectId) => (event, isExpanded) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: isExpanded,
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Documents
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Télécharger
        </Button>
      </Box>

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
        <Box>
          {/* Documents groupés par projet */}
          {Object.values(groupedDocuments.grouped).map((projectGroup) => (
            <Accordion
              key={projectGroup.id}
              expanded={expandedProjects[projectGroup.id] !== false}
              onChange={handleAccordionChange(projectGroup.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <FolderIcon sx={{ color: 'primary.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {projectGroup.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {projectGroup.documents.length} document{projectGroup.documents.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${projectGroup.id}/documents`);
                    }}
                    sx={{ mr: 1 }}
                  >
                    Voir le projet
                  </Button>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {projectGroup.documents.map((document) => (
                    <Grid item xs={12} sm={6} lg={4} key={document.id || document._id}>
                      <DocumentCard
                        document={document}
                        onView={(doc) => navigate(`/documents/${doc.id || doc._id}`)}
                        onDelete={handleDeleteDocument}
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Documents sans projet */}
          {groupedDocuments.withoutProject.length > 0 && (
            <Accordion
              expanded={expandedProjects['no-project'] !== false}
              onChange={handleAccordionChange('no-project')}
              sx={{ mb: 2 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <FolderOpenIcon sx={{ color: 'text.secondary' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Documents sans projet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {groupedDocuments.withoutProject.length} document{groupedDocuments.withoutProject.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {groupedDocuments.withoutProject.map((document) => (
                    <Grid item xs={12} sm={6} lg={4} key={document.id || document._id}>
                      <DocumentCard
                        document={document}
                        onView={(doc) => navigate(`/documents/${doc.id || doc._id}`)}
                        onDelete={handleDeleteDocument}
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Message si aucun document */}
          {Object.keys(groupedDocuments.grouped).length === 0 && groupedDocuments.withoutProject.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 3 }}>
              {searchQuery
                ? 'Aucun document ne correspond à votre recherche.'
                : 'Aucun document disponible. Commencez par télécharger des documents.'}
            </Alert>
          )}
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          if (!uploading) {
            setUploadDialogOpen(false);
            setSelectedProject('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Télécharger des documents</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Projet *</InputLabel>
              <Select
                value={selectedProject}
                label="Projet *"
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={uploading}
                startAdornment={<FolderIcon sx={{ mr: 1 }} />}
              >
                {projects.length === 0 ? (
                  <MenuItem disabled>Aucun projet disponible</MenuItem>
                ) : (
                  projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                cursor: selectedProject ? 'pointer' : 'not-allowed',
                opacity: selectedProject ? 1 : 0.6,
                transition: 'all 0.2s',
              }}
            >
              <input {...getInputProps()} disabled={!selectedProject || uploading} />
              <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive
                  ? 'Déposez les fichiers ici...'
                  : selectedProject
                  ? 'Glissez-déposez des fichiers ou cliquez pour sélectionner'
                  : 'Sélectionnez d\'abord un projet'}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedProject('');
            }} 
            disabled={uploading}
          >
            Annuler
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents;

