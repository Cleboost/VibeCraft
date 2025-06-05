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

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const AppVersion = "v1.1.8"

type App struct {
	ctx     context.Context
	updater *autoupdater.Updater
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

	fmt.Printf("[DEBUG] IsFirstTimeUser - versionPath: %s\n", versionPath)
	fmt.Printf("[DEBUG] IsFirstTimeUser - file exists error: %v\n", err)

	if os.IsNotExist(err) {
		fmt.Printf("[DEBUG] IsFirstTimeUser - File does not exist, returning true\n")
		return true
	}

	fmt.Printf("[DEBUG] IsFirstTimeUser - File exists, returning false\n")
	return false
}

func (a *App) ShouldShowChangelog() ChangelogResult {
	fmt.Printf("[DEBUG] ShouldShowChangelog - Starting\n")

	currentVersion := a.GetAppVersion()
	fmt.Printf("[DEBUG] ShouldShowChangelog - currentVersion: %s\n", currentVersion)

	isFirstTime := a.IsFirstTimeUser()
	fmt.Printf("[DEBUG] ShouldShowChangelog - isFirstTime: %t\n", isFirstTime)

	if isFirstTime {
		fmt.Printf("[DEBUG] ShouldShowChangelog - First time user, returning true\n")
		return ChangelogResult{ShouldShow: true, Version: currentVersion, Error: ""}
	}

	lastSeenVersion, err := a.GetLastSeenVersion()
	fmt.Printf("[DEBUG] ShouldShowChangelog - lastSeenVersion: %s, error: %v\n", lastSeenVersion, err)

	if err != nil {
		fmt.Printf("[DEBUG] ShouldShowChangelog - Error reading version, returning true\n")
		return ChangelogResult{ShouldShow: true, Version: currentVersion, Error: err.Error()}
	}

	if lastSeenVersion != currentVersion {
		fmt.Printf("[DEBUG] ShouldShowChangelog - Version mismatch, returning true\n")
		return ChangelogResult{ShouldShow: true, Version: currentVersion, Error: ""}
	}

	fmt.Printf("[DEBUG] ShouldShowChangelog - No changelog needed, returning false\n")
	return ChangelogResult{ShouldShow: false, Version: currentVersion, Error: ""}
}

func (a *App) MarkVersionAsSeen() error {
	return a.SetLastSeenVersion(a.GetAppVersion())
}

func (a *App) GetLatestReleaseInfo() (*autoupdater.UpdateInfo, error) {
	return a.updater.CheckForUpdates()
}

func (a *App) TestFunction() string {
	fmt.Printf("[DEBUG] TestFunction called\n")
	return "Test successful"
}

func (a *App) TestShouldShowChangelog() bool {
	fmt.Printf("[DEBUG] TestShouldShowChangelog called\n")
	homeDir, _ := os.UserHomeDir()
	versionPath := filepath.Join(homeDir, ".vibecraft", "last_seen_version.txt")
	_, err := os.Stat(versionPath)
	fmt.Printf("[DEBUG] TestShouldShowChangelog - path: %s, err: %v\n", versionPath, err)

	result := os.IsNotExist(err)
	fmt.Printf("[DEBUG] TestShouldShowChangelog - file does not exist: %t\n", result)
	return result
}

func (a *App) TestRestart() error {
	fmt.Printf("[DEBUG] TestRestart called\n")
	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("impossible d'obtenir le chemin de l'exécutable: %w", err)
	}

	fmt.Printf("[DEBUG] Current executable: %s\n", currentExe)
	a.testRestart(currentExe)
	return nil
}
