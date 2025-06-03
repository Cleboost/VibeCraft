import React from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import DynamicForm from './DynamicForm';

const GeneratorConfigPanel = ({ selectedGenerator, generatorParams, onParameterChange }) => {
  // Fonction pour remettre la config par défaut
  const handleReset = () => {
    if (!selectedGenerator) return;
    const defaults = {};
    selectedGenerator.getConfig().forEach(param => {
      defaults[param.name] = param.default;
    });
    onParameterChange(defaults);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-4">
      <div className="flex items-center space-x-2 mb-4">
        <Palette className="w-4 h-4 text-orange-600" />
        <h2 className="text-sm font-semibold text-gray-900">Configuration</h2>
      </div>
      {selectedGenerator ? (
        <>
          <DynamicForm 
            config={selectedGenerator.getConfig()}
            values={generatorParams}
            onChange={onParameterChange}
          />
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-xs text-orange-800 font-medium mb-1">
              Générateur actuel
            </div>
            <div className="text-xs text-orange-600">
              {selectedGenerator.constructor.name === 'BouncingBallGenerator' 
                ? 'Balle rebondissante (défaut)' 
                : 'Générateur personnalisé'}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              {selectedGenerator.getConfig().length} paramètre{selectedGenerator.getConfig().length > 1 ? 's' : ''} configurable{selectedGenerator.getConfig().length > 1 ? 's' : ''}
            </div>
          </div>
          <button
            className="mt-4 flex items-center justify-center w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition text-xs font-medium"
            onClick={handleReset}
            type="button"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Réinitialiser
          </button>
        </>
      ) : (
        <div className="text-center py-8">
          <Palette className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <div className="text-sm text-gray-500">
            Sélectionnez un générateur
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Pour configurer ses paramètres
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratorConfigPanel; 