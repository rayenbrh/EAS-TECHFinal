const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Utiliser le service IA local si configuré, sinon OpenRouter
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const AI_MODEL = process.env.AI_MODEL || OPENROUTER_MODEL;

// Déterminer quelle API utiliser
const USE_LOCAL_AI = !!AI_SERVICE_URL;
const API_URL = USE_LOCAL_AI ? AI_SERVICE_URL : OPENROUTER_API_URL;

/**
 * Appel générique à l'API IA (locale ou OpenRouter)
 * @param {String} prompt - Le prompt à envoyer
 * @param {Object} options - Options supplémentaires (temperature, max_tokens, etc.)
 * @returns {Promise<String>} - Réponse de l'IA
 */
const callAIService = async (prompt, options = {}) => {
  try {
    // Si on utilise le service local, pas besoin de clé API
    if (!USE_LOCAL_AI && !OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY non configuré dans les variables d\'environnement');
    }

    // Construire l'URL de l'API
    // Pour les services locaux (Ollama), l'endpoint est généralement /api/chat
    // Pour OpenRouter, c'est /chat/completions
    let apiEndpoint;
    if (USE_LOCAL_AI) {
      // Pour Ollama, l'endpoint est /api/chat
      // Si l'URL contient déjà /api, utiliser directement
      if (API_URL.includes('/api')) {
        apiEndpoint = `${API_URL}/chat`;
      } else if (API_URL.includes('/v1')) {
        apiEndpoint = `${API_URL}/chat/completions`;
      } else {
        // Format Ollama standard: http://host:port/api/chat
        apiEndpoint = `${API_URL}/api/chat`;
      }
    } else {
      apiEndpoint = `${API_URL}/chat/completions`;  // Format OpenRouter
    }

    // Préparer les headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Ajouter l'autorisation seulement si on utilise OpenRouter
    if (!USE_LOCAL_AI && OPENROUTER_API_KEY) {
      headers['Authorization'] = `Bearer ${OPENROUTER_API_KEY}`;
      headers['HTTP-Referer'] = process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:5000';
      headers['X-Title'] = process.env.OPENROUTER_APP_NAME || 'LockHeaven';
    }

    // Pour les services locaux (Ollama), on peut aussi ajouter une clé si nécessaire
    if (USE_LOCAL_AI && process.env.AI_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.AI_API_KEY}`;
    }

    console.log(`🔄 [AI] Appel ${USE_LOCAL_AI ? 'service IA local' : 'OpenRouter'} - URL: ${apiEndpoint}`);

    // Préparer le payload selon le format de l'API
    let payload;
    if (USE_LOCAL_AI && apiEndpoint.includes('/api/chat')) {
      // Format Ollama: /api/chat
      payload = {
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant IA expert en analyse de documents professionnels. Tu réponds toujours en français et de manière précise et structurée.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
        options: {
          temperature: options.temperature || 0.3,
          num_predict: options.max_tokens || 2000,
          top_p: options.top_p || 1,
        },
      };
    } else {
      // Format OpenAI/OpenRouter: /v1/chat/completions ou /chat/completions
      payload = {
        model: USE_LOCAL_AI ? AI_MODEL : OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant IA expert en analyse de documents professionnels. Tu réponds toujours en français et de manière précise et structurée.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.max_tokens || 2000,
        top_p: options.top_p || 1,
        frequency_penalty: options.frequency_penalty || 0,
        presence_penalty: options.presence_penalty || 0,
      };
    }

    const response = await axios.post(
      apiEndpoint,
      payload,
      {
        headers,
        timeout: options.timeout || 60000,
      }
    );

    // Extraire le contenu selon le format de réponse
    let content;
    if (USE_LOCAL_AI && apiEndpoint.includes('/api/chat')) {
      // Format Ollama
      content = response.data.message?.content || response.data.response;
    } else {
      // Format OpenAI/OpenRouter
      content = response.data.choices[0]?.message?.content;
    }
    if (!content) {
      console.error('Réponse complète:', JSON.stringify(response.data, null, 2));
      throw new Error(`Réponse vide de l'API ${USE_LOCAL_AI ? 'IA locale' : 'OpenRouter'}`);
    }

    console.log(`✅ [AI] Réponse reçue (${content.length} caractères)`);
    return content;
  } catch (error) {
    console.error(`❌ [AI] Erreur lors de l'appel ${USE_LOCAL_AI ? 'service IA local' : 'OpenRouter'}:`, error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Erreur ${USE_LOCAL_AI ? 'service IA local' : 'OpenRouter API'}: ${error.message}`);
  }
};

// Alias pour compatibilité
const callOpenRouter = callAIService;

/**
 * Parser une réponse JSON de l'IA
 * @param {String} response - Réponse textuelle de l'IA
 * @returns {Object} - Objet parsé
 */
const parseJSONResponse = (response) => {
  try {
    // Essayer de parser directement
    return JSON.parse(response);
  } catch (error) {
    // Essayer d'extraire le JSON si la réponse contient du texte autour
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Impossible de parser le JSON, retour de la réponse brute');
        return { raw: response };
      }
    }
    throw new Error('Réponse non-JSON de l\'IA');
  }
};

/**
 * Générer un résumé et des points clés pour un document
 * @param {String} text - Texte du document
 * @param {String} filename - Nom du fichier
 * @returns {Promise<Object>} - Résumé et points clés
 */
exports.generateSummary = async (text, filename = '') => {
  const prompt = `Tu es un expert en analyse de documents. Analyse le document suivant et génère un résumé professionnel.

**Document:** ${filename || 'Document sans nom'}

**Contenu:**
${text.substring(0, 50000)} ${text.length > 50000 ? '\n\n[... contenu tronqué ...]' : ''}

**Instructions:**
1. Génère un résumé concis et professionnel (3-5 phrases) qui capture l'essence du document
2. Identifie 5-7 points clés les plus importants
3. Le résumé doit être en français et adapté à un contexte professionnel
4. Les points clés doivent être des phrases courtes et actionnables

**Format de réponse (JSON strict):**
{
  "summary": "Résumé du document en 3-5 phrases",
  "keyPoints": [
    "Point clé 1",
    "Point clé 2",
    "Point clé 3",
    "Point clé 4",
    "Point clé 5"
  ],
  "category": "Catégorie du document (ex: Rapport, Contrat, Présentation, etc.)",
  "language": "Langue détectée du document"
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

  try {
    const response = await callOpenRouter(prompt, {
      temperature: 0.3,
      max_tokens: 1500,
    });

    const parsed = parseJSONResponse(response);
    
    return {
      summary: parsed.summary || 'Résumé non disponible',
      keyPoints: parsed.keyPoints || [],
      category: parsed.category || 'Document',
      language: parsed.language || 'fr',
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('Erreur génération résumé:', error);
    throw error;
  }
};

/**
 * Extraire des entités nommées d'un document
 * @param {String} text - Texte du document
 * @returns {Promise<Object>} - Entités extraites
 */
exports.extractEntities = async (text) => {
  const prompt = `Analyse le texte suivant et extrais toutes les entités nommées importantes.

**Texte:**
${text.substring(0, 30000)} ${text.length > 30000 ? '\n\n[... contenu tronqué ...]' : ''}

**Instructions:**
Extrais et catégorise les entités suivantes:
- **personnes**: Noms de personnes mentionnées
- **organisations**: Entreprises, institutions, organisations
- **dates**: Dates importantes (format ISO: YYYY-MM-DD)
- **lieux**: Villes, pays, adresses
- **montants**: Montants financiers avec devise
- **mots_cles**: 10-15 mots-clés les plus importants
- **themes**: 3-5 thèmes principaux du document

**Format de réponse (JSON strict):**
{
  "personnes": ["Nom 1", "Nom 2"],
  "organisations": ["Organisation 1", "Organisation 2"],
  "dates": ["2024-01-15", "2024-12-31"],
  "lieux": ["Paris", "France"],
  "montants": ["1000 EUR", "5000 USD"],
  "mots_cles": ["mot-clé 1", "mot-clé 2"],
  "themes": ["Thème 1", "Thème 2"]
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

  try {
    const response = await callAIService(prompt, {
      temperature: 0.2,
      max_tokens: 2000,
    });

    const parsed = parseJSONResponse(response);
    
    return {
      personnes: parsed.personnes || [],
      organizations: parsed.organisations || [],
      dates: parsed.dates || [],
      locations: parsed.lieux || [],
      amounts: parsed.montants || [],
      keywords: parsed.mots_cles || [],
      themes: parsed.themes || [],
      extractedAt: new Date(),
    };
  } catch (error) {
    console.error('Erreur extraction entités:', error);
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
 * Analyser le sentiment et le ton d'un document
 * @param {String} text - Texte du document
 * @returns {Promise<Object>} - Analyse de sentiment
 */
exports.analyzeSentiment = async (text) => {
  const prompt = `Analyse le sentiment et le ton du texte suivant.

**Texte:**
${text.substring(0, 20000)} ${text.length > 20000 ? '\n\n[... contenu tronqué ...]' : ''}

**Instructions:**
Détermine:
1. Le sentiment général (positif, neutre, négatif)
2. Le ton du document (formel, informel, technique, commercial, etc.)
3. Le niveau de confiance/urgence (échelle de 1 à 10)
4. Les émotions principales détectées

**Format de réponse (JSON strict):**
{
  "sentiment": "positif|neutre|négatif",
  "sentiment_score": 0.75,
  "ton": "formel|informel|technique|commercial",
  "confidence_level": 7,
  "emotions": ["confiance", "optimisme"],
  "summary": "Brève description du sentiment général"
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

  try {
    const response = await callAIService(prompt, {
      temperature: 0.3,
      max_tokens: 500,
    });

    return parseJSONResponse(response);
  } catch (error) {
    console.error('Erreur analyse sentiment:', error);
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
 * Générer des analytics et insights sur un document
 * @param {String} text - Texte du document
 * @param {Object} metadata - Métadonnées du document
 * @returns {Promise<Object>} - Analytics et insights
 */
exports.generateAnalytics = async (text, metadata = {}) => {
  const prompt = `Analyse ce document en profondeur et génère des analytics et insights professionnels.

**Métadonnées:**
- Nom: ${metadata.filename || 'Non spécifié'}
- Type: ${metadata.mimeType || 'Non spécifié'}
- Taille: ${metadata.size ? `${(metadata.size / 1024).toFixed(2)} KB` : 'Non spécifié'}
- Tags: ${metadata.tags ? metadata.tags.join(', ') : 'Aucun'}

**Contenu:**
${text.substring(0, 40000)} ${text.length > 40000 ? '\n\n[... contenu tronqué ...]' : ''}

**Instructions:**
Génère une analyse complète incluant:
1. **Complexité**: Niveau de complexité du document (simple, moyen, complexe)
2. **Longueur_analyse**: Nombre de mots, paragraphes estimés
3. **Type_document**: Type précis (Rapport financier, Contrat, Présentation, etc.)
4. **Secteur**: Secteur d'activité identifié
5. **Recommandations**: 3-5 recommandations d'action basées sur le contenu
6. **Risques**: Risques potentiels identifiés (si applicable)
7. **Opportunites**: Opportunités identifiées (si applicable)
8. **Prochaines_etapes**: Prochaines étapes suggérées

**Format de réponse (JSON strict):**
{
  "complexity": "simple|moyen|complexe",
  "word_count_estimate": 1500,
  "paragraph_count_estimate": 25,
  "document_type": "Type précis du document",
  "sector": "Secteur d'activité",
  "recommendations": [
    "Recommandation 1",
    "Recommandation 2"
  ],
  "risks": [
    "Risque 1",
    "Risque 2"
  ],
  "opportunities": [
    "Opportunité 1",
    "Opportunité 2"
  ],
  "next_steps": [
    "Étape 1",
    "Étape 2"
  ],
  "insights": "Insight principal en 2-3 phrases"
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

  try {
    const response = await callOpenRouter(prompt, {
      temperature: 0.4,
      max_tokens: 2000,
    });

    return parseJSONResponse(response);
  } catch (error) {
    console.error('Erreur génération analytics:', error);
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
 * @param {String} text1 - Texte du premier document
 * @param {String} text2 - Texte du second document
 * @param {String} filename1 - Nom du premier fichier
 * @param {String} filename2 - Nom du second fichier
 * @returns {Promise<Object>} - Comparaison
 */
exports.compareDocuments = async (text1, text2, filename1 = '', filename2 = '') => {
  const prompt = `Compare deux documents et identifie les similitudes, différences et insights.

**Document 1:** ${filename1 || 'Document 1'}
${text1.substring(0, 20000)} ${text1.length > 20000 ? '\n\n[... contenu tronqué ...]' : ''}

**Document 2:** ${filename2 || 'Document 2'}
${text2.substring(0, 20000)} ${text2.length > 20000 ? '\n\n[... contenu tronqué ...]' : ''}

**Instructions:**
Compare les deux documents et identifie:
1. Similitudes principales
2. Différences clés
3. Points de convergence
4. Points de divergence
5. Recommandations basées sur la comparaison

**Format de réponse (JSON strict):**
{
  "similarities": [
    "Similarité 1",
    "Similarité 2"
  ],
  "differences": [
    "Différence 1",
    "Différence 2"
  ],
  "convergence_points": [
    "Point de convergence 1"
  ],
  "divergence_points": [
    "Point de divergence 1"
  ],
  "recommendations": [
    "Recommandation 1"
  ],
  "summary": "Résumé de la comparaison en 3-4 phrases"
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

  try {
    const response = await callAIService(prompt, {
      temperature: 0.4,
      max_tokens: 2000,
    });

    return parseJSONResponse(response);
  } catch (error) {
    console.error('Erreur comparaison documents:', error);
    throw error;
  }
};

/**
 * Générer des tags automatiques pour un document
 * @param {String} text - Texte du document
 * @param {String} filename - Nom du fichier
 * @returns {Promise<Array>} - Liste de tags
 */
exports.generateTags = async (text, filename = '') => {
  const prompt = `Génère 5-10 tags pertinents pour ce document.

**Document:** ${filename || 'Document sans nom'}

**Contenu:**
${text.substring(0, 30000)} ${text.length > 30000 ? '\n\n[... contenu tronqué ...]' : ''}

**Instructions:**
Génère des tags en français qui décrivent:
- Le sujet principal
- Le type de document
- Le secteur/thème
- Les concepts clés

**Format de réponse (JSON strict):**
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

  try {
    const response = await callAIService(prompt, {
      temperature: 0.3,
      max_tokens: 300,
    });

    const parsed = parseJSONResponse(response);
    return parsed.tags || [];
  } catch (error) {
    console.error('Erreur génération tags:', error);
    return [];
  }
};

/**
 * Vérifier la disponibilité de l'API IA (locale ou OpenRouter)
 * @returns {Promise<Boolean>} - État de l'API
 */
exports.checkOpenRouterConnection = async () => {
  try {
    if (USE_LOCAL_AI) {
      if (!AI_SERVICE_URL) {
        console.warn('⚠️  [AI] AI_SERVICE_URL non configuré');
        return false;
      }
      console.log(`🔄 [AI] Vérification de la connexion au service IA local: ${AI_SERVICE_URL}`);
    } else {
      if (!OPENROUTER_API_KEY) {
        console.warn('⚠️  [AI] OPENROUTER_API_KEY non configuré');
        return false;
      }
      console.log('🔄 [AI] Vérification de la connexion à OpenRouter API');
    }

    // Test simple avec un prompt minimal
    await callAIService('Réponds simplement "OK"', {
      max_tokens: 10,
      timeout: 10000,
    });

    console.log(`✅ [AI] Connexion à ${USE_LOCAL_AI ? 'service IA local' : 'OpenRouter API'} réussie`);
    return true;
  } catch (error) {
    console.error(`❌ [AI] Connexion échouée (${USE_LOCAL_AI ? 'service IA local' : 'OpenRouter'}):`, error.message);
    return false;
  }
};

module.exports = {
  callOpenRouter,
  callAIService,
  generateSummary: exports.generateSummary,
  extractEntities: exports.extractEntities,
  analyzeSentiment: exports.analyzeSentiment,
  generateAnalytics: exports.generateAnalytics,
  compareDocuments: exports.compareDocuments,
  generateTags: exports.generateTags,
  checkOpenRouterConnection: exports.checkOpenRouterConnection,
};
