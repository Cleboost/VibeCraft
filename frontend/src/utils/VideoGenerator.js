/**
 * Classe de base pour tous les générateurs de vidéos
 * Les générateurs personnalisés doivent hériter de cette classe
 */
export class VideoGenerator {
  /**
   * Retourne le manifest du générateur
   * @returns {Object} Manifest du générateur
   */
  static get manifest() {
    return {
      name: "Générateur de base",
      version: "1.0.0",
      package_id: "com.vibecraft.generators.base",
      api_version: "1.0",
      description: "Générateur de base",
      author: "VibeCraft",
      config: []
    };
  }

  /**
   * Retourne la configuration des paramètres spécifiques au générateur
   * @returns {Array} Tableau d'objets décrivant les paramètres
   * Format: { name: string, type: 'number'|'color'|'boolean'|'file', default: any, min?: number, max?: number, label: string }
   */
  getConfig() {
    return this.constructor.manifest.config;
  }

  /**
   * Initialise le générateur avec le canvas et les paramètres
   * @param {HTMLCanvasElement} canvas Le canvas HTML pour le rendu
   * @param {Object} params Les paramètres de configuration
   */
  setup(canvas, params) {
    // À implémenter dans les classes dérivées
  }

  /**
   * Dessine une frame de l'animation
   * @param {HTMLCanvasElement} canvas Le canvas HTML pour le rendu
   * @param {Object} params Les paramètres de configuration
   */
  draw(canvas, params) {
    // À implémenter dans les classes dérivées
  }

  /**
   * Méthode optionnelle pour nettoyer les ressources
   */
  cleanup() {
    // À implémenter si nécessaire dans les classes dérivées
  }
} 