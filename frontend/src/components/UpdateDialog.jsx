import React, { useState, useEffect } from 'react';
import { CheckForUpdates, DownloadUpdate, InstallUpdateWithRestart, GetAppVersion } from '../../wailsjs/go/main/App';
import { Download, RefreshCw, Package, CheckCircle2, AlertCircle, ExternalLink, X, Sparkles } from 'lucide-react';

const UpdateDialog = ({ isVisible, onClose }) => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [currentVersion, setCurrentVersion] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedFile, setDownloadedFile] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState('');
  const [isRestarting, setIsRestarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVisible) {
      loadCurrentVersion();
      checkForUpdates();
    }
  }, [isVisible]);

  // Écouter les événements de progression en temps réel
  useEffect(() => {
    if (window.runtime) {
      // Écouter les événements de progression de téléchargement
      window.runtime.EventsOn('download-progress', (progress) => {
        setDownloadProgress(progress.percent || 0);
      });

      // Nettoyer les listeners quand le composant se démonte
      return () => {
        window.runtime.EventsOff('download-progress');
      };
    }
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const version = await GetAppVersion();
      setCurrentVersion(version);
    } catch (err) {
      console.error('Erreur lors de la récupération de la version:', err);
    }
  };

  const checkForUpdates = async () => {
    setIsChecking(true);
    setError('');
    try {
      const result = await CheckForUpdates();
      setUpdateInfo(result);
    } catch (err) {
      setError(`Erreur lors de la vérification des mises à jour: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!updateInfo?.downloadUrl) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setError('');
    
    try {
      const filePath = await DownloadUpdate(updateInfo.downloadUrl);
      setDownloadedFile(filePath);
      setDownloadProgress(100); // S'assurer que c'est à 100% à la fin
    } catch (err) {
      setError(`Erreur lors du téléchargement: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstall = async () => {
    if (!downloadedFile) return;

    setIsInstalling(true);
    setInstallProgress('Préparation de l\'installation...');
    setError('');
    
    try {
      setInstallProgress('Extraction des fichiers...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInstallProgress('Installation en cours...');
      await InstallUpdateWithRestart(downloadedFile);
      
      setInstallProgress('Installation terminée !');
      setIsInstalling(false);
      setIsRestarting(true);
      
      setTimeout(() => {
        setInstallProgress('Redémarrage de l\'application...');
        setTimeout(() => {
          onClose();
        }, 3000);
      }, 1500);
      
    } catch (err) {
      setError(`Erreur lors de l'installation: ${err.message}`);
      setIsInstalling(false);
      setInstallProgress('');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-large max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Mise à jour VibeCraft</h2>
                <p className="text-sm text-gray-600">Vérifiez les dernières améliorations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isChecking && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Vérification en cours...</h3>
              <p className="text-gray-600">Recherche de nouvelles versions disponibles</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">Erreur</h3>
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={checkForUpdates}
                    className="mt-3 btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}

          {updateInfo && !updateInfo.available && !isChecking && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tout est à jour !</h3>
              <p className="text-gray-600 mb-4">
                Vous utilisez déjà la dernière version <span className="font-medium text-gray-900">{currentVersion}</span>
              </p>
              <button
                onClick={onClose}
                className="btn btn-secondary"
              >
                Fermer
              </button>
            </div>
          )}

          {updateInfo && updateInfo.available && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Nouvelle version disponible</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">Version actuelle</p>
                    <div className="bg-white rounded-lg px-3 py-2 border border-blue-200">
                      <span className="text-sm font-mono text-gray-700">{updateInfo.currentVersion}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">Nouvelle version</p>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3 py-2 border border-green-200">
                      <span className="text-sm font-mono text-green-700">{updateInfo.latestVersion}</span>
                    </div>
                  </div>
                </div>
                {updateInfo.size > 0 && (
                  <div className="mt-3 flex items-center justify-between text-xs text-blue-600">
                    <span>Taille du téléchargement</span>
                    <span className="font-medium">{formatFileSize(updateInfo.size)}</span>
                  </div>
                )}
              </div>

              {updateInfo.releaseNotes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>Nouveautés</span>
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto border border-gray-200">
                    {updateInfo.releaseNotes.split('\n').map((line, index) => (
                      <p key={index} className="text-sm text-gray-700 mb-2 last:mb-0">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {isDownloading && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Download className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Téléchargement en cours...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white rounded-full h-2 overflow-hidden border border-blue-200">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>Progression</span>
                      <span className="font-medium">{downloadProgress}%</span>
                    </div>
                  </div>
                </div>
              )}

              {(isInstalling || isRestarting) && (
                <div className={`rounded-xl p-4 border ${isRestarting ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isRestarting ? 'border-purple-600' : 'border-green-600'}`} />
                    <div>
                      <p className={`font-medium ${isRestarting ? 'text-purple-900' : 'text-green-900'}`}>
                        {isRestarting ? 'Redémarrage...' : 'Installation en cours...'}
                      </p>
                      <p className={`text-sm ${isRestarting ? 'text-purple-700' : 'text-green-700'}`}>
                        {installProgress || (isRestarting ? 'L\'application va redémarrer dans quelques secondes' : 'Patientez pendant l\'installation')}
                      </p>
                      {!isRestarting && (
                        <div className="mt-2 bg-white rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-green-500 transition-all duration-500 animate-pulse w-3/4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                {!downloadedFile && !isDownloading && !isInstalling && (
                  <>
                    <button
                      onClick={handleDownload}
                      className="flex-1 btn btn-primary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </button>
                    <button
                      onClick={onClose}
                      className="btn btn-secondary"
                    >
                      Plus tard
                    </button>
                  </>
                )}

                {downloadedFile && !isInstalling && !isRestarting && (
                  <>
                    <button
                      onClick={handleInstall}
                      className="flex-1 btn btn-success"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Installer et redémarrer
                    </button>
                    <button
                      onClick={onClose}
                      className="btn btn-secondary"
                    >
                      Plus tard
                    </button>
                  </>
                )}
              </div>

              {updateInfo.releaseUrl && (
                <div className="pt-4 border-t border-gray-200">
                  <a
                    href={updateInfo.releaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Voir les détails sur GitHub</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateDialog; 