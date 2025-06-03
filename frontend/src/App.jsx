import React, { useState, useEffect } from 'react';
import { Video } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PreviewPanel from './components/PreviewPanel';
import GeneratorConfigPanel from './components/GeneratorConfigPanel';
import { ListGenerators, SaveGeneratorConfig, LoadGeneratorConfig } from '../wailsjs/go/main/App';
import { BouncingBallGenerator } from './generators/bouncingBall';
import { loadGenerator } from './utils/generatorLoader';

function App() {
  const [globalSettings, setGlobalSettings] = useState({
    duration: 5,
    framerate: 30,
    format: 'webm',
    resolution: '1920x1080'
  });
  const [selectedGenerator, setSelectedGenerator] = useState(null);
  const [generatorParams, setGeneratorParams] = useState({});
  const [availableGenerators, setAvailableGenerators] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const defaultGenerator = new BouncingBallGenerator();
    setSelectedGenerator(defaultGenerator);
    const defaultParams = {};
    defaultGenerator.getConfig().forEach(param => {
      defaultParams[param.name] = param.default;
    });
    setGeneratorParams(defaultParams);
    loadAvailableGenerators();
  }, []);

  const loadAvailableGenerators = async () => {
    try {
      const generators = await ListGenerators();
      // Pour chaque générateur, charge dynamiquement et récupère le nom du manifeste
      const enrichedGenerators = await Promise.all(
        (generators || []).map(async (g) => {
          try {
            const instance = await loadGenerator(g.filename);
            const manifestName = instance.constructor.manifest?.name || g.name || g.filename;
            return { ...g, name: manifestName };
          } catch {
            // fallback si erreur de chargement
            return g;
          }
        })
      );
      setAvailableGenerators(enrichedGenerators);
    } catch (error) {
      console.error('Erreur lors du chargement des générateurs:', error);
    }
  };

  const handleGeneratorSelect = async (generatorIdentifier) => {
    try {
      let generator, manifest, packageId;
      if (generatorIdentifier === 'default') {
        generator = new BouncingBallGenerator();
        manifest = generator.constructor.manifest;
      } else {
        generator = await loadGenerator(generatorIdentifier);
        manifest = generator.constructor.manifest;
      }
      packageId = manifest.package_id;

      // Charger la config sauvegardée
      let savedConfig = {};
      try {
        const raw = await LoadGeneratorConfig(packageId);
        if (raw) savedConfig = JSON.parse(raw);
      } catch (e) { /* ignore */ }

      // Générer la config par défaut
        const defaultParams = {};
      manifest.config.forEach(param => {
          defaultParams[param.name] = param.default;
        });

      // Fusionner la config sauvegardée avec les valeurs par défaut
      setGeneratorParams({ ...defaultParams, ...savedConfig });
      setSelectedGenerator(generator);
    } catch (error) {
      console.error('Erreur lors du chargement du générateur:', error);
      const defaultGenerator = new BouncingBallGenerator();
      setSelectedGenerator(defaultGenerator);
      const defaultParams = {};
      defaultGenerator.getConfig().forEach(param => {
        defaultParams[param.name] = param.default;
      });
      setGeneratorParams(defaultParams);
    }
  };

  const handleParameterChange = (newParams) => {
    setGeneratorParams(newParams);
    if (selectedGenerator && selectedGenerator.constructor.manifest) {
      const packageId = selectedGenerator.constructor.manifest.package_id;
      SaveGeneratorConfig(packageId, JSON.stringify(newParams));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* En-tête moderne sans emoji */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">VibeCraft</h1>
                <p className="text-xs text-gray-600">Générateur de vidéos satisfaisantes</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">Prêt</span>
              <span>Wails + React</span>
            </div>
          </div>
        </div>
      </header>
      <div className="w-full px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar : paramètres globaux + générateurs */}
          <Sidebar
            globalSettings={globalSettings}
            setGlobalSettings={setGlobalSettings}
            availableGenerators={availableGenerators}
            onGeneratorSelect={handleGeneratorSelect}
            onGeneratorsChange={loadAvailableGenerators}
          />
          {/* Centre : prévisualisation */}
          <PreviewPanel
            generator={selectedGenerator}
            params={generatorParams}
            globalSettings={globalSettings}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />
          {/* Droite : configuration du générateur */}
          <GeneratorConfigPanel
            selectedGenerator={selectedGenerator}
            generatorParams={generatorParams}
            onParameterChange={handleParameterChange}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
