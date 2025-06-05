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

type Release struct {
	TagName string  `json:"tag_name"`
	Name    string  `json:"name"`
	Body    string  `json:"body"`
	Assets  []Asset `json:"assets"`
	URL     string  `json:"html_url"`
}

type Asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
}

type UpdateInfo struct {
	Available      bool   `json:"available"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	ReleaseNotes   string `json:"releaseNotes"`
	DownloadURL    string `json:"downloadUrl"`
	ReleaseURL     string `json:"releaseUrl"`
	Size           int64  `json:"size"`
}

type UpdateProgress struct {
	Downloaded int64 `json:"downloaded"`
	Total      int64 `json:"total"`
	Percent    int   `json:"percent"`
}

type Updater struct {
	currentVersion string
	githubRepo     string
	httpClient     *http.Client
}

func NewUpdater(currentVersion, githubRepo string) *Updater {
	return &Updater{
		currentVersion: currentVersion,
		githubRepo:     githubRepo,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

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

	currentVer := u.normalizeVersion(u.currentVersion)
	latestVer := u.normalizeVersion(release.TagName)

	updateInfo := &UpdateInfo{
		CurrentVersion: u.currentVersion,
		LatestVersion:  release.TagName,
		ReleaseNotes:   release.Body,
		ReleaseURL:     release.URL,
	}

	if semver.Compare(currentVer, latestVer) < 0 {
		updateInfo.Available = true

		asset, err := u.findAssetForPlatform(release.Assets)
		if err != nil {
			return updateInfo, err
		}

		updateInfo.DownloadURL = asset.BrowserDownloadURL
		updateInfo.Size = asset.Size
	}

	return updateInfo, nil
}

func (u *Updater) normalizeVersion(version string) string {
	if !strings.HasPrefix(version, "v") {
		return "v" + version
	}
	return version
}

func (u *Updater) findAssetForPlatform(assets []Asset) (*Asset, error) {
	platformSuffix := u.getPlatformSuffix()

	for _, asset := range assets {
		if strings.Contains(strings.ToLower(asset.Name), platformSuffix) {
			return &asset, nil
		}
	}

	return nil, fmt.Errorf("aucun asset trouvé pour la plateforme %s", platformSuffix)
}

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

func (u *Updater) DownloadUpdate(downloadURL string, progressCallback func(UpdateProgress)) (string, error) {
	resp, err := u.httpClient.Get(downloadURL)
	if err != nil {
		return "", fmt.Errorf("erreur lors du téléchargement: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("erreur HTTP lors du téléchargement: %d", resp.StatusCode)
	}

	tmpDir := os.TempDir()
	filename := filepath.Base(downloadURL)
	tmpFile := filepath.Join(tmpDir, filename)

	out, err := os.Create(tmpFile)
	if err != nil {
		return "", fmt.Errorf("erreur lors de la création du fichier temporaire: %w", err)
	}
	defer out.Close()

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

func (u *Updater) InstallUpdate(updateFile string) error {
	return u.InstallUpdateWithProgress(updateFile, nil)
}

func (u *Updater) InstallUpdateWithProgress(updateFile string, progressCallback func(string)) error {
	if progressCallback != nil {
		progressCallback("Démarrage de l'installation...")
	}

	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("impossible d'obtenir le chemin de l'exécutable: %w", err)
	}

	if progressCallback != nil {
		progressCallback("Préparation de l'installation...")
	}

	if runtime.GOOS == "windows" {
		return u.installWindowsUpdateWithProgress(updateFile, currentExe, progressCallback)
	}

	return u.replaceExecutableWithProgress(updateFile, currentExe, progressCallback)
}

func (u *Updater) installWindowsUpdateWithProgress(zipFile, currentExe string, progressCallback func(string)) error {
	if progressCallback != nil {
		progressCallback("Ouverture du fichier de mise à jour...")
	}

	r, err := zip.OpenReader(zipFile)
	if err != nil {
		return fmt.Errorf("erreur lors de l'ouverture du ZIP: %w", err)
	}
	defer r.Close()

	if progressCallback != nil {
		progressCallback("Recherche de l'exécutable...")
	}

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

	if progressCallback != nil {
		progressCallback("Extraction de l'exécutable...")
	}

	rc, err := exeFile.Open()
	if err != nil {
		return fmt.Errorf("erreur lors de l'ouverture de l'exécutable: %w", err)
	}
	defer rc.Close()

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

	out.Close()

	if progressCallback != nil {
		progressCallback("Sauvegarde de l'ancienne version...")
	}

	oldExe := currentExe + ".old"
	if err := os.Rename(currentExe, oldExe); err != nil {
		return fmt.Errorf("erreur lors de la sauvegarde de l'ancien exécutable: %w", err)
	}

	if progressCallback != nil {
		progressCallback("Installation de la nouvelle version...")
	}

	if err := os.Rename(newExe, currentExe); err != nil {
		os.Rename(oldExe, currentExe)
		return fmt.Errorf("erreur lors du remplacement de l'exécutable: %w", err)
	}

	if progressCallback != nil {
		progressCallback("Nettoyage...")
	}

	os.Remove(oldExe)
	os.Remove(zipFile)

	if progressCallback != nil {
		progressCallback("Installation terminée avec succès !")
	}

	return nil
}

func (u *Updater) replaceExecutableWithProgress(newExe, currentExe string, progressCallback func(string)) error {
	if progressCallback != nil {
		progressCallback("Sauvegarde de l'ancienne version...")
	}

	oldExe := currentExe + ".old"
	if err := os.Rename(currentExe, oldExe); err != nil {
		return fmt.Errorf("erreur lors de la sauvegarde de l'ancien exécutable: %w", err)
	}

	if progressCallback != nil {
		progressCallback("Installation de la nouvelle version...")
	}

	if err := copyFile(newExe, currentExe); err != nil {
		os.Rename(oldExe, currentExe)
		return fmt.Errorf("erreur lors de la copie du nouveau fichier: %w", err)
	}

	if progressCallback != nil {
		progressCallback("Configuration des permissions...")
	}

	if err := os.Chmod(currentExe, 0755); err != nil {
		return fmt.Errorf("erreur lors de la définition des permissions: %w", err)
	}

	if progressCallback != nil {
		progressCallback("Nettoyage...")
	}

	os.Remove(oldExe)
	os.Remove(newExe)

	if progressCallback != nil {
		progressCallback("Installation terminée avec succès !")
	}

	return nil
}

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
