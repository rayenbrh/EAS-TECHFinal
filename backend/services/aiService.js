const {
  generateSummary,
  extractEntities,
  analyzeSentiment,
  generateAnalytics,
  compareDocuments,
  generateTags,
  checkOpenRouterConnection,
} = require('./openRouterService');
const { extractTextFromDocument, extractTextFromBuffer } = require('./textExtractionService');
const Document = require('../models/Document');

/**
 * Générer un résumé IA complet pour un document
 * @param {String} documentId - ID du document MongoDB
 * @param {Buffer} fileBuffer - Buffer du fichier (optionnel)
 * @returns {Promise<Object>} - Résumé IA avec points clés et analytics
 */
exports.generateAISummary = async (documentId, fileBuffer = null) => {
  try {
    console.log(`\n🤖 [AI] Génération du résumé IA pour le document ${documentId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document non trouvé');
    }

    // Extraire le texte du document
    let text = '';
    try {
      text = await extractTextFromDocument(documentId, fileBuffer);
      console.log(`✅ [AI] Texte extrait: ${text.length} caractères`);
    } catch (error) {
      console.warn('⚠️  [AI] Impossible d\'extraire le texte:', error.message);
      text = `Document: ${document.filename}\nType: ${document.mimeType}`;
    }

    if (!text || text.trim().length < 10) {
      console.warn('⚠️  [AI] Texte insuffisant pour générer un résumé');
      return {
        summary: `Document ${document.filename} téléchargé avec succès. Taille: ${(document.size / 1024).toFixed(2)} KB.`,
        keyPoints: [
          `Type de fichier: ${document.mimeType}`,
          `Date de téléchargement: ${document.createdAt.toLocaleDateString('fr-FR')}`,
          `Taille: ${(document.size / 1024).toFixed(2)} KB`,
        ],
        category: 'Document',
        language: 'fr',
        generatedAt: new Date(),
      };
    }

    // Générer le résumé avec le service IA
    console.log('🔄 [AI] Génération du résumé avec le service IA...');
    const summaryData = await generateSummary(text, document.filename);

    console.log('✅ [AI] Résumé généré avec succès');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return summaryData;
  } catch (error) {
    console.error('❌ [AI] Erreur génération résumé:', error.message);
    
    // Retourner un résumé par défaut en cas d'erreur
    const document = await Document.findById(documentId);
    return {
      summary: `Document ${document?.filename || 'inconnu'} téléchargé avec succès.`,
      keyPoints: [
        `Type: ${document?.mimeType || 'Non spécifié'}`,
        `Taille: ${document ? (document.size / 1024).toFixed(2) : 0} KB`,
      ],
      category: 'Document',
      language: 'fr',
      generatedAt: new Date(),
    };
  }
};

/**
 * Extraire les entités d'un document
 * @param {String} documentId - ID du document
 * @returns {Promise<Object>} - Entités extraites
 */
exports.extractEntities = async (documentId) => {
  try {
    console.log(`\n🔍 [AI] Extraction des entités pour le document ${documentId}`);
    
    const text = await extractTextFromDocument(documentId);
    
    if (!text || text.trim().length < 10) {
      return {
        personnes: [],
        organizations: [],
        dates: [],
        locations: [],
        amounts: [],
        keywords: [],
        themes: [],
        extractedAt: new Date(),
      };
    }

    const entities = await extractEntities(text);
    console.log('✅ [AI] Entités extraites avec succès');
    console.log('   - Personnes:', entities.personnes?.length || 0);
    console.log('   - Organisations:', entities.organizations?.length || 0);
    console.log('   - Dates:', entities.dates?.length || 0);
    console.log('   - Lieux:', entities.locations?.length || 0);
    console.log('   - Montants:', entities.amounts?.length || 0);
    console.log('   - Mots-clés:', entities.keywords?.length || 0);
    console.log('   - Thèmes:', entities.themes?.length || 0);
    console.log('');
    
    return entities;
  } catch (error) {
    console.error('❌ [AI] Erreur extraction entités:', error.message);
    return {
      personnes: [],
      organizations: [],
      dates: [],
      locations: [],
      amounts: [],
      keywords: [],
      themes: [],
      extractedAt: new Date(),
    };
  }
};

/**
 * Analyser le sentiment d'un document
 * @param {String} documentId - ID du document
 * @returns {Promise<Object>} - Analyse de sentiment
 */
exports.analyzeSentiment = async (documentId) => {
  try {
    const text = await extractTextFromDocument(documentId);
    
    if (!text || text.trim().length < 10) {
      return {
        sentiment: 'neutre',
        sentiment_score: 0.5,
        ton: 'neutre',
        confidence_level: 5,
        emotions: [],
        summary: 'Analyse non disponible',
      };
    }

    return await analyzeSentiment(text);
  } catch (error) {
    console.error('❌ [AI] Erreur analyse sentiment:', error.message);
    return {
      sentiment: 'neutre',
      sentiment_score: 0.5,
      ton: 'neutre',
      confidence_level: 5,
      emotions: [],
      summary: 'Analyse non disponible',
    };
  }
};

/**
 * Générer des analytics complètes pour un document
 * @param {String} documentId - ID du document
 * @returns {Promise<Object>} - Analytics et insights
 */
exports.generateAnalytics = async (documentId) => {
  try {
    console.log(`\n📊 [AI] Génération des analytics pour le document ${documentId}`);
    
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document non trouvé');
    }

    const text = await extractTextFromDocument(documentId);
    
    if (!text || text.trim().length < 10) {
      return {
        complexity: 'simple',
        word_count_estimate: 0,
        paragraph_count_estimate: 0,
        document_type: 'Document',
        sector: 'Non spécifié',
        recommendations: [],
        risks: [],
        opportunities: [],
        next_steps: [],
        insights: 'Analytics non disponibles - contenu insuffisant',
      };
    }

    const analytics = await generateAnalytics(text, {
      filename: document.filename,
      mimeType: document.mimeType,
      size: document.size,
      tags: document.tags || [],
    });

    console.log('✅ [AI] Analytics générées avec succès\n');
    
    return analytics;
  } catch (error) {
    console.error('❌ [AI] Erreur génération analytics:', error.message);
    return {
      complexity: 'moyen',
      word_count_estimate: 0,
      paragraph_count_estimate: 0,
      document_type: 'Document',
      sector: 'Non spécifié',
      recommendations: [],
      risks: [],
      opportunities: [],
      next_steps: [],
      insights: 'Analytics non disponibles',
    };
  }
};

/**
 * Comparer deux documents
 * @param {String} documentId1 - ID du premier document
 * @param {String} documentId2 - ID du second document
 * @returns {Promise<Object>} - Comparaison
 */
exports.compareDocuments = async (documentId1, documentId2) => {
  try {
    console.log(`\n🔄 [AI] Comparaison des documents ${documentId1} et ${documentId2}`);
    
    const [document1, document2] = await Promise.all([
      Document.findById(documentId1),
      Document.findById(documentId2),
    ]);

    if (!document1 || !document2) {
      throw new Error('Un ou plusieurs documents non trouvés');
    }

    const [text1, text2] = await Promise.all([
      extractTextFromDocument(documentId1),
      extractTextFromDocument(documentId2),
    ]);

    const comparison = await compareDocuments(
      text1,
      text2,
      document1.filename,
      document2.filename
    );

    console.log('✅ [AI] Comparaison terminée avec succès\n');
    
    return comparison;
  } catch (error) {
    console.error('❌ [AI] Erreur comparaison documents:', error.message);
    throw error;
  }
};

/**
 * Générer des tags automatiques pour un document
 * @param {String} documentId - ID du document
 * @returns {Promise<Array>} - Liste de tags
 */
exports.generateTags = async (documentId) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document non trouvé');
    }

    const text = await extractTextFromDocument(documentId);
    
    if (!text || text.trim().length < 10) {
      // Tags basiques basés sur le nom de fichier et type
      const basicTags = [];
      if (document.filename) {
        const ext = document.filename.split('.').pop().toLowerCase();
        basicTags.push(ext);
      }
      if (document.mimeType) {
        const type = document.mimeType.split('/')[0];
        basicTags.push(type);
      }
      return basicTags;
    }

    const tags = await generateTags(text, document.filename);
    return tags;
  } catch (error) {
    console.error('❌ [AI] Erreur génération tags:', error.message);
    return [];
  }
};

/**
 * Générer une analyse complète d'un document (résumé + entités + analytics)
 * @param {String} documentId - ID du document
 * @returns {Promise<Object>} - Analyse complète
 */
exports.generateCompleteAnalysis = async (documentId) => {
  try {
    console.log(`\n🎯 [AI] Analyse complète du document ${documentId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document non trouvé');
    }

    // Générer toutes les analyses en parallèle
    const [summary, entities, sentiment, analytics, tags] = await Promise.all([
      exports.generateAISummary(documentId).catch(e => {
        console.warn('⚠️  Résumé échoué:', e.message);
        return null;
      }),
      exports.extractEntities(documentId).catch(e => {
        console.warn('⚠️  Extraction entités échouée:', e.message);
        return null;
      }),
      exports.analyzeSentiment(documentId).catch(e => {
        console.warn('⚠️  Analyse sentiment échouée:', e.message);
        return null;
      }),
      exports.generateAnalytics(documentId).catch(e => {
        console.warn('⚠️  Analytics échouées:', e.message);
        return null;
      }),
      exports.generateTags(documentId).catch(e => {
        console.warn('⚠️  Génération tags échouée:', e.message);
        return [];
      }),
    ]);

    const completeAnalysis = {
      summary: summary || {},
      entities: entities || {
        personnes: [],
        organizations: [],
        dates: [],
        locations: [],
        amounts: [],
        keywords: [],
        themes: [],
        extractedAt: new Date(),
      },
      sentiment: sentiment || {},
      analytics: analytics || {},
      tags: tags || [],
      generatedAt: new Date(),
    };
    
    // Log pour déboguer
    console.log('📋 [AI] Analyse complète assemblée:');
    console.log('  - Résumé:', completeAnalysis.summary && Object.keys(completeAnalysis.summary).length > 0 ? '✅ Présent' : '❌ Absent');
    console.log('  - Entités:', completeAnalysis.entities && Object.keys(completeAnalysis.entities).length > 0 ? `✅ Présent (${Object.keys(completeAnalysis.entities).length} catégories)` : '❌ Absent');
    if (completeAnalysis.entities) {
      console.log('    * Personnes:', completeAnalysis.entities.personnes?.length || 0);
      console.log('    * Organisations:', completeAnalysis.entities.organizations?.length || 0);
      console.log('    * Dates:', completeAnalysis.entities.dates?.length || 0);
      console.log('    * Lieux:', completeAnalysis.entities.locations?.length || 0);
      console.log('    * Montants:', completeAnalysis.entities.amounts?.length || 0);
      console.log('    * Mots-clés:', completeAnalysis.entities.keywords?.length || 0);
      console.log('    * Thèmes:', completeAnalysis.entities.themes?.length || 0);
    }
    console.log('  - Sentiment:', completeAnalysis.sentiment && Object.keys(completeAnalysis.sentiment).length > 0 ? '✅ Présent' : '❌ Absent');
    console.log('  - Analytics:', completeAnalysis.analytics && Object.keys(completeAnalysis.analytics).length > 0 ? '✅ Présent' : '❌ Absent');

    // Mettre à jour le document avec les tags générés (utiliser findByIdAndUpdate pour éviter les conflits de version)
    if (tags && tags.length > 0) {
      const existingTags = new Set(document.tags || []);
      tags.forEach(tag => existingTags.add(tag));
      
      await Document.findByIdAndUpdate(
        documentId,
        {
          $set: {
            tags: Array.from(existingTags),
          },
        },
        { new: true, runValidators: true }
      );
    }

    console.log('✅ [AI] Analyse complète terminée avec succès');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return completeAnalysis;
  } catch (error) {
    console.error('❌ [AI] Erreur analyse complète:', error.message);
    throw error;
  }
};

/**
 * Vérifier la disponibilité du service IA
 * @returns {Promise<Boolean>} - État du service
 */
exports.checkAIService = async () => {
  return await checkOpenRouterConnection();
};

// Exporter aussi les fonctions d'extraction de texte
exports.extractTextFromDocument = extractTextFromDocument;
exports.extractTextFromBuffer = extractTextFromBuffer;
