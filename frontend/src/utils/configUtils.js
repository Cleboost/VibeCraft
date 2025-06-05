/**
 * Fonction utilitaire pour aplatir la config (catégories incluses)
 * Extrait tous les paramètres même ceux imbriqués dans les catégories
 */
export function flattenConfig(config) {
  let params = [];
  config.forEach(param => {
    if (param.type === 'categorie' && Array.isArray(param.content)) {
      params = params.concat(flattenConfig(param.content));
    } else {
      params.push(param);
    }
  });
  return params;
} 