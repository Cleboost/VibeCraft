import React from 'react';
import { Hash, Palette, ToggleLeft, File as FileIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const DynamicForm = ({ config, values, onChange }) => {
  const [formValues, setFormValues] = useState({});
  const isInitialMount = useRef(true);
  const previousValues = useRef({});
  const timeoutRef = useRef(null);

  // Fonction pour obtenir les valeurs par défaut
  const getDefaultValues = () => {
    const defaults = {};
    config.forEach(param => {
      defaults[param.name] = param.default;
    });
    return defaults;
  };

  // Effet pour initialiser les valeurs
  useEffect(() => {
    const defaultValues = getDefaultValues();
    const initialValues = { ...defaultValues, ...values };
    setFormValues(initialValues);
    previousValues.current = initialValues;
  }, [config]);

  // Effet pour gérer les changements de valeurs externes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const defaultValues = getDefaultValues();
    const newValues = { ...defaultValues, ...values };
    
    // Vérifier si les valeurs ont réellement changé
    const hasChanged = Object.keys(newValues).some(key => 
      newValues[key] !== previousValues.current[key]
    );

    if (hasChanged) {
      console.log('Mise à jour depuis les props:', newValues);
      setFormValues(newValues);
      previousValues.current = newValues;
    }
  }, [values, config]);

  const handleChange = (paramName, value) => {
    // Annuler le timeout précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mettre à jour les valeurs locales immédiatement
    setFormValues(prev => {
      const newValues = {
        ...prev,
        [paramName]: value
      };
      return newValues;
    });

    // Débouncer l'appel à onChange
    timeoutRef.current = setTimeout(() => {
      const defaultValues = getDefaultValues();
      const currentValues = { ...defaultValues, ...formValues, [paramName]: value };
      console.log('Notification de changement:', currentValues);
      previousValues.current = currentValues;
      onChange(currentValues);
    }, 100); // Attendre 100ms avant de notifier le changement
  };

  const handleFileChange = (paramName, file) => {
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Le fichier ne doit pas dépasser 5 Mo');
      return;
    }
    handleChange(paramName, file);
  };

  const getFieldIcon = (type) => {
    switch (type) {
      case 'number':
        return <Hash className="w-4 h-4 text-blue-500" />;
      case 'color':
        return <Palette className="w-4 h-4 text-pink-500" />;
      case 'boolean':
        return <ToggleLeft className="w-4 h-4 text-green-500" />;
      case 'file':
        return <FileIcon className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const renderField = (param) => {
    const value = formValues[param.name];

    switch (param.type) {
      case 'number':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Valeur: {value || param.default}</span>
              {param.min !== undefined && param.max !== undefined && (
                <span className="text-xs text-gray-500">{param.min} - {param.max}</span>
              )}
            </div>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step || (param.max - param.min > 10 ? 1 : 0.1)}
              value={value || param.default}
              onChange={(e) => handleChange(param.name, parseFloat(e.target.value) || param.default)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: param.min !== undefined && param.max !== undefined 
                  ? `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((value || param.default) - param.min) / (param.max - param.min) * 100}%, #E5E7EB ${((value || param.default) - param.min) / (param.max - param.min) * 100}%, #E5E7EB 100%)`
                  : '#3B82F6'
              }}
            />
            <input
              type="number"
              min={param.min}
              max={param.max}
              step={param.step || 0.1}
              value={value || param.default}
              onChange={(e) => handleChange(param.name, parseFloat(e.target.value) || param.default)}
              className="form-input text-center"
              style={{ width: '80px' }}
            />
          </div>
        );

      case 'color':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-xl border-2 border-gray-200 shadow-sm cursor-pointer"
                style={{ backgroundColor: value || param.default }}
                onClick={() => document.getElementById(`color-${param.name}`).click()}
              ></div>
              <div className="flex-1">
                <input
                  id={`color-${param.name}`}
                  type="color"
                  value={value || param.default}
                  onChange={(e) => handleChange(param.name, e.target.value)}
                  className="sr-only"
                />
                <input
                  type="text"
                  value={value || param.default}
                  onChange={(e) => handleChange(param.name, e.target.value)}
                  className="form-input"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                <button
                  key={color}
                  onClick={() => handleChange(param.name, color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                    (value || param.default) === color ? 'border-gray-400 scale-110' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                ></button>
              ))}
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleChange(param.name, !value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                value !== undefined ? (value ? 'bg-blue-600' : 'bg-gray-200') : (param.default ? 'bg-blue-600' : 'bg-gray-200')
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  value !== undefined ? (value ? 'translate-x-6' : 'translate-x-1') : (param.default ? 'translate-x-6' : 'translate-x-1')
                }`}
              />
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {value !== undefined ? (value ? 'Activé' : 'Désactivé') : (param.default ? 'Activé' : 'Désactivé')}
              </p>
              <p className="text-xs text-gray-500">
                Cliquez pour {value !== undefined ? (value ? 'désactiver' : 'activer') : (param.default ? 'désactiver' : 'activer')}
              </p>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => handleFileChange(param.name, e.target.files[0])}
                className="form-file"
              />
            </div>
            {value && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">📎</span>
                  <div>
                    <p className="text-sm font-medium text-green-800">{value.name}</p>
                    <p className="text-xs text-green-600">
                      {(value.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Formats acceptés: PNG, JPG, JPEG</p>
              <p>• Taille maximale: 5 Mo</p>
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || param.default || ''}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="form-input"
          />
        );
    }
  };

  if (!config || config.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Palette className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-600">Ce générateur ne nécessite aucune configuration.</p>
        <p className="text-sm text-gray-500 mt-1">Vous pouvez directement passer à la prévisualisation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {config.map((param, index) => (
        <div key={param.name} className="form-group">
          <label className="form-label flex items-center space-x-2">
            <span>{getFieldIcon(param.type)}</span>
            <span>{param.label}</span>
            {param.type === 'number' && (
              <span className="badge badge-primary">
                {formValues[param.name] || param.default}
              </span>
            )}
          </label>
          <div className="mt-2">
            {renderField(param)}
          </div>
          {index < config.length - 1 && (
            <hr className="mt-6 border-gray-100" />
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicForm; 