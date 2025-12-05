const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

// Importer les modèles
const User = require('../models/User');
const Project = require('../models/Project');
const Document = require('../models/Document');
const connectDB = require('../config/database');

/**
 * Script de seed pour créer 3 projets avec des documents fictifs
 */
const seedProjects = async () => {
  try {
    console.log('\n🌱 [SEED-PROJECTS] Démarrage du script de seed des projets');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Connexion à la base de données
    await connectDB();
    console.log('✅ [SEED-PROJECTS] Connexion à MongoDB réussie\n');

    // Récupérer ou créer un utilisateur admin
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️  [SEED-PROJECTS] Aucun admin trouvé, création d\'un admin par défaut...');
      adminUser = await User.create({
        name: 'Administrateur',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      });
      console.log('✅ [SEED-PROJECTS] Admin créé:', adminUser.email);
    } else {
      console.log('✅ [SEED-PROJECTS] Admin trouvé:', adminUser.email);
    }
    console.log('');

    // Données des projets à créer
    const projectsData = [
      {
        name: 'Projet Alpha - Gestion Financière',
        description: 'Projet de gestion financière et comptabilité pour le trimestre Q1 2024. Analyse des budgets, rapports financiers et prévisions.',
        documents: [
          {
            filename: 'rapport-financier-q1-2024.pdf',
            originalName: 'Rapport Financier Q1 2024.pdf',
            mimeType: 'application/pdf',
            size: 2456789,
            mayanId: `local-seed-${Date.now()}-${Math.random().toString(36).substring(7)}-1`,
            tags: ['finances', 'rapport', 'Q1-2024', 'budget'],
            metadata: {
              'Auteur': 'Service Comptabilité',
              'Date': '2024-03-31',
              'Version': '1.0',
            },
            aiSummary: {
              summary: 'Rapport financier détaillé du premier trimestre 2024 présentant les revenus, dépenses et projections budgétaires. Le rapport montre une croissance de 15% par rapport au trimestre précédent.',
              keyPoints: [
                'Revenus totaux: 2.5M EUR',
                'Dépenses opérationnelles: 1.8M EUR',
                'Bénéfice net: 700K EUR',
                'Croissance de 15% par rapport à Q4 2023',
                'Projetions Q2: 2.7M EUR prévus',
              ],
              category: 'Rapport Financier',
              language: 'fr',
              generatedAt: new Date(),
              rating: 4,
            },
            aiEntities: {
              personnes: ['Jean Dupont', 'Marie Martin', 'Pierre Durand'],
              organizations: ['Service Comptabilité', 'Direction Financière'],
              dates: ['2024-01-01', '2024-03-31', '2024-06-30'],
              locations: ['Paris', 'France'],
              amounts: ['2500000 EUR', '1800000 EUR', '700000 EUR'],
              keywords: ['budget', 'revenus', 'dépenses', 'bénéfice', 'croissance'],
              themes: ['Finance', 'Comptabilité', 'Analyse budgétaire'],
            },
            aiSentiment: {
              sentiment: 'positif',
              sentiment_score: 0.75,
              ton: 'formel',
              confidence_level: 8,
              emotions: ['confiance', 'optimisme'],
              summary: 'Rapport positif avec des indicateurs financiers solides',
            },
            aiAnalytics: {
              complexity: 'moyen',
              word_count_estimate: 3500,
              paragraph_count_estimate: 45,
              document_type: 'Rapport Financier Trimestriel',
              sector: 'Finance',
              recommendations: [
                'Maintenir la croissance actuelle',
                'Optimiser les dépenses opérationnelles',
                'Investir dans les projets à fort potentiel',
              ],
              risks: [
                'Fluctuations du marché',
                'Augmentation des coûts opérationnels',
              ],
              opportunities: [
                'Expansion sur de nouveaux marchés',
                'Optimisation fiscale',
              ],
              next_steps: [
                'Présentation au conseil d\'administration',
                'Validation des budgets Q2',
                'Mise à jour des projections annuelles',
              ],
              insights: 'Performance financière solide avec une croissance constante et des perspectives positives pour le trimestre suivant.',
            },
          },
          {
            filename: 'budget-2024.xlsx',
            originalName: 'Budget Annuel 2024.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 156789,
            mayanId: `local-seed-${Date.now()}-${Math.random().toString(36).substring(7)}-2`,
            tags: ['budget', '2024', 'planification', 'excel'],
            metadata: {
              'Créé par': 'Service Comptabilité',
              'Date de création': '2024-01-15',
              'Version': '2.1',
            },
            aiSummary: {
              summary: 'Tableur Excel contenant le budget détaillé pour l\'année 2024, incluant les prévisions par département et les allocations de ressources.',
              keyPoints: [
                'Budget total: 12M EUR',
                'Répartition par département',
                'Allocations trimestrielles',
                'Réserves d\'urgence: 1.2M EUR',
                'Marge de manœuvre: 5%',
              ],
              category: 'Budget',
              language: 'fr',
              generatedAt: new Date(),
              rating: 5,
            },
            aiEntities: {
              personnes: ['Sophie Bernard', 'Thomas Leroy'],
              organizations: ['Direction Générale', 'Service Comptabilité'],
              dates: ['2024-01-01', '2024-12-31'],
              locations: ['Siège social'],
              amounts: ['12000000 EUR', '1200000 EUR'],
              keywords: ['budget', 'allocation', 'ressources', 'planification'],
              themes: ['Planification budgétaire', 'Gestion des ressources'],
            },
            aiSentiment: {
              sentiment: 'neutre',
              sentiment_score: 0.5,
              ton: 'technique',
              confidence_level: 7,
              emotions: ['neutralité'],
              summary: 'Document technique et factuel',
            },
            aiAnalytics: {
              complexity: 'simple',
              word_count_estimate: 500,
              paragraph_count_estimate: 0,
              document_type: 'Tableur Budget',
              sector: 'Finance',
              recommendations: [
                'Réviser trimestriellement',
                'Suivre les écarts budgétaires',
              ],
              risks: [],
              opportunities: [
                'Optimisation des allocations',
              ],
              next_steps: [
                'Validation par la direction',
                'Distribution aux départements',
              ],
              insights: 'Budget bien structuré avec une répartition claire des ressources.',
            },
          },
          {
            filename: 'analyse-tendances-marche.docx',
            originalName: 'Analyse des Tendances du Marché.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 987654,
            mayanId: `local-seed-${Date.now()}-${Math.random().toString(36).substring(7)}-3`,
            tags: ['analyse', 'marché', 'tendances', 'stratégie'],
            metadata: {
              'Auteur': 'Service Marketing',
              'Date': '2024-02-20',
              'Confidentialité': 'Interne',
            },
            aiSummary: {
              summary: 'Analyse approfondie des tendances du marché pour 2024, incluant les opportunités de croissance, les défis à anticiper et les recommandations stratégiques.',
              keyPoints: [
                'Croissance du marché: +8% prévue',
                'Nouvelles opportunités dans le secteur tech',
                'Concurrence accrue sur les segments premium',
                'Recommandation: investir dans l\'innovation',
                'Focus sur la transformation digitale',
              ],
              category: 'Analyse de Marché',
              language: 'fr',
              generatedAt: new Date(),
              rating: 4,
            },
            aiEntities: {
              personnes: ['Claire Moreau', 'David Petit'],
              organizations: ['Service Marketing', 'Direction Stratégique'],
              dates: ['2024-01-01', '2024-12-31'],
              locations: ['Europe', 'Amérique du Nord'],
              amounts: [],
              keywords: ['marché', 'tendances', 'croissance', 'innovation', 'stratégie'],
              themes: ['Analyse de marché', 'Stratégie', 'Innovation'],
            },
            aiSentiment: {
              sentiment: 'positif',
              sentiment_score: 0.7,
              ton: 'analytique',
              confidence_level: 8,
              emotions: ['optimisme', 'anticipation'],
              summary: 'Analyse positive avec des opportunités identifiées',
            },
            aiAnalytics: {
              complexity: 'complexe',
              word_count_estimate: 8500,
              paragraph_count_estimate: 120,
              document_type: 'Analyse Stratégique',
              sector: 'Marketing',
              recommendations: [
                'Investir dans la R&D',
                'Renforcer la présence digitale',
                'Développer de nouveaux produits',
              ],
              risks: [
                'Changements réglementaires',
                'Perturbations de la chaîne d\'approvisionnement',
              ],
              opportunities: [
                'Marchés émergents',
                'Partnerships stratégiques',
                'Technologies disruptives',
              ],
              next_steps: [
                'Présentation au comité de direction',
                'Définition du plan d\'action',
                'Allocation des ressources',
              ],
              insights: 'Analyse complète révélant des opportunités significatives de croissance avec une stratégie d\'innovation recommandée.',
            },
          },
        ],
      },
      {
        name: 'Projet Beta - Ressources Humaines',
        description: 'Gestion des ressources humaines, recrutements, évaluations de performance et développement des compétences pour l\'année 2024.',
        documents: [
          {
            filename: 'politique-rh-2024.pdf',
            originalName: 'Politique RH 2024.pdf',
            mimeType: 'application/pdf',
            size: 1234567,
            mayanId: `local-seed-${Date.now()}-${Math.random().toString(36).substring(7)}-4`,
            tags: ['RH', 'politique', '2024', 'ressources-humaines'],
            metadata: {
              'Auteur': 'Direction RH',
              'Date': '2024-01-10',
              'Version': '1.0',
            },
            aiSummary: {
              summary: 'Document présentant les politiques et procédures des ressources humaines pour 2024, incluant les processus de recrutement, évaluation et développement professionnel.',
              keyPoints: [
                'Nouveau processus de recrutement',
                'Programme de formation continue',
                'Système d\'évaluation annuelle',
                'Politique de télétravail',
                'Plan de développement des compétences',
              ],
              category: 'Politique RH',
              language: 'fr',
              generatedAt: new Date(),
              rating: 4,
            },
            aiEntities: {
              personnes: ['Laurence Dubois', 'Marc Lefebvre'],
              organizations: ['Direction RH', 'Service Formation'],
              dates: ['2024-01-01', '2024-12-31'],
              locations: ['Tous sites'],
              amounts: [],
              keywords: ['RH', 'politique', 'recrutement', 'formation', 'développement'],
              themes: ['Ressources Humaines', 'Gestion du personnel'],
            },
            aiSentiment: {
              sentiment: 'neutre',
              sentiment_score: 0.5,
              ton: 'formel',
              confidence_level: 9,
              emotions: ['neutralité'],
              summary: 'Document formel et structuré',
            },
            aiAnalytics: {
              complexity: 'moyen',
              word_count_estimate: 4200,
              paragraph_count_estimate: 55,
              document_type: 'Politique Organisationnelle',
              sector: 'Ressources Humaines',
              recommendations: [
                'Communiquer largement la politique',
                'Former les managers',
                'Mettre en place un suivi',
              ],
              risks: [
                'Résistance au changement',
                'Interprétations divergentes',
              ],
              opportunities: [
                'Amélioration de la rétention',
                'Développement des talents',
              ],
              next_steps: [
                'Validation par la direction',
                'Communication aux équipes',
                'Formation des managers',
              ],
              insights: 'Politique RH complète et structurée visant à améliorer la gestion du personnel et le développement des compétences.',
            },
          },
          {
            filename: 'rapport-recrutement-q1.docx',
            originalName: 'Rapport de Recrutement Q1 2024.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 654321,
            mayanId: `local-seed-${Date.now()}-${Math.random().toString(36).substring(7)}-5`,
            tags: ['recrutement', 'Q1-2024', 'rapport', 'RH'],
            metadata: {
              'Auteur': 'Service Recrutement',
              'Date': '2024-04-05',
              'Période': 'Q1 2024',
            },
            aiSummary: {
              summary: 'Rapport détaillé des activités de recrutement pour le premier trimestre 2024, incluant les statistiques, les postes pourvus et les défis rencontrés.',
              keyPoints: [
                '25 postes ouverts',
                '18 recrutements réussis',
                'Taux de réussite: 72%',
                'Temps moyen de recrutement: 35 jours',
                'Focus sur les profils techniques',
              ],
              category: 'Rapport RH',
              language: 'fr',
              generatedAt: new Date(),
              rating: 4,
            },
            aiEntities: {
              personnes: ['Julie Martin', 'Nicolas Rousseau'],
              organizations: ['Service Recrutement', 'Direction RH'],
              dates: ['2024-01-01', '2024-03-31'],
              locations: ['Paris', 'Lyon', 'Toulouse'],
              amounts: [],
              keywords: ['recrutement', 'postes', 'candidats', 'sélection'],
              themes: ['Recrutement', 'Gestion des talents'],
            },
            aiSentiment: {
              sentiment: 'positif',
              sentiment_score: 0.65,
              ton: 'analytique',
              confidence_level: 8,
              emotions: ['satisfaction'],
              summary: 'Rapport positif avec de bons résultats',
            },
            aiAnalytics: {
              complexity: 'simple',
              word_count_estimate: 2800,
              paragraph_count_estimate: 35,
              document_type: 'Rapport de Performance',
              sector: 'Ressources Humaines',
              recommendations: [
                'Réduire le temps de recrutement',
                'Améliorer le taux de réussite',
                'Diversifier les canaux de recrutement',
              ],
              risks: [
                'Pénurie de talents',
                'Concurrence sur le marché',
              ],
              opportunities: [
                'Partenariats avec écoles',
                'Programme de recommandation',
              ],
              next_steps: [
                'Analyse des tendances Q2',
                'Optimisation des processus',
              ],
              insights: 'Bons résultats de recrutement avec des opportunités d\'amélioration du processus.',
            },
          },
        ],
      },
      {
        name: 'Projet Gamma - Innovation & R&D',
        description: 'Projet d\'innovation et de recherche & développement. Exploration de nouvelles technologies, prototypes et projets pilotes.',
        documents: [
          {
            filename: 'roadmap-innovation-2024.pdf',
            originalName: 'Roadmap Innovation 2024.pdf',
            mimeType: 'application/pdf',
            size: 3456789,
            mayanId: `local-seed-${Date.now()}-${Math.random().toString(36).substring(7)}-6`,
            tags: ['innovation', 'R&D', 'roadmap', '2024', 'technologie'],
            metadata: {
              'Auteur': 'Direction Innovation',
              'Date': '2024-01-20',
              'Confidentialité': 'Haute',
            },
            aiSummary: {
              summary: 'Roadmap stratégique pour l\'innovation en 2024, présentant les axes de recherche, les projets prioritaires et les investissements prévus en R&D.',
              keyPoints: [
                '3 axes d\'innovation principaux',
                'Budget R&D: 5M EUR',
                '5 projets pilotes lancés',
                'Focus sur l\'IA et la blockchain',
                'Partenariats avec universités',
              ],
              category: 'Stratégie Innovation',
              language: 'fr',
              generatedAt: new Date(),
              rating: 5,
            },
            aiEntities: {
              personnes: ['Dr. Sophie Chen', 'Prof. Michel Laurent'],
              organizations: ['Direction Innovation', 'Université Paris Tech'],
              dates: ['2024-01-01', '2024-12-31', '2025-06-30'],
              locations: ['Paris', 'Silicon Valley'],
              amounts: ['5000000 EUR'],
              keywords: ['innovation', 'R&D', 'technologie', 'IA', 'blockchain'],
              themes: ['Innovation', 'Recherche & Développement'],
            },
            aiSentiment: {
              sentiment: 'positif',
              sentiment_score: 0.85,
              ton: 'visionnaire',
              confidence_level: 9,
              emotions: ['enthousiasme', 'ambition'],
              summary: 'Roadmap ambitieuse et visionnaire',
            },
            aiAnalytics: {
              complexity: 'complexe',
              word_count_estimate: 12000,
              paragraph_count_estimate: 150,
              document_type: 'Stratégie Innovation',
              sector: 'Technologie',
              recommendations: [
                'Accélérer les projets pilotes',
                'Renforcer les partenariats',
                'Investir dans les talents',
              ],
              risks: [
                'Échecs technologiques',
                'Délais de développement',
              ],
              opportunities: [
                'Avantage concurrentiel',
                'Nouveaux marchés',
                'Brevetabilité',
              ],
              next_steps: [
                'Validation du budget',
                'Lancement des projets',
                'Mise en place des équipes',
              ],
              insights: 'Roadmap ambitieuse positionnant l\'entreprise comme leader de l\'innovation avec des investissements significatifs en R&D.',
            },
          },
          {
            filename: 'prototype-ia-v1.pptx',
            originalName: 'Prototype IA v1.0.pptx',
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            size: 8765432,
            mayanId: `local-${Date.now()}-7`,
            tags: ['prototype', 'IA', 'présentation', 'technologie'],
            metadata: {
              'Auteur': 'Équipe R&D',
              'Date': '2024-03-15',
              'Version': '1.0',
              'Statut': 'En développement',
            },
            aiSummary: {
              summary: 'Présentation du premier prototype d\'intelligence artificielle développé par l\'équipe R&D, incluant les fonctionnalités, les tests et les prochaines étapes.',
              keyPoints: [
                'Prototype de système de recommandation IA',
                'Précision: 87%',
                'Temps de réponse: <100ms',
                'Tests utilisateurs: 85% de satisfaction',
                'Déploiement prévu: Q3 2024',
              ],
              category: 'Présentation Technique',
              language: 'fr',
              generatedAt: new Date(),
              rating: 5,
            },
            aiEntities: {
              personnes: ['Alexandre Moreau', 'Sarah Kim', 'Thomas Dubois'],
              organizations: ['Équipe R&D', 'Direction Innovation'],
              dates: ['2024-03-15', '2024-09-30'],
              locations: ['Lab Innovation'],
              amounts: [],
              keywords: ['IA', 'prototype', 'machine learning', 'recommandation'],
              themes: ['Intelligence Artificielle', 'Développement'],
            },
            aiSentiment: {
              sentiment: 'positif',
              sentiment_score: 0.8,
              ton: 'technique',
              confidence_level: 8,
              emotions: ['fierté', 'optimisme'],
              summary: 'Présentation positive d\'un prototype prometteur',
            },
            aiAnalytics: {
              complexity: 'complexe',
              word_count_estimate: 1500,
              paragraph_count_estimate: 25,
              document_type: 'Présentation Technique',
              sector: 'Technologie',
              recommendations: [
                'Poursuivre les tests',
                'Optimiser les performances',
                'Préparer le déploiement',
              ],
              risks: [
                'Problèmes de scalabilité',
                'Biais algorithmiques',
              ],
              opportunities: [
                'Amélioration continue',
                'Applications multiples',
              ],
              next_steps: [
                'Tests de charge',
                'Validation par les utilisateurs',
                'Préparation du déploiement',
              ],
              insights: 'Prototype prometteur avec de bonnes performances et un potentiel de déploiement réussi.',
            },
          },
          {
            filename: 'analyse-concurrents-tech.xlsx',
            originalName: 'Analyse Concurrents Technologiques.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 234567,
            mayanId: `local-seed-${Date.now()}-${Math.random().toString(36).substring(7)}-8`,
            tags: ['analyse', 'concurrents', 'technologie', 'benchmark'],
            metadata: {
              'Auteur': 'Service Stratégie',
              'Date': '2024-02-10',
              'Confidentialité': 'Interne',
            },
            aiSummary: {
              summary: 'Analyse comparative des solutions technologiques des principaux concurrents, incluant leurs forces, faiblesses et positionnement sur le marché.',
              keyPoints: [
                'Analyse de 10 concurrents principaux',
                'Comparaison des fonctionnalités',
                'Analyse des prix',
                'Positionnement marché',
                'Recommandations stratégiques',
              ],
              category: 'Analyse Concurrentielle',
              language: 'fr',
              generatedAt: new Date(),
              rating: 4,
            },
            aiEntities: {
              personnes: ['Marie Leclerc'],
              organizations: ['Service Stratégie', 'TechCorp', 'InnovateLab'],
              dates: ['2024-02-10'],
              locations: ['Marché global'],
              amounts: [],
              keywords: ['concurrents', 'benchmark', 'technologie', 'marché'],
              themes: ['Analyse concurrentielle', 'Stratégie'],
            },
            aiSentiment: {
              sentiment: 'neutre',
              sentiment_score: 0.5,
              ton: 'analytique',
              confidence_level: 7,
              emotions: ['neutralité'],
              summary: 'Analyse factuelle et objective',
            },
            aiAnalytics: {
              complexity: 'moyen',
              word_count_estimate: 800,
              paragraph_count_estimate: 0,
              document_type: 'Analyse Concurrentielle',
              sector: 'Technologie',
              recommendations: [
                'Développer des fonctionnalités différenciantes',
                'Optimiser le positionnement prix',
              ],
              risks: [
                'Concurrence accrue',
                'Innovation des concurrents',
              ],
              opportunities: [
                'Niche de marché',
                'Avantages compétitifs',
              ],
              next_steps: [
                'Mise à jour trimestrielle',
                'Intégration dans la stratégie',
              ],
              insights: 'Analyse complète révélant des opportunités de différenciation et des défis concurrentiels.',
            },
          },
        ],
      },
    ];

    console.log('📝 [SEED-PROJECTS] Création des projets et documents...\n');

    const createdProjects = [];
    let totalDocuments = 0;

    for (const projectData of projectsData) {
      // Vérifier si le projet existe déjà
      let project = await Project.findOne({ name: projectData.name });

      if (project) {
        console.log(`⚠️  [SEED-PROJECTS] Projet "${projectData.name}" existe déjà, mise à jour...`);
        project.description = projectData.description;
        project.isActive = true;
        await project.save();
      } else {
        // Créer le projet
        project = await Project.create({
          name: projectData.name,
          description: projectData.description,
          createdBy: adminUser._id,
          isActive: true,
          settings: {
            allowPublicRead: false,
            allowPublicWrite: false,
          },
        });
        console.log(`✅ [SEED-PROJECTS] Projet créé: "${project.name}"`);
      }

      createdProjects.push(project);

      // Créer les documents pour ce projet
      for (const docData of projectData.documents) {
        // Vérifier si le document existe déjà
        const existingDoc = await Document.findOne({ mayanId: docData.mayanId });

        if (existingDoc) {
          console.log(`   ⚠️  Document "${docData.originalName}" existe déjà, ignoré`);
          continue;
        }

        const document = await Document.create({
          ...docData,
          uploadedBy: adminUser._id,
          project: project._id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Dates aléatoires dans les 30 derniers jours
        });

        console.log(`   ✅ Document créé: "${document.originalName}" (${(document.size / 1024).toFixed(2)} KB)`);
        totalDocuments++;
      }

      console.log('');
    }

    // Résumé
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 [SEED-PROJECTS] Résumé:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Projets créés/mis à jour: ${createdProjects.length}`);
    console.log(`✅ Documents créés: ${totalDocuments}`);
    console.log(`👤 Créés par: ${adminUser.name} (${adminUser.email})`);
    console.log('');
    console.log('📁 Projets:');
    createdProjects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Fermer la connexion
    await mongoose.connection.close();
    console.log('✅ [SEED-PROJECTS] Connexion fermée');
    console.log('🎉 [SEED-PROJECTS] Script terminé avec succès!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ [SEED-PROJECTS] Erreur:', error);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Exécuter le script
if (require.main === module) {
  seedProjects();
}

module.exports = seedProjects;
