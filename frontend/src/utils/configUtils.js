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