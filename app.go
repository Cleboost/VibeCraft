package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"VibeCraft/pkg/autoupdater"
	"VibeCraft/pkg/ffmpeg"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const AppVersion = "v1.2.8"

type App struct {
	ctx     context.Context
	updater *autoupdater.Updater
	ffmpeg  *ffmpeg.FFmpeg
}

type GeneratorInfo struct {
	Name     string `json:"name"`
	Filename string `json:"filename"`
}

type ChangelogResult struct {
	ShouldShow bool   `json:"shouldShow"`
	Version    string `json:"version"`
	Error      string `json:"error"`
}

func NewApp() *App {
	githubRepo := "cleboost/VibeCraft"

	return &App{
		updater: autoupdater.NewUpdater(AppVersion, githubRepo),
		ffmpeg:  ffmpeg.NewFFmpeg(),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	generatorsDir := a.getGeneratorsDir()
	os.MkdirAll(generatorsDir, 0755)
}

func (a *App) getGeneratorsDir() string {
	homeDir, _ := os.UserHomeDir()
	return filepath.Join(homeDir, ".vibecraft", "generators")
}

func (a *App) SaveGenerator(filename string, content string) error {
	generatorsDir := a.getGeneratorsDir()
	filePath := filepath.Join(generatorsDir, filename)
	return os.WriteFile(filePath, []byte(content), 0644)
}

func (a *App) LoadGenerator(filename string) (string, error) {
	generatorsDir := a.getGeneratorsDir()
	filePath := filepath.Join(generatorsDir, filename)
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

func (a *App) extractGeneratorName(content string) string {
	classRegex := regexp.MustCompile(`class\s+(\w+)\s*extends\s+VideoGenerator`)
	if matches := classRegex.FindStringSubmatch(content); len(matches) > 1 {
		return matches[1]
	}

	classRegex = regexp.MustCompile(`class\s+(\w+)`)
	if matches := classRegex.FindStringSubmatch(content); len(matches) > 1 {
		return matches[1]
	}

	return "Générateur inconnu"
}

func (a *App) ListGenerators() ([]GeneratorInfo, error) {
	generatorsDir := a.getGeneratorsDir()
	var generators []GeneratorInfo

	files, err := os.ReadDir(generatorsDir)
	if err != nil {
		return generators, nil
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".js" {
			content, err := a.LoadGenerator(file.Name())
			generatorName := file.Name()
			if err == nil {
				extractedName := a.extractGeneratorName(content)
				if extractedName != "Générateur inconnu" {
					generatorName = extractedName
				} else {
					generatorName = strings.TrimSuffix(file.Name(), ".js")
				}
			}

			generators = append(generators, GeneratorInfo{
				Name:     generatorName,
				Filename: file.Name(),
			})
		}
	}

	return generators, nil
}

func (a *App) DeleteGenerator(filename string) error {
	generatorsDir := a.getGeneratorsDir()
	filePath := filepath.Join(generatorsDir, filename)
	return os.Remove(filePath)
}

func (a *App) GetPlatformInfo() map[string]string {
	return map[string]string{
		"os":   runtime.GOOS,
		"arch": runtime.GOARCH,
	}
}

func (a *App) SaveGeneratorConfig(packageId string, config string) error {
	homeDir, _ := os.UserHomeDir()
	configPath := filepath.Join(homeDir, ".vibecraft", "generator-configs.json")
	var allConfigs map[string]json.RawMessage

	data, _ := os.ReadFile(configPath)
	if len(data) > 0 {
		json.Unmarshal(data, &allConfigs)
	} else {
		allConfigs = make(map[string]json.RawMessage)
	}

	allConfigs[packageId] = json.RawMessage(config)
	out, _ := json.MarshalIndent(allConfigs, "", "  ")
	return os.WriteFile(configPath, out, 0644)
}

func (a *App) LoadGeneratorConfig(packageId string) (string, error) {
	homeDir, _ := os.UserHomeDir()
	configPath := filepath.Join(homeDir, ".vibecraft", "generator-configs.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return "", nil
	}
	var allConfigs map[string]json.RawMessage
	json.Unmarshal(data, &allConfigs)
	if cfg, ok := allConfigs[packageId]; ok {
		return string(cfg), nil
	}
	return "", nil
}

func (a *App) CheckForUpdates() (*autoupdater.UpdateInfo, error) {
	if a.IsDevMode() {

	}
	if a.IsDevMode() {
		return &autoupdater.UpdateInfo{
			Available:      false,
			CurrentVersion: AppVersion,
			LatestVersion:  AppVersion,
		}, nil
	}
	return a.updater.CheckForUpdates()
}

func (a *App) DownloadUpdate(downloadURL string) (string, error) {
	return a.updater.DownloadUpdate(downloadURL, func(progress autoupdater.UpdateProgress) {
		if a.ctx != nil {
			wailsruntime.EventsEmit(a.ctx, "download-progress", progress)
		}
	})
}

func (a *App) InstallUpdate(updateFile string) error {
	return a.updater.InstallUpdate(updateFile)
}

func (a *App) InstallUpdateWithRestart(updateFile string) error {
	err := a.updater.InstallUpdate(updateFile)
	if err != nil {
		return err
	}

	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("impossible d'obtenir le chemin de l'exécutable pour le redémarrage: %w", err)
	}

	a.restartApplication(currentExe)
	return nil
}

func (a *App) GetAppVersion() string {
	return AppVersion
}

func (a *App) GetLastSeenVersion() (string, error) {
	homeDir, _ := os.UserHomeDir()
	versionPath := filepath.Join(homeDir, ".vibecraft", "last_seen_version.txt")
	data, err := os.ReadFile(versionPath)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(data)), nil
}

