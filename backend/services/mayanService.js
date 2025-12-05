const axios = require('axios');
const FormData = require('form-data');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const MAYAN_API_URL = process.env.MAYAN_API_URL;
const MAYAN_USERNAME = process.env.MAYAN_USERNAME;
const MAYAN_PASSWORD = process.env.MAYAN_PASSWORD;

// Configuration Axios pour Mayan (seulement si configuré)
let mayanClient = null;

if (MAYAN_API_URL && MAYAN_USERNAME && MAYAN_PASSWORD) {
  mayanClient = axios.create({
    baseURL: MAYAN_API_URL,
    auth: {
      username: MAYAN_USERNAME,
      password: MAYAN_PASSWORD,
    },
    headers: {
      'Accept': 'application/json',
    },
    timeout: 30000, // 30 secondes timeout
  });
  
  console.log('✅ [MAYAN] Client Mayan EDMS configuré');
  console.log('   - URL:', MAYAN_API_URL);
} else {
  console.warn('⚠️  [MAYAN] Mayan EDMS non configuré - Les documents seront stockés localement uniquement');
  console.warn('   - MAYAN_API_URL:', MAYAN_API_URL || '❌ NON DÉFINI');
  console.warn('   - MAYAN_USERNAME:', MAYAN_USERNAME || '❌ NON DÉFINI');
  console.warn('   - MAYAN_PASSWORD:', MAYAN_PASSWORD ? '✅ Défini' : '❌ NON DÉFINI');
}

/**
 * Upload un fichier vers Mayan EDMS
 * @param {Object} file - Fichier Multer
 * @returns {Promise<Object>} - Réponse de Mayan EDMS
 */
