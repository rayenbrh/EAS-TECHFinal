import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress as LinearProgressBar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Description as DocumentIcon,
  People as PeopleIcon,
  AutoAwesome as AIIcon,
  CloudUpload as UploadIcon,
  SentimentSatisfied as SentimentIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Tag as TagIcon,
  Category as CategoryIcon,
  Insights as InsightsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Folder as FolderIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MetricCard = ({ title, value, trend, trendValue, icon, color, buttonText }) => {
  const Icon = icon;
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendIcon 
                sx={{ 
                  fontSize: 18, 
                  color: trend === 'up' ? 'success.main' : 'error.main' 
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ color: trend === 'up' ? 'success.main' : 'error.main' }}
              >
                {trendValue}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: `${color}.100`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
          </Box>
        </Box>
        {buttonText && (
          <Button 
            variant="contained" 
            size="small"
            sx={{ 
              bgcolor: `${color}.main`,
              '&:hover': { bgcolor: `${color}.dark` }
            }}
          >
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    newUploads: 0,
    activeUsers: 0,
    aiSummaries: 0,
  });
  const [aiAnalytics, setAiAnalytics] = useState(null);
  const [projectsAnalytics, setProjectsAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/stats');
        setStats(response.data.data || response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        // Données de démonstration
        setStats({
          totalDocuments: 845,
          newUploads: 159,
          activeUsers: 84,
          aiSummaries: 542,
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchAiAnalytics = async () => {
      try {
        const response = await axios.get('/api/dashboard/ai-analytics');
        console.log('📊 [DASHBOARD] Analytics IA reçues:', response.data);
        if (response.data && response.data.success) {
          setAiAnalytics(response.data.data || {});
        } else {
          console.warn('⚠️ [DASHBOARD] Réponse invalide:', response.data);
          setAiAnalytics({});
        }
      } catch (error) {
        console.error('❌ [DASHBOARD] Erreur lors du chargement des analytics IA:', error);
        console.error('Détails:', error.response?.data || error.message);
        // Initialiser avec un objet vide pour permettre l'affichage
        setAiAnalytics({});
      } finally {
        setAiLoading(false);
      }
    };

    const fetchProjectsAnalytics = async () => {
      try {
        const response = await axios.get('/api/dashboard/projects-analytics');
        setProjectsAnalytics(response.data.data);
      } catch (error) {
        console.error('Erreur lors du chargement des analytics projets:', error);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchStats();
    fetchAiAnalytics();
    fetchProjectsAnalytics();
  }, []);

  // Données pour le graphique d'audience
  const audienceData = {
    labels: ['OCT 21', 'OCT 22', 'OCT 23', 'OCT 24'],
    datasets: [
      {
        label: 'Vues de pages',
        data: [45000, 52000, 48000, 75000],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Utilisateurs',
        data: [30000, 38000, 42000, 55000],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Données pour le graphique des utilisateurs
  const usersData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Nouveaux',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
      },
      {
        label: 'Anciens',
        data: [85, 95, 75, 92, 88, 78, 70],
        backgroundColor: 'rgba(53, 162, 235, 0.8)',
      },
    ],
  };

  // Données pour le graphique des appareils
  const devicesData = {
    labels: ['Ordinateurs', 'Tablettes', 'Mobiles'],
    datasets: [
      {
        data: [2154, 3, 9518],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Tableau de bord
      </Typography>

      {/* Carte de profil utilisateur */}
      {user && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar 
                src={user.picture}
                sx={{ 
                  width: 80, 
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {user.name || 'Utilisateur'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {user.email || 'email@example.com'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rôle: <strong style={{ textTransform: 'capitalize' }}>{user.role || 'Invité'}</strong>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Cartes de métriques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Documents"
            value={stats.totalDocuments}
            trend="up"
            trendValue="+18% ce mois"
            icon={DocumentIcon}
            color="primary"
            buttonText="Voir"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Nouveaux uploads"
            value={stats.newUploads}
            trend="down"
            trendValue="-5% aujourd'hui"
            icon={UploadIcon}
            color="warning"
            buttonText="Voir"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Utilisateurs actifs"
            value={stats.activeUsers}
            trend="up"
            trendValue="+54% en ligne"
            icon={PeopleIcon}
            color="info"
            buttonText="Voir"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Résumés IA"
            value={stats.aiSummaries}
            trend="up"
            trendValue="+12% générés"
            icon={AIIcon}
            color="success"
            buttonText="Voir"
          />
        </Grid>
      </Grid>

      {/* Analytics IA */}
      {!aiLoading && (
        <>
          <Typography variant="h5" sx={{ mb: 2, mt: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            Analytics IA
          </Typography>
          {aiAnalytics && Object.keys(aiAnalytics).length > 0 && aiAnalytics.totalDocumentsAnalyzed > 0 ? (
            <>

          {/* Métriques IA */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Documents analysés
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {aiAnalytics.totalDocumentsAnalyzed}
                      </Typography>
                    </Box>
                    <AIIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Score sentiment moyen
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {aiAnalytics.averageSentimentScore || 'N/A'}
                      </Typography>
                    </Box>
                    <SentimentIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Top entités
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {aiAnalytics.topPersonnes?.length + aiAnalytics.topOrganizations?.length || 0}
                      </Typography>
                    </Box>
                    <BusinessIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Tags uniques
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {Object.keys(aiAnalytics.tags || {}).length}
                      </Typography>
                    </Box>
                    <TagIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Graphiques Analytics IA */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Distribution des sentiments */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SentimentIcon color="primary" />
                    Distribution des sentiments
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Doughnut
                      data={{
                        labels: ['Positif', 'Neutre', 'Négatif'],
                        datasets: [
                          {
                            data: [
                              aiAnalytics.sentiment?.positif || 0,
                              aiAnalytics.sentiment?.neutre || 0,
                              aiAnalytics.sentiment?.négatif || 0,
                            ],
                            backgroundColor: [
                              'rgba(76, 175, 80, 0.8)',
                              'rgba(158, 158, 158, 0.8)',
                              'rgba(244, 67, 54, 0.8)',
                            ],
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Complexité des documents */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InsightsIcon color="primary" />
                    Complexité des documents
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={{
                        labels: ['Simple', 'Moyen', 'Complexe'],
                        datasets: [
                          {
                            label: 'Nombre de documents',
                            data: [
                              aiAnalytics.complexity?.simple || 0,
                              aiAnalytics.complexity?.moyen || 0,
                              aiAnalytics.complexity?.complexe || 0,
                            ],
                            backgroundColor: [
                              'rgba(76, 175, 80, 0.8)',
                              'rgba(255, 152, 0, 0.8)',
                              'rgba(244, 67, 54, 0.8)',
                            ],
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Catégories */}
            {Object.keys(aiAnalytics.categories || {}).length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CategoryIcon color="primary" />
                      Catégories de documents
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={{
                          labels: Object.keys(aiAnalytics.categories).slice(0, 10),
                          datasets: [
                            {
                              label: 'Nombre',
                              data: Object.values(aiAnalytics.categories).slice(0, 10),
                              backgroundColor: 'rgba(33, 150, 243, 0.8)',
                            },
                          ],
                        }}
                        options={chartOptions}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Documents analysés par mois */}
            {Object.keys(aiAnalytics.documentsByMonth || {}).length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Documents analysés par mois
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Line
                        data={{
                          labels: Object.keys(aiAnalytics.documentsByMonth)
                            .sort()
                            .slice(-6)
                            .map(month => {
                              const [year, m] = month.split('-');
                              return new Date(year, m - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                            }),
                          datasets: [
                            {
                              label: 'Documents',
                              data: Object.keys(aiAnalytics.documentsByMonth)
                                .sort()
                                .slice(-6)
                                .map(month => aiAnalytics.documentsByMonth[month]),
                              borderColor: 'rgb(33, 150, 243)',
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                              fill: true,
                              tension: 0.4,
                            },
                          ],
                        }}
                        options={chartOptions}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Top entités et tags */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Top personnes */}
            {aiAnalytics.topPersonnes && aiAnalytics.topPersonnes.length > 0 && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon color="primary" />
                      Top Personnes
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {aiAnalytics.topPersonnes.slice(0, 10).map((person, index) => (
                        <Box key={person.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
                          <Typography variant="body2">
                            {index + 1}. {person.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {person.count}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Top organisations */}
            {aiAnalytics.topOrganizations && aiAnalytics.topOrganizations.length > 0 && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon color="primary" />
                      Top Organisations
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {aiAnalytics.topOrganizations.slice(0, 10).map((org, index) => (
                        <Box key={org.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
                          <Typography variant="body2">
                            {index + 1}. {org.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {org.count}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Top tags */}
            {aiAnalytics.topTags && aiAnalytics.topTags.length > 0 && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TagIcon color="primary" />
                      Top Tags
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {aiAnalytics.topTags.slice(0, 15).map((tag, index) => (
                        <Box key={tag.tag} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
                          <Typography variant="body2">
                            {index + 1}. {tag.tag}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {tag.count}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Risques et opportunités */}
          {(aiAnalytics.topRisks?.length > 0 || aiAnalytics.topOpportunities?.length > 0) && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {aiAnalytics.topRisks && aiAnalytics.topRisks.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="error" />
                        Top Risques identifiés
                      </Typography>
                      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {aiAnalytics.topRisks.slice(0, 10).map((risk, index) => (
                          <Box key={risk.risk} sx={{ mb: 1, p: 1.5, borderRadius: 1, bgcolor: 'error.50', borderLeft: '3px solid', borderColor: 'error.main' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {index + 1}. {risk.risk}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Mentionné {risk.count} fois
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {aiAnalytics.topOpportunities && aiAnalytics.topOpportunities.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="success" />
                        Top Opportunités identifiées
                      </Typography>
                      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {aiAnalytics.topOpportunities.slice(0, 10).map((opp, index) => (
                          <Box key={opp.opportunity} sx={{ mb: 1, p: 1.5, borderRadius: 1, bgcolor: 'success.50', borderLeft: '3px solid', borderColor: 'success.main' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {index + 1}. {opp.opportunity}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Mentionné {opp.count} fois
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
            </>
          ) : (
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Aucune donnée d'analytics IA disponible
                </Typography>
                <Typography variant="body2">
                  Les analytics apparaîtront une fois que des documents auront été analysés par l'IA. 
                  Vous pouvez lancer une analyse complète depuis la page de visualisation d'un document.
                </Typography>
              </Alert>
            </Box>
          )}
        </>
      )}

      {/* Loading state pour Analytics IA */}
      {aiLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Chargement des analytics IA...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Analytics par Projet */}
      {projectsAnalytics && !projectsLoading && projectsAnalytics.projects && projectsAnalytics.projects.length > 0 && (
        <>
          <Typography variant="h5" sx={{ mb: 2, mt: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon color="primary" />
            Analytics par Projet
          </Typography>

          {/* Résumé global */}
          {projectsAnalytics.globalSummary && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Projets totaux
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {projectsAnalytics.globalSummary.totalProjects}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Documents totaux
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {projectsAnalytics.globalSummary.totalDocuments}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Score de santé moyen
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {projectsAnalytics.globalSummary.averageHealthScore}/100
                    </Typography>
                    <LinearProgressBar 
                      variant="determinate" 
                      value={parseFloat(projectsAnalytics.globalSummary.averageHealthScore)} 
                      sx={{ mt: 1, height: 8, borderRadius: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Projets en bonne santé
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {projectsAnalytics.globalSummary.projectsWithHighHealth}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {projectsAnalytics.globalSummary.projectsNeedingAttention} nécessitent attention
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Liste des projets avec analytics */}
          <Box sx={{ mb: 3 }}>
            {projectsAnalytics.projects.map((project) => (
              <Accordion key={project.projectId} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <FolderIcon color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{project.projectName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.totalDocuments} document(s) • {project.documentsWithAI} analysé(s) par IA
                      </Typography>
                    </Box>
                    <Chip 
                      label={`Santé: ${project.healthScore}/100`}
                      color={project.healthScore >= 70 ? 'success' : project.healthScore >= 50 ? 'warning' : 'error'}
                      sx={{ mr: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Résumé du projet */}
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssessmentIcon color="primary" />
                            Résumé du Projet
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {project.summary}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Insights */}
                    {project.insights && project.insights.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          Insights
                        </Typography>
                        {project.insights.map((insight, index) => (
                          <Alert 
                            key={index} 
                            severity={insight.type} 
                            sx={{ mb: 1 }}
                            icon={insight.type === 'success' ? <CheckCircleIcon /> : insight.type === 'warning' ? <WarningIcon /> : <InfoIcon />}
                          >
                            {insight.message}
                          </Alert>
                        ))}
                      </Grid>
                    )}

                    {/* Statistiques */}
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Statistiques
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Documents totaux
                              </Typography>
                              <Typography variant="h6">{project.totalDocuments}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Avec analyse IA
                              </Typography>
                              <Typography variant="h6">
                                {project.documentsWithAI} ({project.totalDocuments > 0 ? Math.round((project.documentsWithAI / project.totalDocuments) * 100) : 0}%)
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Note moyenne
                              </Typography>
                              <Typography variant="h6">{project.averageRating || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Score sentiment
                              </Typography>
                              <Typography variant="h6">{project.sentiment.averageScore || 'N/A'}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Sentiment */}
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Distribution des sentiments
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">Positif</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {project.sentiment.positif}
                                </Typography>
                              </Box>
                              <LinearProgressBar 
                                variant="determinate" 
                                value={project.totalDocuments > 0 ? (project.sentiment.positif / project.totalDocuments) * 100 : 0}
                                sx={{ height: 8, borderRadius: 1, bgcolor: 'grey.200' }}
                                color="success"
                              />
                            </Box>
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">Neutre</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {project.sentiment.neutre}
                                </Typography>
                              </Box>
                              <LinearProgressBar 
                                variant="determinate" 
                                value={project.totalDocuments > 0 ? (project.sentiment.neutre / project.totalDocuments) * 100 : 0}
                                sx={{ height: 8, borderRadius: 1, bgcolor: 'grey.200' }}
                              />
                            </Box>
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">Négatif</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                  {project.sentiment.négatif}
                                </Typography>
                              </Box>
                              <LinearProgressBar 
                                variant="determinate" 
                                value={project.totalDocuments > 0 ? (project.sentiment.négatif / project.totalDocuments) * 100 : 0}
                                sx={{ height: 8, borderRadius: 1, bgcolor: 'grey.200' }}
                                color="error"
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Top Tags */}
                    {project.topTags && project.topTags.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TagIcon color="primary" />
                              Top Tags
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {project.topTags.map((tag) => (
                                <Chip
                                  key={tag.tag}
                                  label={`${tag.tag} (${tag.count})`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Top Personnes */}
                    {project.topPersonnes && project.topPersonnes.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon color="primary" />
                              Top Personnes
                            </Typography>
                            <List dense>
                              {project.topPersonnes.map((person, index) => (
                                <ListItem key={person.name}>
                                  <ListItemIcon>
                                    <Chip label={index + 1} size="small" color="primary" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={person.name}
                                    secondary={`Mentionné ${person.count} fois`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Top Organisations */}
                    {project.topOrganizations && project.topOrganizations.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BusinessIcon color="primary" />
                              Top Organisations
                            </Typography>
                            <List dense>
                              {project.topOrganizations.map((org, index) => (
                                <ListItem key={org.name}>
                                  <ListItemIcon>
                                    <Chip label={index + 1} size="small" color="primary" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={org.name}
                                    secondary={`Mentionné ${org.count} fois`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Risques et Opportunités */}
                    {(project.topRisks && project.topRisks.length > 0) || (project.topOpportunities && project.topOpportunities.length > 0) && (
                      <>
                        {project.topRisks && project.topRisks.length > 0 && (
                          <Grid item xs={12} md={6}>
                            <Card>
                              <CardContent>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <WarningIcon color="error" />
                                  Top Risques
                                </Typography>
                                <List dense>
                                  {project.topRisks.map((risk, index) => (
                                    <ListItem key={risk.risk}>
                                      <ListItemIcon>
                                        <Chip label={index + 1} size="small" color="error" />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={risk.risk}
                                        secondary={`Mentionné ${risk.count} fois`}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </CardContent>
                            </Card>
                          </Grid>
                        )}

                        {project.topOpportunities && project.topOpportunities.length > 0 && (
                          <Grid item xs={12} md={6}>
                            <Card>
                              <CardContent>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CheckCircleIcon color="success" />
                                  Top Opportunités
                                </Typography>
                                <List dense>
                                  {project.topOpportunities.map((opp, index) => (
                                    <ListItem key={opp.opportunity}>
                                      <ListItemIcon>
                                        <Chip label={index + 1} size="small" color="success" />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={opp.opportunity}
                                        secondary={`Mentionné ${opp.count} fois`}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </CardContent>
                            </Card>
                          </Grid>
                        )}
                      </>
                    )}

                    {/* Top Contributeurs */}
                    {project.topContributors && project.topContributors.length > 0 && (
                      <Grid item xs={12}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon color="primary" />
                              Top Contributeurs
                            </Typography>
                            <List>
                              {project.topContributors.map((contributor, index) => (
                                <ListItem key={contributor.email || index}>
                                  <ListItemIcon>
                                    <Chip label={index + 1} size="small" color="primary" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={contributor.name}
                                    secondary={contributor.email}
                                  />
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {contributor.count} document(s)
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </>
      )}

      {/* Graphiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Documents par mois</Typography>
              </Box>
              <Box sx={{ height: 300 }}>
                {stats.documentsPerMonth && stats.documentsPerMonth.length > 0 ? (
                  <Line
                    data={{
                      labels: stats.documentsPerMonth.map(item => {
                        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                        return `${monthNames[item._id.month - 1]} ${item._id.year}`;
                      }),
                      datasets: [
                        {
                          label: 'Documents',
                          data: stats.documentsPerMonth.map(item => item.count),
                          borderColor: 'rgb(255, 99, 132)',
                          backgroundColor: 'rgba(255, 99, 132, 0.1)',
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">Aucune donnée disponible</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Statistiques générales
              </Typography>
              <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="h4">{stats.totalDocuments || 0}</Typography>
                  <Typography variant="caption">Documents totaux</Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'warning.main', color: 'white' }}>
                  <Typography variant="h4">{stats.newUploads || 0}</Typography>
                  <Typography variant="caption">Nouveaux aujourd'hui</Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'success.main', color: 'white' }}>
                  <Typography variant="h4">{stats.aiSummaries || 0}</Typography>
                  <Typography variant="caption">Résumés IA générés</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Box>
  );
};

export default Dashboard;

