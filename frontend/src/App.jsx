import React, { useState, useEffect } from 'react';
import { Video, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PreviewPanel from './components/PreviewPanel';
import GeneratorConfigPanel from './components/GeneratorConfigPanel';
import UpdateDialog from './components/UpdateDialog';
import ChangelogDialog from './components/ChangelogDialog';
import { ListGenerators, SaveGeneratorConfig, LoadGeneratorConfig, CheckForUpdates, ShouldShowChangelog, MarkVersionAsSeen, GetLatestReleaseInfo, GetAppVersion, IsFirstTimeUser } from '../wailsjs/go/main/App';
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
  const [showChangelogDialog, setShowChangelogDialog] = useState(false);
  const [changelogInfo, setChangelogInfo] = useState(null);
  const [isManualChangelog, setIsManualChangelog] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      const defaultGenerator = new BouncingBallGenerator();
      const defaultParams = {};
      flattenConfig(defaultGenerator.getConfig()).forEach(param => {
        defaultParams[param.name] = param.default;
      });
      setGeneratorParams({ ...defaultParams });
      setSelectedGenerator(defaultGenerator);
      setCanvasKey(prev => prev + 1);
      
      await loadAvailableGenerators();
      
      await checkShouldShowChangelog();
    
      await checkForUpdatesOnStartup();
    };

    initializeApp();
  }, []);

  const checkShouldShowChangelog = async () => {
    try {
      const result = await ShouldShowChangelog();
      
      const shouldShow = result?.shouldShow || false;
      const version = result?.version || "vx.x.x";
      const error = result?.error || null;
      
      if (error && error.trim() !== '') {
        console.error('Erreur retournée par ShouldShowChangelog:', error);
        return;
      }
      
      if (shouldShow) {
        const currentVersion = await GetAppVersion();
        const isFirstTimeUser = await IsFirstTimeUser();
        
        let releaseNotes = null;
        if (!isFirstTimeUser) {
          try {
            const releaseInfo = await GetLatestReleaseInfo();
            releaseNotes = releaseInfo?.releaseNotes || null;
          } catch (error) {
            console.log('Impossible de récupérer les notes de version:', error);
          }
        }
        
        setChangelogInfo({
          version: version,
          releaseNotes: releaseNotes,
          isFirstTime: isFirstTimeUser
        });
        setIsManualChangelog(false);
        setShowChangelogDialog(true);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du changelog:', error);
    }
  };

  const handleShowChangelogManually = async () => {
    try {
      const currentVersion = await GetAppVersion();
      const releaseInfo = await GetLatestReleaseInfo();
      
      setChangelogInfo({
        version: currentVersion,
        releaseNotes: releaseInfo?.releaseNotes || null,
        isFirstTime: false
      });
      setIsManualChangelog(true);
      setShowChangelogDialog(true);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture manuelle du changelog:', error);
    }
  };

  const checkForUpdatesOnStartup = async () => {
    try {
      const updateInfo = await CheckForUpdates();
      if (updateInfo && updateInfo.available) {
        setShowUpdateDialog(true);
      }
    } catch (error) {
      console.log('Vérification des mises à jour échouée:', error);
    }
  };

  const handleCloseChangelog = async () => {
    setShowChangelogDialog(false);
    if (!isManualChangelog) {
      try {
        await MarkVersionAsSeen();
      } catch (error) {
        console.log('Erreur lors de la sauvegarde de la version:', error);
      }
    }
  };

  const loadAvailableGenerators = async () => {
    try {
      const generators = await ListGenerators();
      const enrichedGenerators = await Promise.all(
        (generators || []).map(async (g) => {
          try {
            const instance = await loadGenerator(g.filename);
            const manifestName = instance.constructor.manifest?.name || g.name || g.filename;
            return { ...g, name: manifestName };
          } catch {
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

      let savedConfig = {};
      try {
        const raw = await LoadGeneratorConfig(packageId);
        if (raw) savedConfig = JSON.parse(raw);
      } catch (e) { /* ignore */ }

      
      const defaultParams = {};
      flattenConfig(manifest.config).forEach(param => {
        defaultParams[param.name] = param.default;
      });

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
    setCanvasKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setShowUpdateDialog(true)}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                >
                  Mises à jour
                </button>
                <button 
                  onClick={handleShowChangelogManually}
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Nouveautés</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="w-full px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Sidebar
            globalSettings={globalSettings}
            setGlobalSettings={setGlobalSettings}
            availableGenerators={availableGenerators}
            onGeneratorSelect={handleGeneratorSelect}
            onGeneratorsChange={loadAvailableGenerators}
          />
          <PreviewPanel
            generator={selectedGenerator}
            params={generatorParams}
            globalSettings={globalSettings}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            canvasKey={canvasKey}
          />
          <GeneratorConfigPanel
            selectedGenerator={selectedGenerator}
            generatorParams={generatorParams}
            onParameterChange={handleParameterChange}
            onReset={handleReset}
          />
        </div>
      </div>
      
      <UpdateDialog 
        isVisible={showUpdateDialog} 
        onClose={() => setShowUpdateDialog(false)} 
      />
      
      <ChangelogDialog
        isVisible={showChangelogDialog}
        onClose={handleCloseChangelog}
        version={changelogInfo?.version}
        releaseNotes={changelogInfo?.releaseNotes}
        isFirstTime={changelogInfo?.isFirstTime || false}
        showContinueButton={!isManualChangelog}
      />
    </div>
  );
}

export default App;
