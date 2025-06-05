import React, { useState, useEffect } from 'react';
import { Video } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PreviewPanel from './components/PreviewPanel';
import GeneratorConfigPanel from './components/GeneratorConfigPanel';
import UpdateDialog from './components/UpdateDialog';
import { ListGenerators, SaveGeneratorConfig, LoadGeneratorConfig, CheckForUpdates } from '../wailsjs/go/main/App';
import { BouncingBallGenerator } from './generators/bouncingBall';
import { loadGenerator } from './utils/generatorLoader';
import { flattenConfig } from './utils/configUtils';

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
  const [canvasKey, setCanvasKey] = useState(0);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    const defaultGenerator = new BouncingBallGenerator();
    const defaultParams = {};
    flattenConfig(defaultGenerator.getConfig()).forEach(param => {
      defaultParams[param.name] = param.default;
    });
    setGeneratorParams({ ...defaultParams });
    setSelectedGenerator(defaultGenerator);
    setCanvasKey(prev => prev + 1); // Force le setup au premier affichage
    loadAvailableGenerators();
    
    // Vérifier les mises à jour au démarrage
    checkForUpdatesOnStartup();
  }, []);

  const checkForUpdatesOnStartup = async () => {
    try {
      const updateInfo = await CheckForUpdates();
      if (updateInfo && updateInfo.available) {
        setShowUpdateDialog(true);
      }
    } catch (error) {
      console.log('Vérification des mises à jour échouée:', error);
      // Ne pas afficher d'erreur à l'utilisateur pour ne pas le déranger au démarrage
    }
  };

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
      flattenConfig(manifest.config).forEach(param => {
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
      flattenConfig(defaultGenerator.getConfig()).forEach(param => {
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

  const handleReset = () => {
    if (!selectedGenerator) return;
    const defaults = {};
    flattenConfig(selectedGenerator.getConfig()).forEach(param => {
      defaults[param.name] = param.default;
    });
    setGeneratorParams({ ...defaults });
    setCanvasKey(prev => prev + 1); // Force le reset du canvas
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
              <button 
                onClick={() => setShowUpdateDialog(true)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Vérifier les mises à jour
              </button>
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
            canvasKey={canvasKey}
          />
          {/* Droite : configuration du générateur */}
          <GeneratorConfigPanel
            selectedGenerator={selectedGenerator}
            generatorParams={generatorParams}
            onParameterChange={handleParameterChange}
            onReset={handleReset}
          />
        </div>
      </div>
      
      {/* Dialogue de mise à jour */}
      <UpdateDialog 
        isVisible={showUpdateDialog} 
        onClose={() => setShowUpdateDialog(false)} 
      />
    </div>
  );
}

export default App;