exports.uploadToMayan = async (file) => {
  try {
    console.log('\n🔄 [MAYAN] Début de l\'upload vers Mayan EDMS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Mayan API URL:', MAYAN_API_URL || '❌ NON DÉFINI');
    console.log('👤 Mayan Username:', MAYAN_USERNAME || '❌ NON DÉFINI');
    console.log('🔑 Mayan Password:', MAYAN_PASSWORD ? '✅ Défini' : '❌ NON DÉFINI');
    console.log('📄 Fichier:', file.originalname);
    console.log('📦 Taille:', (file.size / 1024).toFixed(2), 'KB');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Vérifier si Mayan est configuré
    if (!MAYAN_API_URL || !MAYAN_USERNAME || !MAYAN_PASSWORD) {
      const error = new Error('Mayan EDMS non configuré. Les documents seront stockés localement uniquement.');
      error.code = 'MAYAN_NOT_CONFIGURED';
      throw error;
    }
    
    // Créer le client si nécessaire
    if (!mayanClient) {
      mayanClient = axios.create({
        baseURL: MAYAN_API_URL,
        auth: {
          username: MAYAN_USERNAME,
          password: MAYAN_PASSWORD,
        },
        headers: {
          'Accept': 'application/json',
        },
        timeout: 30000,
      });
    }
    
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    console.log('📤 [MAYAN] Envoi de la requête POST vers Mayan EDMS...');
    
    // Créer le document dans Mayan
    const response = await mayanClient.post('/documents/', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('✅ [MAYAN] Upload réussi vers Mayan EDMS');
    console.log('   - Réponse:', JSON.stringify(response.data, null, 2).substring(0, 200));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return response.data;
  } catch (error) {
    console.error('\n❌ [MAYAN] Erreur upload Mayan EDMS:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Stack:', error.stack);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    throw new Error(`Échec de l'upload vers Mayan EDMS: ${error.message}`);
  }
};

/**
 * Rechercher des documents dans Mayan EDMS
 * @param {String} query - Requête de recherche
 * @returns {Promise<Array>} - Résultats de recherche
 */
exports.searchMayanDocuments = async (query) => {
  try {
    if (!mayanClient) {
      console.warn('⚠️  [MAYAN] Mayan EDMS non configuré - Recherche non disponible');
      return [];
    }
    
    const response = await mayanClient.get('/documents/', {
      params: {
        q: query,
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error('❌ [MAYAN] Erreur recherche Mayan:', error.response?.data || error.message);
    throw new Error('Échec de la recherche dans Mayan EDMS');
  }
};

/**
 * Obtenir les métadonnées d'un document Mayan
 * @param {String} documentId - ID du document Mayan
 * @returns {Promise<Object>} - Métadonnées du document
 */
exports.getMayanDocumentMetadata = async (documentId) => {
  try {
    if (!mayanClient) {
      throw new Error('Mayan EDMS non configuré');
    }
    
    const response = await mayanClient.get(`/documents/${documentId}/`);
    return response.data;
  } catch (error) {
    console.error('❌ [MAYAN] Erreur métadonnées Mayan:', error.response?.data || error.message);
    throw new Error('Échec de la récupération des métadonnées');
  }
};

/**
 * Télécharger un document depuis Mayan EDMS
 * @param {String} documentId - ID du document Mayan
 * @returns {Promise<Buffer>} - Contenu du document
 */
exports.downloadFromMayan = async (documentId) => {
  try {
    if (!mayanClient) {
      throw new Error('Mayan EDMS non configuré');
    }
    
    // Si c'est un ID local, on ne peut pas télécharger depuis Mayan
    if (documentId.startsWith('local-')) {
      throw new Error('Document stocké localement uniquement - Téléchargement non disponible');
    }
    
    const response = await mayanClient.get(`/documents/${documentId}/files/latest/download/`, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('❌ [MAYAN] Erreur téléchargement Mayan:', error.response?.data || error.message);
    throw new Error('Échec du téléchargement depuis Mayan EDMS');
  }
};

/**
 * Mettre à jour les métadonnées d'un document Mayan
 * @param {String} documentId - ID du document Mayan
 * @param {Object} metadata - Nouvelles métadonnées
 * @returns {Promise<Object>} - Document mis à jour
 */
exports.updateMayanMetadata = async (documentId, metadata) => {
  try {
    const response = await mayanClient.patch(`/documents/${documentId}/`, metadata);
    return response.data;
  } catch (error) {
    console.error('Erreur mise à jour métadonnées:', error.response?.data || error.message);
    throw new Error('Échec de la mise à jour des métadonnées');
  }
};

/**
 * Obtenir le texte OCR d'un document (si disponible)
 * @param {String} documentId - ID du document Mayan
 * @returns {Promise<String>} - Texte OCR
 */
exports.getMayanOCRText = async (documentId) => {
  try {
    if (!mayanClient) {
      console.warn('⚠️  [MAYAN] Mayan EDMS non configuré - OCR non disponible');
      return '';
    }
    
    // Si c'est un ID local, on ne peut pas récupérer le texte OCR
    if (documentId.startsWith('local-')) {
      console.warn('⚠️  [MAYAN] Document stocké localement - OCR non disponible');
      return '';
    }
    
    const response = await mayanClient.get(`/documents/${documentId}/versions/latest/pages/`);
    
    let fullText = '';
    const pages = response.data.results || [];
    
    // Récupérer le texte de chaque page
    for (const page of pages) {
      try {
        const pageResponse = await mayanClient.get(`/documents/${documentId}/versions/latest/pages/${page.page_number}/ocr/`);
        fullText += pageResponse.data.content + '\n';
      } catch (pageError) {
        console.warn(`⚠️  [MAYAN] Pas de texte OCR pour la page ${page.page_number}`);
      }
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('❌ [MAYAN] Erreur récupération OCR:', error.response?.data || error.message);
    return '';
  }
};

/**
 * Vérifier la connexion à Mayan EDMS
 * @returns {Promise<Boolean>} - État de la connexion
 */
exports.checkMayanConnection = async () => {
  try {
    if (!mayanClient) {
      console.warn('⚠️  [MAYAN] Mayan EDMS non configuré');
      return false;
    }
    await mayanClient.get('/');
    console.log('✅ [MAYAN] Connexion à Mayan EDMS réussie');
    return true;
  } catch (error) {
    console.error('❌ [MAYAN] Mayan EDMS non accessible:', error.message);
    return false;
  }
};

// Exporter le client pour utilisation externe si nécessaire
exports.mayanClient = mayanClient;

