package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"VibeCraft/pkg/autoupdater"
)

// App struct
type App struct {
	ctx     context.Context
	updater *autoupdater.Updater
}

// GeneratorInfo représente les informations d'un générateur
type GeneratorInfo struct {
	Name     string `json:"name"`
	Filename string `json:"filename"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	// Version actuelle de l'application - à modifier lors des releases
	currentVersion := "v1.0.2"
	// Repository GitHub - à modifier avec votre repository
	githubRepo := "cleboost/VibeCraft"

	return &App{
		updater: autoupdater.NewUpdater(currentVersion, githubRepo),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Créer le dossier des générateurs s'il n'existe pas
	generatorsDir := a.getGeneratorsDir()
	os.MkdirAll(generatorsDir, 0755)
}

// getGeneratorsDir retourne le chemin vers le dossier des générateurs
func (a *App) getGeneratorsDir() string {
	homeDir, _ := os.UserHomeDir()
	return filepath.Join(homeDir, ".vibecraft", "generators")
}

// SaveGenerator sauvegarde un générateur dans le dossier local
func (a *App) SaveGenerator(filename string, content string) error {
	generatorsDir := a.getGeneratorsDir()
	filePath := filepath.Join(generatorsDir, filename)
	return os.WriteFile(filePath, []byte(content), 0644)
}

// LoadGenerator charge le contenu d'un générateur
func (a *App) LoadGenerator(filename string) (string, error) {
	generatorsDir := a.getGeneratorsDir()
	filePath := filepath.Join(generatorsDir, filename)
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// extractGeneratorName extrait le nom du générateur depuis le contenu du fichier
func (a *App) extractGeneratorName(content string) string {
	// Rechercher les patterns "class ClassName" pour extraire le nom
	classRegex := regexp.MustCompile(`class\s+(\w+)\s*extends\s+VideoGenerator`)
	if matches := classRegex.FindStringSubmatch(content); len(matches) > 1 {
		return matches[1]
	}

	// Fallback: rechercher n'importe quelle classe
	classRegex = regexp.MustCompile(`class\s+(\w+)`)
	if matches := classRegex.FindStringSubmatch(content); len(matches) > 1 {
		return matches[1]
	}

	return "Générateur inconnu"
}

// ListGenerators retourne la liste des générateurs disponibles
func (a *App) ListGenerators() ([]GeneratorInfo, error) {
	generatorsDir := a.getGeneratorsDir()
	var generators []GeneratorInfo

	// Lister les fichiers dans le dossier des générateurs
	files, err := os.ReadDir(generatorsDir)
	if err != nil {
		return generators, nil // Retourner une liste vide si le dossier n'existe pas
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".js" {
			// Lire le contenu pour extraire le nom du générateur
			content, err := a.LoadGenerator(file.Name())
			generatorName := file.Name()
			if err == nil {
				extractedName := a.extractGeneratorName(content)
				if extractedName != "Générateur inconnu" {
					generatorName = extractedName
				} else {
					// Utiliser le nom de fichier sans extension
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

// DeleteGenerator supprime un générateur
func (a *App) DeleteGenerator(filename string) error {
	generatorsDir := a.getGeneratorsDir()
	filePath := filepath.Join(generatorsDir, filename)
	return os.Remove(filePath)
}

// GetPlatformInfo retourne des informations sur la plateforme
func (a *App) GetPlatformInfo() map[string]string {
	return map[string]string{
		"os":   runtime.GOOS,
		"arch": runtime.GOARCH,
	}
}

// Sauvegarde la config d'un générateur dans ~/.vibecraft/generator-configs.json
func (a *App) SaveGeneratorConfig(packageId string, config string) error {
	homeDir, _ := os.UserHomeDir()
	configPath := filepath.Join(homeDir, ".vibecraft", "generator-configs.json")
	var allConfigs map[string]json.RawMessage

	// Lire l'existant
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

// Charge la config d'un générateur depuis ~/.vibecraft/generator-configs.json
func (a *App) LoadGeneratorConfig(packageId string) (string, error) {
	homeDir, _ := os.UserHomeDir()
	configPath := filepath.Join(homeDir, ".vibecraft", "generator-configs.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return "", nil // Pas d'erreur si le fichier n'existe pas
	}
	var allConfigs map[string]json.RawMessage
	json.Unmarshal(data, &allConfigs)
	if cfg, ok := allConfigs[packageId]; ok {
		return string(cfg), nil
	}
	return "", nil
}

// CheckForUpdates vérifie s'il y a des mises à jour disponibles
func (a *App) CheckForUpdates() (*autoupdater.UpdateInfo, error) {
	return a.updater.CheckForUpdates()
}

// DownloadUpdate télécharge une mise à jour
func (a *App) DownloadUpdate(downloadURL string) (string, error) {
	return a.updater.DownloadUpdate(downloadURL, func(progress autoupdater.UpdateProgress) {
		// Emettre l'événement de progrès vers le frontend
		if a.ctx != nil {
			// Utiliser les événements Wails pour notifier le frontend
			// runtime.EventsEmit(a.ctx, "download-progress", progress)
		}
	})
}

// InstallUpdate installe la mise à jour téléchargée
func (a *App) InstallUpdate(updateFile string) error {
	return a.updater.InstallUpdate(updateFile)
}

// GetAppVersion retourne la version actuelle de l'application
func (a *App) GetAppVersion() string {
	return "v1.0.2" // À synchroniser avec NewApp
}
