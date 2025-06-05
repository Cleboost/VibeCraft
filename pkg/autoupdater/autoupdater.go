package autoupdater

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"golang.org/x/mod/semver"
)

// Release représente une release GitHub
type Release struct {
	TagName string  `json:"tag_name"`
	Name    string  `json:"name"`
	Body    string  `json:"body"`
	Assets  []Asset `json:"assets"`
	URL     string  `json:"html_url"`
}

// Asset représente un asset d'une release
type Asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
}

// UpdateInfo contient les informations d'une mise à jour
type UpdateInfo struct {
	Available      bool   `json:"available"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	ReleaseNotes   string `json:"releaseNotes"`
	DownloadURL    string `json:"downloadUrl"`
	ReleaseURL     string `json:"releaseUrl"`
	Size           int64  `json:"size"`
}

// UpdateProgress représente le progrès d'un téléchargement
type UpdateProgress struct {
	Downloaded int64 `json:"downloaded"`
	Total      int64 `json:"total"`
	Percent    int   `json:"percent"`
}

// Updater gère les mises à jour
type Updater struct {
	currentVersion string
	githubRepo     string
	httpClient     *http.Client
}

// NewUpdater crée une nouvelle instance d'Updater
func NewUpdater(currentVersion, githubRepo string) *Updater {
	return &Updater{
		currentVersion: currentVersion,
		githubRepo:     githubRepo,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// CheckForUpdates vérifie s'il y a des mises à jour disponibles
func (u *Updater) CheckForUpdates() (*UpdateInfo, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", u.githubRepo)

	resp, err := u.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("erreur lors de la vérification des mises à jour: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("erreur HTTP: %d", resp.StatusCode)
	}

	var release Release
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("erreur lors du décodage de la réponse: %w", err)
	}

	// Normaliser les versions pour la comparaison
	currentVer := u.normalizeVersion(u.currentVersion)
	latestVer := u.normalizeVersion(release.TagName)

	updateInfo := &UpdateInfo{
		CurrentVersion: u.currentVersion,
		LatestVersion:  release.TagName,
		ReleaseNotes:   release.Body,
		ReleaseURL:     release.URL,
	}

	// Vérifier si une mise à jour est disponible
	if semver.Compare(currentVer, latestVer) < 0 {
		updateInfo.Available = true

		// Trouver l'asset approprié pour la plateforme actuelle
		asset, err := u.findAssetForPlatform(release.Assets)
		if err != nil {
			return updateInfo, err
		}

		updateInfo.DownloadURL = asset.BrowserDownloadURL
		updateInfo.Size = asset.Size
	}

	return updateInfo, nil
}

// normalizeVersion s'assure que la version commence par 'v'
func (u *Updater) normalizeVersion(version string) string {
	if !strings.HasPrefix(version, "v") {
		return "v" + version
	}
	return version
}

// findAssetForPlatform trouve l'asset correspondant à la plateforme actuelle
func (u *Updater) findAssetForPlatform(assets []Asset) (*Asset, error) {
	platformSuffix := u.getPlatformSuffix()

	for _, asset := range assets {
		if strings.Contains(strings.ToLower(asset.Name), platformSuffix) {
			return &asset, nil
		}
	}

	return nil, fmt.Errorf("aucun asset trouvé pour la plateforme %s", platformSuffix)
}

// getPlatformSuffix retourne le suffixe de plateforme pour les assets
func (u *Updater) getPlatformSuffix() string {
	switch runtime.GOOS {
	case "windows":
		return "windows"
	case "darwin":
		return "darwin"
	case "linux":
		return "linux"
	default:
		return runtime.GOOS
	}
}

// DownloadUpdate télécharge la mise à jour avec un callback de progrès
func (u *Updater) DownloadUpdate(downloadURL string, progressCallback func(UpdateProgress)) (string, error) {
	resp, err := u.httpClient.Get(downloadURL)
	if err != nil {
		return "", fmt.Errorf("erreur lors du téléchargement: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("erreur HTTP lors du téléchargement: %d", resp.StatusCode)
	}

	// Créer un fichier temporaire
	tmpDir := os.TempDir()
	filename := filepath.Base(downloadURL)
	tmpFile := filepath.Join(tmpDir, filename)

	out, err := os.Create(tmpFile)
	if err != nil {
		return "", fmt.Errorf("erreur lors de la création du fichier temporaire: %w", err)
	}
	defer out.Close()

	// Télécharger avec suivi de progrès
	totalSize := resp.ContentLength
	downloaded := int64(0)

	buffer := make([]byte, 32*1024) // 32KB buffer
	for {
		n, err := resp.Body.Read(buffer)
		if n > 0 {
			out.Write(buffer[:n])
			downloaded += int64(n)

			if progressCallback != nil {
				percent := 0
				if totalSize > 0 {
					percent = int((downloaded * 100) / totalSize)
				}
				progressCallback(UpdateProgress{
					Downloaded: downloaded,
					Total:      totalSize,
					Percent:    percent,
				})
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", fmt.Errorf("erreur lors du téléchargement: %w", err)
		}
	}

	return tmpFile, nil
}

// InstallUpdate installe la mise à jour téléchargée
func (u *Updater) InstallUpdate(updateFile string) error {
	// Obtenir le chemin de l'exécutable actuel
	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("impossible d'obtenir le chemin de l'exécutable: %w", err)
	}

	// Sur Windows, on s'attend à un ZIP
	if runtime.GOOS == "windows" {
		return u.installWindowsUpdate(updateFile, currentExe)
	}

	// Sur autres plateformes, remplacer directement l'exécutable
	return u.replaceExecutable(updateFile, currentExe)
}

// installWindowsUpdate installe une mise à jour sur Windows (ZIP)
func (u *Updater) installWindowsUpdate(zipFile, currentExe string) error {
	// Extraire le ZIP
	r, err := zip.OpenReader(zipFile)
	if err != nil {
		return fmt.Errorf("erreur lors de l'ouverture du ZIP: %w", err)
	}
	defer r.Close()

	// Trouver l'exécutable dans le ZIP
	var exeFile *zip.File
	for _, f := range r.File {
		if strings.HasSuffix(strings.ToLower(f.Name), ".exe") {
			exeFile = f
			break
		}
	}

	if exeFile == nil {
		return fmt.Errorf("aucun exécutable trouvé dans le ZIP")
	}

	// Extraire l'exécutable
	rc, err := exeFile.Open()
	if err != nil {
		return fmt.Errorf("erreur lors de l'ouverture de l'exécutable: %w", err)
	}
	defer rc.Close()

	// Créer le nouveau fichier temporaire
	newExe := currentExe + ".new"
	out, err := os.Create(newExe)
	if err != nil {
		return fmt.Errorf("erreur lors de la création du nouveau fichier: %w", err)
	}
	defer out.Close()

	_, err = io.Copy(out, rc)
	if err != nil {
		return fmt.Errorf("erreur lors de la copie: %w", err)
	}

	// Fermer le fichier avant de tenter de le renommer
	out.Close()

	// Sauvegarder l'ancien exécutable
	oldExe := currentExe + ".old"
	if err := os.Rename(currentExe, oldExe); err != nil {
		return fmt.Errorf("erreur lors de la sauvegarde de l'ancien exécutable: %w", err)
	}

	// Remplacer par le nouveau
	if err := os.Rename(newExe, currentExe); err != nil {
		// Restaurer l'ancien en cas d'échec
		os.Rename(oldExe, currentExe)
		return fmt.Errorf("erreur lors du remplacement de l'exécutable: %w", err)
	}

	// Nettoyer
	os.Remove(oldExe)
	os.Remove(zipFile)

	return nil
}

// replaceExecutable remplace l'exécutable directement (Linux/macOS)
func (u *Updater) replaceExecutable(newExe, currentExe string) error {
	// Sauvegarder l'ancien exécutable
	oldExe := currentExe + ".old"
	if err := os.Rename(currentExe, oldExe); err != nil {
		return fmt.Errorf("erreur lors de la sauvegarde de l'ancien exécutable: %w", err)
	}

	// Copier le nouveau
	if err := copyFile(newExe, currentExe); err != nil {
		// Restaurer l'ancien en cas d'échec
		os.Rename(oldExe, currentExe)
		return fmt.Errorf("erreur lors de la copie du nouveau fichier: %w", err)
	}

	// Rendre exécutable
	if err := os.Chmod(currentExe, 0755); err != nil {
		return fmt.Errorf("erreur lors de la définition des permissions: %w", err)
	}

	// Nettoyer
	os.Remove(oldExe)
	os.Remove(newExe)

	return nil
}

// copyFile copie un fichier
func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}
