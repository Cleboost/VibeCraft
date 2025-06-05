import React, { useState, useEffect } from 'react';
import { CheckForUpdates, DownloadUpdate, InstallUpdate, GetAppVersion } from '../../wailsjs/go/main/App';
import './UpdateDialog.css';

const UpdateDialog = ({ isVisible, onClose }) => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [currentVersion, setCurrentVersion] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedFile, setDownloadedFile] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVisible) {
      loadCurrentVersion();
      checkForUpdates();
    }
  }, [isVisible]);

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
    setError('');
    try {
      const filePath = await DownloadUpdate(updateInfo.downloadUrl);
      setDownloadedFile(filePath);
    } catch (err) {
      setError(`Erreur lors du téléchargement: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstall = async () => {
    if (!downloadedFile) return;

    setIsInstalling(true);
    setError('');
    try {
      await InstallUpdate(downloadedFile);
      // L'application va redémarrer automatiquement
    } catch (err) {
      setError(`Erreur lors de l'installation: ${err.message}`);
      setIsInstalling(false);
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
    <div className="update-dialog-overlay">
      <div className="update-dialog">
        <div className="update-header">
          <h2>Mise à jour disponible</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="update-content">
          {isChecking && (
            <div className="checking">
              <div className="spinner"></div>
              <p>Vérification des mises à jour...</p>
            </div>
          )}

          {error && (
            <div className="error">
              <p>{error}</p>
              <button onClick={checkForUpdates}>Réessayer</button>
            </div>
          )}

          {updateInfo && !updateInfo.available && !isChecking && (
            <div className="no-update">
              <h3>Aucune mise à jour disponible</h3>
              <p>Vous utilisez déjà la dernière version ({currentVersion})</p>
            </div>
          )}

          {updateInfo && updateInfo.available && (
            <div className="update-available">
              <div className="version-info">
                <div className="version-item">
                  <span className="version-label">Version actuelle:</span>
                  <span className="version-value current">{updateInfo.currentVersion}</span>
                </div>
                <div className="version-item">
                  <span className="version-label">Nouvelle version:</span>
                  <span className="version-value new">{updateInfo.latestVersion}</span>
                </div>
                {updateInfo.size > 0 && (
                  <div className="version-item">
                    <span className="version-label">Taille du téléchargement:</span>
                    <span className="version-value">{formatFileSize(updateInfo.size)}</span>
                  </div>
                )}
              </div>

              {updateInfo.releaseNotes && (
                <div className="release-notes">
                  <h4>Notes de version:</h4>
                  <div className="notes-content">
                    {updateInfo.releaseNotes.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="update-actions">
                {!downloadedFile && !isDownloading && !isInstalling && (
                  <>
                    <button className="btn-primary" onClick={handleDownload}>
                      Télécharger la mise à jour
                    </button>
                    <button className="btn-secondary" onClick={onClose}>
                      Plus tard
                    </button>
                  </>
                )}

                {isDownloading && (
                  <div className="download-progress">
                    <p>Téléchargement en cours...</p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{downloadProgress}%</span>
                  </div>
                )}

                {downloadedFile && !isInstalling && (
                  <>
                    <button className="btn-primary" onClick={handleInstall}>
                      Installer et redémarrer
                    </button>
                    <button className="btn-secondary" onClick={onClose}>
                      Installer plus tard
                    </button>
                  </>
                )}

                {isInstalling && (
                  <div className="installing">
                    <div className="spinner"></div>
                    <p>Installation en cours... L'application va redémarrer.</p>
                  </div>
                )}
              </div>

              {updateInfo.releaseUrl && (
                <div className="release-link">
                  <a 
                    href={updateInfo.releaseUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Voir la release sur GitHub
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