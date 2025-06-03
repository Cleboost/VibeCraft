import React from 'react';
import { Settings, Upload } from 'lucide-react';
import GlobalSettings from './GlobalSettings';
import GeneratorManager from './GeneratorManager';

const Sidebar = ({ globalSettings, setGlobalSettings, availableGenerators, onGeneratorSelect, onGeneratorsChange }) => {
  return (
    <div className="space-y-4">
      {/* Paramètres globaux */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Settings className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Paramètres</h2>
        </div>
        <GlobalSettings 
          settings={globalSettings} 
          onChange={setGlobalSettings} 
        />
      </div>
      {/* Gestion des générateurs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Upload className="w-4 h-4 text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-900">Générateurs</h2>
        </div>
        <GeneratorManager 
          availableGenerators={availableGenerators}
          onGeneratorSelect={onGeneratorSelect}
          onGeneratorsChange={onGeneratorsChange}
        />
      </div>
    </div>
  );
};

export default Sidebar; 