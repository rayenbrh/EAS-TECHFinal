const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const { getMayanOCRText, downloadFromMayan } = require('./mayanService');
const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

/**
 * Extraire le texte d'un document PDF
 * @param {Buffer} buffer - Buffer du fichier PDF
 * @returns {Promise<String>} - Texte extrait
 */
const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Erreur extraction PDF:', error);
    throw new Error('Impossible d\'extraire le texte du PDF');
  }
};

/**
 * Extraire le texte d'un document Word (.docx)
 * @param {Buffer} buffer - Buffer du fichier Word
 * @returns {Promise<String>} - Texte extrait
 */
const extractTextFromWord = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Erreur extraction Word:', error);
    throw new Error('Impossible d\'extraire le texte du document Word');
  }
};

/**
 * Extraire le texte d'un fichier Excel
 * @param {Buffer} buffer - Buffer du fichier Excel
 * @returns {Promise<String>} - Texte extrait
 */
const extractTextFromExcel = async (buffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_csv(worksheet);
      text += `\n\n=== Feuille: ${sheetName} ===\n${sheetData}`;
    });

    return text;
  } catch (error) {
    console.error('Erreur extraction Excel:', error);
    throw new Error('Impossible d\'extraire le texte du fichier Excel');
  }
};

/**
 * Extraire le texte d'un document en fonction de son type MIME
 * @param {String} documentId - ID du document MongoDB
 * @param {Buffer} fileBuffer - Buffer du fichier (optionnel, si non fourni, téléchargé depuis Mayan)
 * @returns {Promise<String>} - Texte extrait
 */
exports.extractTextFromDocument = async (documentId, fileBuffer = null) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document non trouvé');
    }

    let buffer = fileBuffer;
    let text = '';

    // Si pas de buffer fourni, essayer de télécharger depuis Mayan
    if (!buffer && document.mayanId && !document.mayanId.startsWith('local-')) {
      try {
        buffer = await downloadFromMayan(document.mayanId);
      } catch (error) {
        console.warn('⚠️  [TEXT-EXTRACTION] Impossible de télécharger depuis Mayan, tentative OCR');
        // Essayer OCR depuis Mayan
        text = await getMayanOCRText(document.mayanId);
        if (text && text.trim().length > 0) {
          return text;
        }
      }
    }

    // Si on a un buffer, extraire selon le type MIME
    if (buffer) {
      const mimeType = document.mimeType.toLowerCase();

      if (mimeType.includes('pdf')) {
        text = await extractTextFromPDF(buffer);
      } else if (mimeType.includes('word') || mimeType.includes('document') || 
                 document.filename.endsWith('.docx') || document.filename.endsWith('.doc')) {
        text = await extractTextFromWord(buffer);
      } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') ||
                 document.filename.endsWith('.xlsx') || document.filename.endsWith('.xls')) {
        text = await extractTextFromExcel(buffer);
      } else if (mimeType.includes('text') || mimeType.includes('plain')) {
        text = buffer.toString('utf-8');
      } else if (mimeType.includes('json')) {
        try {
          const jsonData = JSON.parse(buffer.toString('utf-8'));
          text = JSON.stringify(jsonData, null, 2);
        } catch (e) {
          text = buffer.toString('utf-8');
        }
      } else {
        // Pour les autres types, essayer OCR depuis Mayan
        if (document.mayanId && !document.mayanId.startsWith('local-')) {
          text = await getMayanOCRText(document.mayanId);
        }
        
        if (!text || text.trim().length === 0) {
          text = `[Type de fichier: ${document.mimeType}] Extraction de texte non disponible pour ce type de document.`;
        }
      }
    } else {
      // Si pas de buffer, essayer OCR depuis Mayan
      if (document.mayanId && !document.mayanId.startsWith('local-')) {
        text = await getMayanOCRText(document.mayanId);
      }
      
      if (!text || text.trim().length === 0) {
        text = `Document: ${document.filename}\nType: ${document.mimeType}\nTaille: ${(document.size / 1024).toFixed(2)} KB`;
      }
    }

    // Nettoyer le texte
    text = text.trim();
    
    if (text.length === 0) {
      text = `Document: ${document.filename}\nType: ${document.mimeType}\nTaille: ${(document.size / 1024).toFixed(2)} KB\n\n[Extraction de texte non disponible]`;
    }

    return text;
  } catch (error) {
    console.error('❌ [TEXT-EXTRACTION] Erreur:', error.message);
    throw error;
  }
};

/**
 * Extraire le texte depuis un buffer directement
 * @param {Buffer} buffer - Buffer du fichier
 * @param {String} mimeType - Type MIME du fichier
 * @param {String} filename - Nom du fichier
 * @returns {Promise<String>} - Texte extrait
 */
exports.extractTextFromBuffer = async (buffer, mimeType, filename = '') => {
  try {
    let text = '';
    const mimeTypeLower = mimeType.toLowerCase();

    if (mimeTypeLower.includes('pdf')) {
      text = await extractTextFromPDF(buffer);
    } else if (mimeTypeLower.includes('word') || mimeTypeLower.includes('document') ||
               filename.endsWith('.docx') || filename.endsWith('.doc')) {
      text = await extractTextFromWord(buffer);
    } else if (mimeTypeLower.includes('excel') || mimeTypeLower.includes('spreadsheet') ||
               filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      text = await extractTextFromExcel(buffer);
    } else if (mimeTypeLower.includes('text') || mimeTypeLower.includes('plain')) {
      text = buffer.toString('utf-8');
    } else if (mimeTypeLower.includes('json')) {
      try {
        const jsonData = JSON.parse(buffer.toString('utf-8'));
        text = JSON.stringify(jsonData, null, 2);
      } catch (e) {
        text = buffer.toString('utf-8');
      }
    } else {
      text = `[Type de fichier: ${mimeType}] Extraction de texte non disponible pour ce type de document.`;
    }

    return text.trim() || `Fichier: ${filename || 'sans nom'}`;
  } catch (error) {
    console.error('❌ [TEXT-EXTRACTION] Erreur extraction depuis buffer:', error.message);
    throw error;
  }
};