func (a *App) SetLastSeenVersion(version string) error {
	homeDir, _ := os.UserHomeDir()
	vibecraftDir := filepath.Join(homeDir, ".vibecraft")
	os.MkdirAll(vibecraftDir, 0755)

	versionPath := filepath.Join(vibecraftDir, "last_seen_version.txt")
	return os.WriteFile(versionPath, []byte(version), 0644)
}

func (a *App) IsFirstRunAfterUpdate() (bool, string, error) {
	currentVersion := a.GetAppVersion()
	lastSeenVersion, err := a.GetLastSeenVersion()

	if err != nil {
		a.SetLastSeenVersion(currentVersion)
		return false, "", nil
	}

	if lastSeenVersion != currentVersion {
		return true, lastSeenVersion, nil
	}

	return false, "", nil
}

func (a *App) IsFirstTimeUser() bool {
	homeDir, _ := os.UserHomeDir()

	versionPath := filepath.Join(homeDir, ".vibecraft", "last_seen_version.txt")
	_, err := os.Stat(versionPath)

	if os.IsNotExist(err) {
		return true
	}

	return false
}

func (a *App) ShouldShowChangelog() ChangelogResult {
	if a.IsDevMode() {
		return ChangelogResult{ShouldShow: false, Version: a.GetAppVersion(), Error: ""}
	}

	currentVersion := a.GetAppVersion()
	isFirstTime := a.IsFirstTimeUser()

	if isFirstTime {
		return ChangelogResult{ShouldShow: true, Version: currentVersion, Error: ""}
	}

	lastSeenVersion, err := a.GetLastSeenVersion()

	if err != nil {
		return ChangelogResult{ShouldShow: true, Version: currentVersion, Error: err.Error()}
	}

	if lastSeenVersion != currentVersion {
		return ChangelogResult{ShouldShow: true, Version: currentVersion, Error: ""}
	}

	return ChangelogResult{ShouldShow: false, Version: currentVersion, Error: ""}
}

func (a *App) MarkVersionAsSeen() error {
	return a.SetLastSeenVersion(a.GetAppVersion())
}

func (a *App) GetLatestReleaseInfo() (*autoupdater.UpdateInfo, error) {
	if a.IsDevMode() {
		return &autoupdater.UpdateInfo{
			Available:      false,
			CurrentVersion: AppVersion,
			LatestVersion:  AppVersion,
			ReleaseNotes:   "Mode développement - Pas de vérification de mise à jour",
		}, nil
	}
	return a.updater.CheckForUpdates()
}

func (a *App) IsFFmpegInstalled() bool {
	return a.ffmpeg.IsInstalled()
}

func (a *App) DownloadFFmpeg() error {
	return a.ffmpeg.Download(func(progress float64) {
		if a.ctx != nil {
			wailsruntime.EventsEmit(a.ctx, "ffmpeg-download-progress", map[string]interface{}{
				"progress": progress,
			})
		}
	})
}

func (a *App) ConvertVideoToMP4(webmPath, mp4Path string) error {
	homeDir, _ := os.UserHomeDir()
	tempDir := filepath.Join(homeDir, ".vibecraft", "temp")

	webmFullPath := filepath.Join(tempDir, webmPath)
	mp4FullPath := filepath.Join(tempDir, mp4Path)

	// Vérifier que le fichier WebM existe
	if _, err := os.Stat(webmFullPath); os.IsNotExist(err) {
		return fmt.Errorf("fichier WebM introuvable: %s", webmFullPath)
	}

	err := a.ffmpeg.ConvertWebMToMP4(webmFullPath, mp4FullPath)
	if err != nil {
		return fmt.Errorf("erreur conversion ffmpeg: %w", err)
	}

	// Vérifier que le fichier MP4 a été créé
	if _, err := os.Stat(mp4FullPath); os.IsNotExist(err) {
		return fmt.Errorf("fichier MP4 non créé: %s", mp4FullPath)
	}

	return nil
}

func (a *App) SaveTempFile(filename string, data []int) error {
	homeDir, _ := os.UserHomeDir()
	tempDir := filepath.Join(homeDir, ".vibecraft", "temp")
	os.MkdirAll(tempDir, 0755)

	byteData := make([]byte, len(data))
	for i, v := range data {
		byteData[i] = byte(v)
	}

	filePath := filepath.Join(tempDir, filename)
	return os.WriteFile(filePath, byteData, 0644)
}

func (a *App) ReadTempFile(filename string) ([]int, error) {
	homeDir, _ := os.UserHomeDir()
	tempDir := filepath.Join(homeDir, ".vibecraft", "temp")
	filePath := filepath.Join(tempDir, filename)

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("erreur lecture %s: %w", filePath, err)
	}

	if len(data) == 0 {
		return nil, fmt.Errorf("fichier vide: %s", filePath)
	}

	// Convertir []byte en []int pour une meilleure compatibilité avec JavaScript
	intData := make([]int, len(data))
	for i, b := range data {
		intData[i] = int(b)
	}

	return intData, nil
}

func (a *App) DeleteTempFile(filename string) error {
	homeDir, _ := os.UserHomeDir()
	tempDir := filepath.Join(homeDir, ".vibecraft", "temp")
	filePath := filepath.Join(tempDir, filename)
	return os.Remove(filePath)
}
