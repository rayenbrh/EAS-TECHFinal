import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Assessment as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Insights as InsightsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

const Analytics = () => {
  const { projectId } = useParams();
  const { hasRole } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchAnalytics();
    }
  }, [projectId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/ai/project-analytics/${projectId}`);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
      enqueueSnackbar('Erreur lors du chargement des analytics', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    enqueueSnackbar('Analytics actualisées', { variant: 'success' });
  };

  if (loading && !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box>
        <Alert severity="info">Aucune donnée analytics disponible pour ce projet</Alert>
      </Box>
    );
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon sx={{ fontSize: 32 }} />
          Analytics du Projet
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Actualiser
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Statistiques générales */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Documents totaux
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {analytics.totalDocuments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Taille totale
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {formatBytes(analytics.totalSize)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Avec analyse IA
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {analytics.documentsWithAI}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {analytics.totalDocuments > 0
                  ? `${Math.round((analytics.documentsWithAI / analytics.totalDocuments) * 100)}%`
                  : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Note moyenne
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {analytics.averageRating || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Catégories */}
        {Object.keys(analytics.categories || {}).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CategoryIcon color="primary" />
                  <Typography variant="h6">Catégories</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(analytics.categories).map(([category, count]) => (
                    <Chip
                      key={category}
                      label={`${category} (${count})`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Tags les plus utilisés */}
        {Object.keys(analytics.tags || {}).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TagIcon color="primary" />
                  <Typography variant="h6">Tags les plus utilisés</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(analytics.tags)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([tag, count]) => (
                      <Chip
                        key={tag}
                        label={`${tag} (${count})`}
                        size="small"
                      />
                    ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Top uploaders */}
        {analytics.topUploaders && analytics.topUploaders.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6">Top contributeurs</Typography>
                </Box>
                <List>
                  {analytics.topUploaders.map((uploader, index) => (
                    <ListItem key={uploader.email}>
                      <ListItemIcon>
                        <Chip label={index + 1} size="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={uploader.name}
                        secondary={`${uploader.count} document(s)`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Uploads par mois */}
        {Object.keys(analytics.uploadsByMonth || {}).length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarIcon color="primary" />
                  <Typography variant="h6">Uploads par mois</Typography>
                </Box>
                <List>
                  {Object.entries(analytics.uploadsByMonth)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .slice(0, 6)
                    .map(([month, count]) => (
                      <ListItem key={month}>
                        <ListItemIcon>
                          <TrendingUpIcon color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={new Date(month + '-01').toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                          })}
                          secondary={`${count} document(s)`}
                        />
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Analytics;
