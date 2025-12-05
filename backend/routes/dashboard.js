const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/dashboard/stats
// @desc    Obtenir les statistiques du tableau de bord
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Total des documents
    const totalDocuments = await Document.countDocuments();
    
    // Nouveaux uploads aujourd'hui
    const newUploads = await Document.countDocuments({
      createdAt: { $gte: startOfToday },
    });
    
    // Utilisateurs actifs (connectés dans les 24 dernières heures)
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    
    // Résumés IA générés
    const aiSummaries = await Document.countDocuments({
      'aiSummary.summary': { $exists: true, $ne: null },
    });
    
    // Documents par mois (derniers 6 mois)
    const documentsPerMonth = await Document.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);
    
    // Documents les plus vus (basé sur le rating)
    const topDocuments = await Document.find({
      'aiSummary.rating': { $exists: true },
    })
      .sort({ 'aiSummary.rating': -1 })
      .limit(5)
      .populate('uploadedBy', 'name');
    
    res.json({
      success: true,
      data: {
        totalDocuments,
        newUploads,
        activeUsers,
        aiSummaries,
        documentsPerMonth,
        topDocuments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/dashboard/analytics
// @desc    Obtenir les données analytiques détaillées
// @access  Private/Admin
router.get('/analytics', async (req, res) => {
  try {
    // Documents par type
    const documentsByType = await Document.aggregate([
      {
        $group: {
          _id: '$mimeType',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Documents par utilisateur
    const documentsByUser = await Document.aggregate([
      {
        $group: {
          _id: '$uploadedBy',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          name: '$user.name',
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);
    
    // Moyenne des notes IA
    const aiRatingsAvg = await Document.aggregate([
      {
        $match: {
          'aiSummary.rating': { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$aiSummary.rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);
    
    res.json({
      success: true,
      data: {
        documentsByType,
        documentsByUser,
        aiRatings: aiRatingsAvg[0] || { avgRating: 0, totalRatings: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/dashboard/ai-analytics
// @desc    Obtenir les analytics IA agrégées pour le dashboard
// @access  Private
router.get('/ai-analytics', async (req, res) => {
  try {
    const Document = require('../models/Document');
    
    // Récupérer tous les documents avec analytics IA
    const documents = await Document.find({
      $or: [
        { 'aiSummary.summary': { $exists: true, $ne: null } },
        { 'aiEntities.personnes': { $exists: true, $ne: [] } },
        { 'aiSentiment.sentiment': { $exists: true, $ne: null } },
        { 'aiAnalytics.complexity': { $exists: true, $ne: null } },
      ],
    })
      .populate('uploadedBy', 'name email')
      .select('aiSummary aiEntities aiSentiment aiAnalytics tags createdAt category project');

    console.log(`📊 [DASHBOARD] ${documents.length} document(s) avec analytics IA trouvé(s)`);

    // Initialiser les structures de données
    const analytics = {
      sentiment: {
        positif: 0,
        neutre: 0,
        négatif: 0,
        distribution: [],
      },
      entities: {
        personnes: {},
        organizations: {},
        locations: {},
        dates: [],
        amounts: [],
        keywords: {},
        themes: {},
      },
      categories: {},
      tags: {},
      complexity: {
        simple: 0,
        moyen: 0,
        complexe: 0,
      },
      sectors: {},
      risks: [],
      opportunities: [],
      documentsByMonth: {},
      averageSentimentScore: 0,
      totalDocumentsAnalyzed: documents.length,
    };

    let totalSentimentScore = 0;
    let sentimentCount = 0;

    // Parcourir tous les documents
    documents.forEach(doc => {
      // Sentiment
      if (doc.aiSentiment?.sentiment) {
        const sentiment = doc.aiSentiment.sentiment.toLowerCase();
        if (sentiment.includes('positif') || sentiment.includes('positive')) {
          analytics.sentiment.positif++;
        } else if (sentiment.includes('négatif') || sentiment.includes('negative')) {
          analytics.sentiment.négatif++;
        } else {
          analytics.sentiment.neutre++;
        }
        
        if (doc.aiSentiment.sentiment_score) {
          totalSentimentScore += doc.aiSentiment.sentiment_score;
          sentimentCount++;
        }
      }

      // Entités
      if (doc.aiEntities) {
        if (doc.aiEntities.personnes && Array.isArray(doc.aiEntities.personnes)) {
          doc.aiEntities.personnes.forEach(person => {
            analytics.entities.personnes[person] = (analytics.entities.personnes[person] || 0) + 1;
          });
        }
        if (doc.aiEntities.organizations && Array.isArray(doc.aiEntities.organizations)) {
          doc.aiEntities.organizations.forEach(org => {
            analytics.entities.organizations[org] = (analytics.entities.organizations[org] || 0) + 1;
          });
        }
        if (doc.aiEntities.locations && Array.isArray(doc.aiEntities.locations)) {
          doc.aiEntities.locations.forEach(location => {
            analytics.entities.locations[location] = (analytics.entities.locations[location] || 0) + 1;
          });
        }
        if (doc.aiEntities.keywords && Array.isArray(doc.aiEntities.keywords)) {
          doc.aiEntities.keywords.forEach(keyword => {
            analytics.entities.keywords[keyword] = (analytics.entities.keywords[keyword] || 0) + 1;
          });
        }
        if (doc.aiEntities.themes && Array.isArray(doc.aiEntities.themes)) {
          doc.aiEntities.themes.forEach(theme => {
            analytics.entities.themes[theme] = (analytics.entities.themes[theme] || 0) + 1;
          });
        }
      }

      // Catégories
      if (doc.aiSummary?.category) {
        analytics.categories[doc.aiSummary.category] = (analytics.categories[doc.aiSummary.category] || 0) + 1;
      }

      // Tags
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach(tag => {
          analytics.tags[tag] = (analytics.tags[tag] || 0) + 1;
        });
      }

      // Complexité
      if (doc.aiAnalytics?.complexity) {
        const complexity = doc.aiAnalytics.complexity.toLowerCase();
        if (complexity.includes('simple')) {
          analytics.complexity.simple++;
        } else if (complexity.includes('complexe') || complexity.includes('complex')) {
          analytics.complexity.complexe++;
        } else {
          analytics.complexity.moyen++;
        }
      }

      // Secteurs
      if (doc.aiAnalytics?.sector) {
        analytics.sectors[doc.aiAnalytics.sector] = (analytics.sectors[doc.aiAnalytics.sector] || 0) + 1;
      }

      // Risques et opportunités
      if (doc.aiAnalytics?.risks && Array.isArray(doc.aiAnalytics.risks)) {
        analytics.risks.push(...doc.aiAnalytics.risks);
      }
      if (doc.aiAnalytics?.opportunities && Array.isArray(doc.aiAnalytics.opportunities)) {
        analytics.opportunities.push(...doc.aiAnalytics.opportunities);
      }

      // Documents par mois
      if (doc.createdAt) {
        const month = new Date(doc.createdAt).toISOString().substring(0, 7);
        analytics.documentsByMonth[month] = (analytics.documentsByMonth[month] || 0) + 1;
      }
    });

    // Calculer la moyenne du sentiment
    analytics.averageSentimentScore = sentimentCount > 0 
      ? (totalSentimentScore / sentimentCount).toFixed(2) 
      : 0;

    // Trier et limiter les top entités
    analytics.topPersonnes = Object.entries(analytics.entities.personnes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    analytics.topOrganizations = Object.entries(analytics.entities.organizations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    analytics.topLocations = Object.entries(analytics.entities.locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    analytics.topKeywords = Object.entries(analytics.entities.keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([keyword, count]) => ({ keyword, count }));

    analytics.topThemes = Object.entries(analytics.entities.themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));

    analytics.topTags = Object.entries(analytics.tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    // Top risques et opportunités (les plus fréquents)
    const riskCounts = {};
    analytics.risks.forEach(risk => {
      riskCounts[risk] = (riskCounts[risk] || 0) + 1;
    });
    analytics.topRisks = Object.entries(riskCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([risk, count]) => ({ risk, count }));

    const opportunityCounts = {};
    analytics.opportunities.forEach(opp => {
      opportunityCounts[opp] = (opportunityCounts[opp] || 0) + 1;
    });
    analytics.topOpportunities = Object.entries(opportunityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([opportunity, count]) => ({ opportunity, count }));

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('❌ [DASHBOARD] Erreur analytics IA:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/dashboard/projects-analytics
// @desc    Obtenir les analytics par projet avec résumés
// @access  Private
router.get('/projects-analytics', async (req, res) => {
  try {
    const Document = require('../models/Document');
    const Project = require('../models/Project');
    const ProjectAccess = require('../models/ProjectAccess');
    const mongoose = require('mongoose');

    // Récupérer tous les projets accessibles
    let query = { isActive: true };
    
    if (req.user.role !== 'admin') {
      const userAccesses = await ProjectAccess.find({ user: req.user.id });
      const projectIds = userAccesses.map(access => access.project.toString());
      
      const userProjects = await Project.find({ createdBy: req.user.id }).select('_id').lean();
      projectIds.push(...userProjects.map(p => p._id.toString()));
      
      const publicProjects = await Project.find({ 
        isActive: true,
        'settings.allowPublicRead': true 
      }).select('_id').lean();
      projectIds.push(...publicProjects.map(p => p._id.toString()));
      
      if (projectIds.length === 0) {
        return res.json({
          success: true,
          data: [],
        });
      }
      
      const uniqueProjectIds = [...new Set(projectIds)].map(id => new mongoose.Types.ObjectId(id));
      query._id = { $in: uniqueProjectIds };
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Pour chaque projet, calculer les analytics
    const projectsAnalytics = await Promise.all(
      projects.map(async (project) => {
        const documents = await Document.find({ project: project._id })
          .populate('uploadedBy', 'name email')
          .select('aiSummary aiEntities aiSentiment aiAnalytics tags createdAt size');

        const projectStats = {
          projectId: project._id,
          projectName: project.name,
          projectDescription: project.description,
          createdBy: {
            name: project.createdBy.name,
            email: project.createdBy.email,
          },
          createdAt: project.createdAt,
          totalDocuments: documents.length,
          totalSize: documents.reduce((sum, doc) => sum + (doc.size || 0), 0),
          documentsWithAI: documents.filter(doc => doc.aiSummary?.summary).length,
          averageRating: 0,
          sentiment: {
            positif: 0,
            neutre: 0,
            négatif: 0,
            averageScore: 0,
          },
          categories: {},
          topTags: {},
          topPersonnes: {},
          topOrganizations: {},
          complexity: {
            simple: 0,
            moyen: 0,
            complexe: 0,
          },
          sectors: {},
          risks: [],
          opportunities: [],
          documentsByMonth: {},
          topContributors: {},
          summary: '',
          insights: [],
          healthScore: 0,
        };

        let totalRatings = 0;
        let ratingCount = 0;
        let totalSentimentScore = 0;
        let sentimentCount = 0;

        documents.forEach(doc => {
          // Ratings
          if (doc.aiSummary?.rating) {
            totalRatings += doc.aiSummary.rating;
            ratingCount++;
          }

          // Sentiment
          if (doc.aiSentiment?.sentiment) {
            const sentiment = doc.aiSentiment.sentiment.toLowerCase();
            if (sentiment.includes('positif') || sentiment.includes('positive')) {
              projectStats.sentiment.positif++;
            } else if (sentiment.includes('négatif') || sentiment.includes('negative')) {
              projectStats.sentiment.négatif++;
            } else {
              projectStats.sentiment.neutre++;
            }
            
            if (doc.aiSentiment.sentiment_score) {
              totalSentimentScore += doc.aiSentiment.sentiment_score;
              sentimentCount++;
            }
          }

          // Catégories
          if (doc.aiSummary?.category) {
            projectStats.categories[doc.aiSummary.category] = 
              (projectStats.categories[doc.aiSummary.category] || 0) + 1;
          }

          // Tags
          if (doc.tags && Array.isArray(doc.tags)) {
            doc.tags.forEach(tag => {
              projectStats.topTags[tag] = (projectStats.topTags[tag] || 0) + 1;
            });
          }

          // Entités
          if (doc.aiEntities) {
            if (doc.aiEntities.personnes && Array.isArray(doc.aiEntities.personnes)) {
              doc.aiEntities.personnes.forEach(person => {
                projectStats.topPersonnes[person] = (projectStats.topPersonnes[person] || 0) + 1;
              });
            }
            if (doc.aiEntities.organizations && Array.isArray(doc.aiEntities.organizations)) {
              doc.aiEntities.organizations.forEach(org => {
                projectStats.topOrganizations[org] = (projectStats.topOrganizations[org] || 0) + 1;
              });
            }
          }

          // Complexité
          if (doc.aiAnalytics?.complexity) {
            const complexity = doc.aiAnalytics.complexity.toLowerCase();
            if (complexity.includes('simple')) {
              projectStats.complexity.simple++;
            } else if (complexity.includes('complexe') || complexity.includes('complex')) {
              projectStats.complexity.complexe++;
            } else {
              projectStats.complexity.moyen++;
            }
          }

          // Secteurs
          if (doc.aiAnalytics?.sector) {
            projectStats.sectors[doc.aiAnalytics.sector] = 
              (projectStats.sectors[doc.aiAnalytics.sector] || 0) + 1;
          }

          // Risques et opportunités
          if (doc.aiAnalytics?.risks && Array.isArray(doc.aiAnalytics.risks)) {
            projectStats.risks.push(...doc.aiAnalytics.risks);
          }
          if (doc.aiAnalytics?.opportunities && Array.isArray(doc.aiAnalytics.opportunities)) {
            projectStats.opportunities.push(...doc.aiAnalytics.opportunities);
          }

          // Documents par mois
          if (doc.createdAt) {
            const month = new Date(doc.createdAt).toISOString().substring(0, 7);
            projectStats.documentsByMonth[month] = (projectStats.documentsByMonth[month] || 0) + 1;
          }

          // Top contributeurs
          if (doc.uploadedBy) {
            const userId = doc.uploadedBy._id?.toString() || doc.uploadedBy.toString();
            if (!projectStats.topContributors[userId]) {
              projectStats.topContributors[userId] = {
                name: doc.uploadedBy.name || 'Inconnu',
                email: doc.uploadedBy.email || '',
                count: 0,
              };
            }
            projectStats.topContributors[userId].count++;
          }
        });

        // Calculer les moyennes
        projectStats.averageRating = ratingCount > 0 
          ? (totalRatings / ratingCount).toFixed(2) 
          : 0;
        projectStats.sentiment.averageScore = sentimentCount > 0 
          ? (totalSentimentScore / sentimentCount).toFixed(2) 
          : 0;

        // Trier les top entités
        projectStats.topPersonnes = Object.entries(projectStats.topPersonnes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        projectStats.topOrganizations = Object.entries(projectStats.topOrganizations)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        projectStats.topTags = Object.entries(projectStats.topTags)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag, count]) => ({ tag, count }));

        projectStats.topContributors = Object.values(projectStats.topContributors)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Top risques et opportunités
        const riskCounts = {};
        projectStats.risks.forEach(risk => {
          riskCounts[risk] = (riskCounts[risk] || 0) + 1;
        });
        projectStats.topRisks = Object.entries(riskCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([risk, count]) => ({ risk, count }));

        const opportunityCounts = {};
        projectStats.opportunities.forEach(opp => {
          opportunityCounts[opp] = (opportunityCounts[opp] || 0) + 1;
        });
        projectStats.topOpportunities = Object.entries(opportunityCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([opportunity, count]) => ({ opportunity, count }));

        // Générer un résumé du projet
        const aiCoverage = projectStats.totalDocuments > 0 
          ? ((projectStats.documentsWithAI / projectStats.totalDocuments) * 100).toFixed(0)
          : 0;
        
        const dominantCategory = Object.keys(projectStats.categories).length > 0
          ? Object.entries(projectStats.categories).sort((a, b) => b[1] - a[1])[0][0]
          : 'Non défini';

        const dominantSentiment = projectStats.sentiment.positif > projectStats.sentiment.négatif
          ? 'positif'
          : projectStats.sentiment.négatif > projectStats.sentiment.positif
          ? 'négatif'
          : 'neutre';

        projectStats.summary = `Le projet "${project.name}" contient ${projectStats.totalDocuments} document(s), dont ${projectStats.documentsWithAI} analysé(s) par l'IA (${aiCoverage}% de couverture). ` +
          `La catégorie dominante est "${dominantCategory}" et le sentiment général est ${dominantSentiment}. ` +
          `${projectStats.topRisks.length > 0 ? `${projectStats.topRisks.length} risque(s) principal(aux) identifié(s). ` : ''}` +
          `${projectStats.topOpportunities.length > 0 ? `${projectStats.topOpportunities.length} opportunité(s) identifiée(s).` : ''}`;

        // Générer des insights
        projectStats.insights = [];
        
        if (parseFloat(aiCoverage) < 50) {
          projectStats.insights.push({
            type: 'warning',
            message: `Seulement ${aiCoverage}% des documents sont analysés par l'IA. Considérez lancer des analyses complètes.`,
          });
        }

        if (projectStats.sentiment.négatif > projectStats.sentiment.positif) {
          projectStats.insights.push({
            type: 'warning',
            message: 'Le sentiment général est négatif. Une attention particulière est recommandée.',
          });
        }

        if (projectStats.topRisks.length > 0) {
          projectStats.insights.push({
            type: 'info',
            message: `${projectStats.topRisks.length} risque(s) principal(aux) identifié(s) nécessitant une attention.`,
          });
        }

        if (projectStats.topOpportunities.length > 0) {
          projectStats.insights.push({
            type: 'success',
            message: `${projectStats.topOpportunities.length} opportunité(s) identifiée(s) à explorer.`,
          });
        }

        if (projectStats.totalDocuments === 0) {
          projectStats.insights.push({
            type: 'info',
            message: 'Aucun document dans ce projet. Commencez par uploader des documents.',
          });
        }

        // Calculer un score de santé du projet (0-100)
        let healthScore = 0;
        if (projectStats.totalDocuments > 0) {
          healthScore += Math.min(parseFloat(aiCoverage), 30); // Max 30 points pour la couverture IA
          healthScore += projectStats.sentiment.positif > projectStats.sentiment.négatif ? 20 : 10; // 20 points si sentiment positif
          healthScore += projectStats.topOpportunities.length > 0 ? 20 : 0; // 20 points si opportunités
          healthScore += projectStats.topRisks.length < 3 ? 15 : 5; // 15 points si peu de risques
          healthScore += projectStats.totalDocuments >= 5 ? 15 : projectStats.totalDocuments * 3; // 15 points si assez de documents
        }
        projectStats.healthScore = Math.min(healthScore, 100);

        return projectStats;
      })
    );

    // Trier par score de santé décroissant
    projectsAnalytics.sort((a, b) => b.healthScore - a.healthScore);

    // Générer un résumé global
    const globalSummary = {
      totalProjects: projectsAnalytics.length,
      totalDocuments: projectsAnalytics.reduce((sum, p) => sum + p.totalDocuments, 0),
      averageHealthScore: projectsAnalytics.length > 0
        ? (projectsAnalytics.reduce((sum, p) => sum + p.healthScore, 0) / projectsAnalytics.length).toFixed(1)
        : 0,
      projectsWithHighHealth: projectsAnalytics.filter(p => p.healthScore >= 70).length,
      projectsNeedingAttention: projectsAnalytics.filter(p => p.healthScore < 50).length,
    };

    res.json({
      success: true,
      data: {
        projects: projectsAnalytics,
        globalSummary,
      },
    });
  } catch (error) {
    console.error('❌ [DASHBOARD] Erreur analytics projets:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;

