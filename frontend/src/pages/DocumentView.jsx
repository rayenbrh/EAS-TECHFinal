import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Rating,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  AutoAwesome as AIIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Image as ImageIcon,
  ExpandMore as ExpandMoreIcon,
  SentimentSatisfied as SentimentIcon,
  Assessment as AnalyticsIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Insights as InsightsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Tag as TagIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const getFileIcon = (mimeType) => {
  if (mimeType?.includes('pdf')) return <PdfIcon sx={{ fontSize: 64, color: 'error.main' }} />;
  if (mimeType?.includes('word') || mimeType?.includes('document')) return <DocIcon sx={{ fontSize: 64, color: 'primary.main' }} />;
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return <ExcelIcon sx={{ fontSize: 64, color: 'success.main' }} />;
  if (mimeType?.includes('image')) return <ImageIcon sx={{ fontSize: 64, color: 'warning.main' }} />;
  return <DocIcon sx={{ fontSize: 64, color: 'text.secondary' }} />;
};

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/documents/${id}`);
      setDocument(response.data.data);
      if (response.data.data?.aiSummary?.rating) {
        setRating(response.data.data.aiSummary.rating);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du document:', error);
      enqueueSnackbar('Erreur lors du chargement du document', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = async (newValue) => {
    setRating(newValue);
    setSubmittingRating(true);
    try {
      await axios.put(`/api/documents/${id}/rating`, { rating: newValue });
      enqueueSnackbar('Note enregistrée avec succès', { variant: 'success' });
      setDocument((prev) => ({
        ...prev,
        aiSummary: { ...prev.aiSummary, rating: newValue },
      }));
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la note:', error);
      enqueueSnackbar('Erreur lors de l\'enregistrement de la note', { variant: 'error' });
      setRating(document?.aiSummary?.rating || 0);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const response = await axios.post('/api/ai/summarize', { documentId: id });
      setDocument((prev) => ({
        ...prev,
        aiSummary: response.data.data,
        status: 'ready',
      }));
      enqueueSnackbar('Résumé IA généré avec succès', { variant: 'success' });
      fetchDocument(); // Recharger pour avoir toutes les données
    } catch (error) {
      console.error('Erreur lors de la génération du résumé:', error);
      enqueueSnackbar(error.response?.data?.message || 'Erreur lors de la génération du résumé', { variant: 'error' });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateCompleteAnalysis = async () => {
    setGeneratingSummary(true);
    try {
      const response = await axios.post('/api/ai/complete-analysis', { documentId: id });
      setDocument((prev) => ({
        ...prev,
        aiSummary: response.data.data.summary,
        aiEntities: response.data.data.entities,
        aiSentiment: response.data.data.sentiment,
        aiAnalytics: response.data.data.analytics,
        status: 'ready',
      }));
      enqueueSnackbar('Analyse complète générée avec succès', { variant: 'success' });
      fetchDocument(); // Recharger pour avoir toutes les données
    } catch (error) {
      console.error('Erreur lors de la génération de l\'analyse complète:', error);
      enqueueSnackbar(error.response?.data?.message || 'Erreur lors de la génération de l\'analyse', { variant: 'error' });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/documents/${id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      enqueueSnackbar('Téléchargement démarré', { variant: 'success' });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      enqueueSnackbar('Erreur lors du téléchargement', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!document) {
    return (
      <Box>
        <Alert severity="error">Document non trouvé</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/documents')} sx={{ mt: 2 }}>
          Retour aux documents
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/documents')}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {document.filename}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Télécharger
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                {getFileIcon(document.mimeType)}
                <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
                  {document.filename}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Taille
                  </Typography>
                  <Typography variant="body2">
                    {(document.size / 1024).toFixed(2)} KB
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body2">
                    {document.mimeType}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date de téléchargement
                  </Typography>
                  <Typography variant="body2">
                    {new Date(document.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>

                {document.uploadedBy && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Téléchargé par
                    </Typography>
                    <Typography variant="body2">
                      {typeof document.uploadedBy === 'object' 
                        ? document.uploadedBy.name 
                        : 'Utilisateur'}
                    </Typography>
                  </Box>
                )}

                {document.tags && document.tags.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {document.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Statut
                  </Typography>
                  <Typography variant="body2">
                    <Chip
                      label={document.status === 'ready' ? 'Prêt' : document.status === 'processing' ? 'En traitement' : 'Erreur'}
                      color={document.status === 'ready' ? 'success' : document.status === 'processing' ? 'warning' : 'error'}
                      size="small"
                    />
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AIIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Résumé IA
                  </Typography>
                </Box>
                       <Box sx={{ display: 'flex', gap: 1 }}>
                         {!document.aiSummary && (
                           <Button
                             variant="contained"
                             startIcon={generatingSummary ? <CircularProgress size={20} /> : <AIIcon />}
                             onClick={handleGenerateSummary}
                             disabled={generatingSummary || document.status === 'processing'}
                           >
                             {generatingSummary ? 'Génération...' : 'Générer le résumé'}
                           </Button>
                         )}
                         <Button
                           variant="outlined"
                           startIcon={generatingSummary ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                           onClick={handleGenerateCompleteAnalysis}
                           disabled={generatingSummary || document.status === 'processing'}
                         >
                           {generatingSummary ? 'Analyse...' : 'Analyse complète'}
                         </Button>
                       </Box>
              </Box>

              {document.status === 'processing' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Le document est en cours de traitement. Le résumé IA sera disponible sous peu.
                </Alert>
              )}

                     {document.aiSummary || document.aiEntities || document.aiSentiment || document.aiAnalytics ? (
                       <>
                         <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                           {document.aiSummary && <Tab label="Résumé" icon={<AIIcon />} iconPosition="start" />}
                           {document.aiEntities && <Tab label="Entités" icon={<PersonIcon />} iconPosition="start" />}
                           {document.aiSentiment && <Tab label="Sentiment" icon={<SentimentIcon />} iconPosition="start" />}
                           {document.aiAnalytics && <Tab label="Analytics" icon={<AnalyticsIcon />} iconPosition="start" />}
                         </Tabs>

                         {/* Onglet Résumé */}
                         {tabValue === 0 && document.aiSummary && (
                           <Box>
                             <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                               <Typography variant="body1" paragraph>
                                 {document.aiSummary.summary || 'Résumé non disponible'}
                               </Typography>
                             </Paper>

                             {document.aiSummary.keyPoints && document.aiSummary.keyPoints.length > 0 && (
                               <Box sx={{ mb: 3 }}>
                                 <Typography variant="h6" gutterBottom>
                                   Points clés
                                 </Typography>
                                 <List>
                                   {document.aiSummary.keyPoints.map((point, index) => (
                                     <ListItem key={index} sx={{ pl: 0 }}>
                                       <ListItemText
                                         primary={`• ${point}`}
                                         primaryTypographyProps={{ variant: 'body2' }}
                                       />
                                     </ListItem>
                                   ))}
                                 </List>
                               </Box>
                             )}

                             {document.aiSummary.category && (
                               <Box sx={{ mb: 2 }}>
                                 <Chip label={`Catégorie: ${document.aiSummary.category}`} color="primary" />
                                 {document.aiSummary.language && (
                                   <Chip label={`Langue: ${document.aiSummary.language}`} sx={{ ml: 1 }} />
                                 )}
                               </Box>
                             )}
                           </Box>
                         )}

                         {/* Onglet Entités */}
                         {tabValue === 1 && document.aiEntities && (
                           <Box>
                             <Grid container spacing={2}>
                               {document.aiEntities.personnes && document.aiEntities.personnes.length > 0 && (
                                 <Grid item xs={12} md={6}>
                                   <Accordion>
                                     <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                         <PersonIcon color="primary" />
                                         <Typography>Personnes ({document.aiEntities.personnes.length})</Typography>
                                       </Box>
                                     </AccordionSummary>
                                     <AccordionDetails>
                                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                         {document.aiEntities.personnes.map((person, index) => (
                                           <Chip key={index} label={person} />
                                         ))}
                                       </Box>
                                     </AccordionDetails>
                                   </Accordion>
                                 </Grid>
                               )}

                               {document.aiEntities.organizations && document.aiEntities.organizations.length > 0 && (
                                 <Grid item xs={12} md={6}>
                                   <Accordion>
                                     <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                         <BusinessIcon color="primary" />
                                         <Typography>Organisations ({document.aiEntities.organizations.length})</Typography>
                                       </Box>
                                     </AccordionSummary>
                                     <AccordionDetails>
                                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                         {document.aiEntities.organizations.map((org, index) => (
                                           <Chip key={index} label={org} />
                                         ))}
                                       </Box>
                                     </AccordionDetails>
                                   </Accordion>
                                 </Grid>
                               )}

                               {document.aiEntities.locations && document.aiEntities.locations.length > 0 && (
                                 <Grid item xs={12} md={6}>
                                   <Accordion>
                                     <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                         <LocationIcon color="primary" />
                                         <Typography>Lieux ({document.aiEntities.locations.length})</Typography>
                                       </Box>
                                     </AccordionSummary>
                                     <AccordionDetails>
                                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                         {document.aiEntities.locations.map((location, index) => (
                                           <Chip key={index} label={location} />
                                         ))}
                                       </Box>
                                     </AccordionDetails>
                                   </Accordion>
                                 </Grid>
                               )}

                               {document.aiEntities.dates && document.aiEntities.dates.length > 0 && (
                                 <Grid item xs={12} md={6}>
                                   <Accordion>
                                     <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                         <CalendarIcon color="primary" />
                                         <Typography>Dates ({document.aiEntities.dates.length})</Typography>
                                       </Box>
                                     </AccordionSummary>
                                     <AccordionDetails>
                                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                         {document.aiEntities.dates.map((date, index) => (
                                           <Chip key={index} label={date} />
                                         ))}
                                       </Box>
                                     </AccordionDetails>
                                   </Accordion>
                                 </Grid>
                               )}

                               {document.aiEntities.amounts && document.aiEntities.amounts.length > 0 && (
                                 <Grid item xs={12} md={6}>
                                   <Accordion>
                                     <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                         <MoneyIcon color="primary" />
                                         <Typography>Montants ({document.aiEntities.amounts.length})</Typography>
                                       </Box>
                                     </AccordionSummary>
                                     <AccordionDetails>
                                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                         {document.aiEntities.amounts.map((amount, index) => (
                                           <Chip key={index} label={amount} color="success" />
                                         ))}
                                       </Box>
                                     </AccordionDetails>
                                   </Accordion>
                                 </Grid>
                               )}

                               {document.aiEntities.keywords && document.aiEntities.keywords.length > 0 && (
                                 <Grid item xs={12}>
                                   <Accordion>
                                     <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                         <TagIcon color="primary" />
                                         <Typography>Mots-clés ({document.aiEntities.keywords.length})</Typography>
                                       </Box>
                                     </AccordionSummary>
                                     <AccordionDetails>
                                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                         {document.aiEntities.keywords.map((keyword, index) => (
                                           <Chip key={index} label={keyword} size="small" variant="outlined" />
                                         ))}
                                       </Box>
                                     </AccordionDetails>
                                   </Accordion>
                                 </Grid>
                               )}

                               {document.aiEntities.themes && document.aiEntities.themes.length > 0 && (
                                 <Grid item xs={12}>
                                   <Accordion>
                                     <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                         <InsightsIcon color="primary" />
                                         <Typography>Thèmes ({document.aiEntities.themes.length})</Typography>
                                       </Box>
                                     </AccordionSummary>
                                     <AccordionDetails>
                                       <List>
                                         {document.aiEntities.themes.map((theme, index) => (
                                           <ListItem key={index}>
                                             <ListItemText primary={theme} />
                                           </ListItem>
                                         ))}
                                       </List>
                                     </AccordionDetails>
                                   </Accordion>
                                 </Grid>
                               )}
                             </Grid>
                           </Box>
                         )}

                         {/* Onglet Sentiment */}
                         {tabValue === 2 && document.aiSentiment && (
                           <Box>
                             <Grid container spacing={3}>
                               <Grid item xs={12} md={6}>
                                 <Card>
                                   <CardContent>
                                     <Typography variant="h6" gutterBottom>
                                       Sentiment général
                                     </Typography>
                                     <Chip
                                       label={document.aiSentiment.sentiment || 'neutre'}
                                       color={
                                         document.aiSentiment.sentiment === 'positif'
                                           ? 'success'
                                           : document.aiSentiment.sentiment === 'négatif'
                                           ? 'error'
                                           : 'default'
                                       }
                                       sx={{ mb: 2 }}
                                     />
                                     {document.aiSentiment.sentiment_score !== undefined && (
                                       <Box>
                                         <Typography variant="body2" color="text.secondary" gutterBottom>
                                           Score: {document.aiSentiment.sentiment_score.toFixed(2)}
                                         </Typography>
                                         <LinearProgress
                                           variant="determinate"
                                           value={document.aiSentiment.sentiment_score * 100}
                                           sx={{ height: 8, borderRadius: 4 }}
                                         />
                                       </Box>
                                     )}
                                   </CardContent>
                                 </Card>
                               </Grid>

                               <Grid item xs={12} md={6}>
                                 <Card>
                                   <CardContent>
                                     <Typography variant="h6" gutterBottom>
                                       Ton du document
                                     </Typography>
                                     <Chip label={document.aiSentiment.ton || 'neutre'} sx={{ mb: 2 }} />
                                     {document.aiSentiment.confidence_level !== undefined && (
                                       <Box>
                                         <Typography variant="body2" color="text.secondary" gutterBottom>
                                           Niveau de confiance: {document.aiSentiment.confidence_level}/10
                                         </Typography>
                                         <LinearProgress
                                           variant="determinate"
                                           value={(document.aiSentiment.confidence_level / 10) * 100}
                                           color="primary"
                                           sx={{ height: 8, borderRadius: 4 }}
                                         />
                                       </Box>
                                     )}
                                   </CardContent>
                                 </Card>
                               </Grid>

                               {document.aiSentiment.emotions && document.aiSentiment.emotions.length > 0 && (
                                 <Grid item xs={12}>
                                   <Card>
                                     <CardContent>
                                       <Typography variant="h6" gutterBottom>
                                         Émotions détectées
                                       </Typography>
                                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                         {document.aiSentiment.emotions.map((emotion, index) => (
                                           <Chip key={index} label={emotion} />
                                         ))}
                                       </Box>
                                     </CardContent>
                                   </Card>
                                 </Grid>
                               )}

                               {document.aiSentiment.summary && (
                                 <Grid item xs={12}>
                                   <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                     <Typography variant="body2">
                                       {document.aiSentiment.summary}
                                     </Typography>
                                   </Paper>
                                 </Grid>
                               )}
                             </Grid>
                           </Box>
                         )}

                         {/* Onglet Analytics */}
                         {tabValue === 3 && document.aiAnalytics && (
                           <Box>
                             <Grid container spacing={3}>
                               <Grid item xs={12} md={6}>
                                 <Card>
                                   <CardContent>
                                     <Typography variant="h6" gutterBottom>
                                       Complexité
                                     </Typography>
                                     <Chip
                                       label={document.aiAnalytics.complexity || 'moyen'}
                                       color={
                                         document.aiAnalytics.complexity === 'simple'
                                           ? 'success'
                                           : document.aiAnalytics.complexity === 'complexe'
                                           ? 'error'
                                           : 'warning'
                                       }
                                     />
                                   </CardContent>
                                 </Card>
                               </Grid>

                               <Grid item xs={12} md={6}>
                                 <Card>
                                   <CardContent>
                                     <Typography variant="h6" gutterBottom>
                                       Type de document
                                     </Typography>
                                     <Typography variant="body1">
                                       {document.aiAnalytics.document_type || 'Non spécifié'}
                                     </Typography>
                                     {document.aiAnalytics.sector && (
                                       <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                         Secteur: {document.aiAnalytics.sector}
                                       </Typography>
                                     )}
                                   </CardContent>
                                 </Card>
                               </Grid>

                               {document.aiAnalytics.recommendations && document.aiAnalytics.recommendations.length > 0 && (
                                 <Grid item xs={12} md={6}>
                                   <Card>
                                     <CardContent>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                         <CheckCircleIcon color="success" />
                                         <Typography variant="h6">Recommandations</Typography>
                                       </Box>
                                       <List>
                                         {document.aiAnalytics.recommendations.map((rec, index) => (
                                           <ListItem key={index}>
                                             <ListItemText primary={`${index + 1}. ${rec}`} />
                                           </ListItem>
                                         ))}
                                       </List>
                                     </CardContent>
                                   </Card>
                                 </Grid>
                               )}

                               {document.aiAnalytics.risks && document.aiAnalytics.risks.length > 0 && (
                                 <Grid item xs={12} md={6}>
                                   <Card>
                                     <CardContent>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                         <WarningIcon color="error" />
                                         <Typography variant="h6">Risques identifiés</Typography>
                                       </Box>
                                       <List>
                                         {document.aiAnalytics.risks.map((risk, index) => (
                                           <ListItem key={index}>
                                             <ListItemText primary={`• ${risk}`} />
                                           </ListItem>
                                         ))}
                                       </List>
                                     </CardContent>
                                   </Card>
                                 </Grid>
                               )}

                               {document.aiAnalytics.opportunities && document.aiAnalytics.opportunities.length > 0 && (
                                 <Grid item xs={12} md={6}>
                                   <Card>
                                     <CardContent>
                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                         <TrendingUpIcon color="success" />
                                         <Typography variant="h6">Opportunités</Typography>
                                       </Box>
                                       <List>
                                         {document.aiAnalytics.opportunities.map((opp, index) => (
                                           <ListItem key={index}>
                                             <ListItemText primary={`• ${opp}`} />
                                           </ListItem>
                                         ))}
                                       </List>
                                     </CardContent>
                                   </Card>
                                 </Grid>
                               )}

                               {document.aiAnalytics.next_steps && document.aiAnalytics.next_steps.length > 0 && (
                                 <Grid item xs={12} md={6}>
                                   <Card>
                                     <CardContent>
                                       <Typography variant="h6" gutterBottom>
                                         Prochaines étapes
                                       </Typography>
                                       <List>
                                         {document.aiAnalytics.next_steps.map((step, index) => (
                                           <ListItem key={index}>
                                             <ListItemText primary={`${index + 1}. ${step}`} />
                                           </ListItem>
                                         ))}
                                       </List>
                                     </CardContent>
                                   </Card>
                                 </Grid>
                               )}

                               {document.aiAnalytics.insights && (
                                 <Grid item xs={12}>
                                   <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                       <InsightsIcon />
                                       <Typography variant="h6">Insight principal</Typography>
                                     </Box>
                                     <Typography variant="body1">
                                       {document.aiAnalytics.insights}
                                     </Typography>
                                   </Paper>
                                 </Grid>
                               )}
                             </Grid>
                           </Box>
                         )}

                         {/* Rating - affiché uniquement dans l'onglet Résumé */}
                         {tabValue === 0 && document.aiSummary && (
                           <>
                             {document.aiSummary.generatedAt && (
                               <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, mt: 3 }}>
                                 Généré le {new Date(document.aiSummary.generatedAt).toLocaleDateString('fr-FR', {
                                   year: 'numeric',
                                   month: 'long',
                                   day: 'numeric',
                                   hour: '2-digit',
                                   minute: '2-digit',
                                 })}
                               </Typography>
                             )}

                             <Divider sx={{ my: 3 }} />

                             <Box>
                               <Typography variant="h6" gutterBottom>
                                 Ce résumé vous a-t-il été utile ?
                               </Typography>
                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                                 <Rating
                                   value={rating}
                                   onChange={(event, newValue) => {
                                     if (newValue !== null) {
                                       handleRatingChange(newValue);
                                     }
                                   }}
                                   size="large"
                                   disabled={submittingRating}
                                 />
                                 {submittingRating && (
                                   <CircularProgress size={24} />
                                 )}
                                 {rating > 0 && !submittingRating && (
                                   <Typography variant="body2" color="text.secondary">
                                     Merci pour votre retour !
                                   </Typography>
                                 )}
                               </Box>
                             </Box>
                           </>
                         )}
                       </>
                     ) : (
                       <Alert severity="info">
                         Aucun résumé IA disponible pour ce document. Cliquez sur "Générer le résumé" pour en créer un.
                       </Alert>
                     )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentView;
