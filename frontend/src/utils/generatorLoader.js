import { BouncingBallGenerator } from '../generators/bouncingBall.js';
import { LoadGenerator } from '../../wailsjs/go/main/App';
import { VideoGenerator } from './VideoGenerator.js';

/**
 * Vérifie si un manifest est valide
 * @param {Object} manifest - Manifest à valider
 * @returns {boolean} True si le manifest est valide
 */
function validateManifest(manifest) {
  const requiredFields = ['name', 'version', 'package_id', 'api_version', 'description', 'author', 'config'];
  return requiredFields.every(field => manifest && manifest[field] !== undefined);
}

/**
 * Charge un générateur selon son type
 * @param {string} generatorType - 'default' pour le générateur par défaut, ou nom de fichier pour les générateurs importés
 * @returns {Promise<VideoGenerator>} Instance du générateur
 */
export async function loadGenerator(generatorType) {
  if (generatorType === 'default') {
    return new BouncingBallGenerator();
  }
  
  try {
    const generatorCode = await LoadGenerator(generatorType);
    try {
      // Injecte VideoGenerator dans le scope global du script
      const injectedCode = `
        const VideoGenerator = arguments[0];
        ${generatorCode}
      `;
      const generatorClass = new Function(injectedCode)(VideoGenerator);
      
      if (!generatorClass) {
        throw new Error('Aucune classe de générateur trouvée dans le fichier');
      }
      
      if (!validateManifest(generatorClass.manifest)) {
        throw new Error('Le manifest du générateur est invalide ou incomplet');
      }
      
      const instance = new generatorClass();
      if (typeof instance.setup !== 'function' || 
          typeof instance.draw !== 'function') {
        throw new Error('Le générateur ne respecte pas l\'interface VideoGenerator');
      }
      return instance;
    } catch (error) {
      console.error('Erreur lors de l\'évaluation du code du générateur:', error);
      throw new Error(`Erreur dans le code du générateur: ${error.message}`);
    }
  } catch (error) {
    console.error('Erreur lors du chargement du générateur:', error);
    throw new Error(`Impossible de charger le générateur: ${error.message}`);
  }
}

/**
 * Obtient la configuration d'un générateur
 * @param {string} generatorType - Type de générateur
 * @returns {Promise<Array>} Configuration du générateur
 */
export async function getGeneratorConfig(generatorType) {
  try {
    const generator = await loadGenerator(generatorType);
    return generator.constructor.manifest.config;
  } catch (error) {
    console.error('Erreur lors de l\'obtention de la configuration:', error);
    return [];
  }
}

/**
 * Valide qu'un code de générateur est correct
 * @param {string} code - Code JavaScript du générateur
 * @returns {boolean} True si le code est valide
 */
export function validateGeneratorCode(code) {
  try {
    if (!code.includes('class') || !code.includes('VideoGenerator')) {
      return false;
    }
    const requiredMethods = ['setup', 'draw'];
    if (!requiredMethods.every(method => code.includes(method))) {
      return false;
    }
    if (!code.includes('manifest')) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
} 