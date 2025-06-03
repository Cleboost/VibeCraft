# VibeCraft

**VibeCraft** est une application desktop multiplateforme qui permet de générer des vidéos satisfaisantes personnalisées. Développée avec Wails (Go pour le backend, React pour le frontend), elle offre un générateur par défaut et permet l'importation de générateurs personnalisés.

## 🚀 Fonctionnalités

- **Générateur par défaut** : Balle rebondissante dans un cercle avec paramètres configurables
- **Import de générateurs personnalisés** : Importez vos propres générateurs via des fichiers `.js`
- **Paramètres globaux configurables** : Durée (1-60s), framerate (30/60/120 FPS), format de sortie
- **Prévisualisation en temps réel** : Visualisez votre animation avant génération
- **Export vidéo** : Génération de vidéos WebM (MP4 à venir avec FFmpeg)
- **Stockage local** : Les générateurs importés sont sauvegardés pour réutilisation
- **Interface moderne** : UI responsive avec Tailwind CSS

## 📋 Prérequis

- Go 1.18+
- Node.js 16+
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

## 🛠️ Installation et exécution

1. **Cloner le projet** (si ce n'est pas déjà fait)
   ```bash
   git clone <repository-url>
   cd VibeCraft
   ```

2. **Installer les dépendances frontend**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Lancer en mode développement**
   ```bash
   wails dev
   ```

4. **Build pour production**
   ```bash
   wails build
   ```

## 🎨 Utilisation

### Interface principale

1. **Paramètres globaux** : Configurez la durée, le framerate et le format de sortie
2. **Gestion des générateurs** : Sélectionnez ou importez des générateurs
3. **Paramètres spécifiques** : Ajustez les paramètres du générateur sélectionné
4. **Prévisualisation** : Cliquez sur "Prévisualiser" pour voir l'animation
5. **Génération** : Cliquez sur "Générer la vidéo" pour exporter

### Générateur par défaut

Le générateur de balle rebondissante inclut les paramètres suivants :
- **Vitesse de la balle** (1-10)
- **Couleur de la balle** (sélecteur de couleur)
- **Couleur du cercle** (sélecteur de couleur)
- **Rayon de la balle** (5-50 pixels)
- **Balle pleine** (checkbox)
- **Texture** (image PNG/JPG, max 5Mo)

## 🧩 Développement de générateurs personnalisés

### API VideoGenerator

Tous les générateurs doivent hériter de la classe `VideoGenerator` :

```javascript
import { VideoGenerator } from '../utils/VideoGenerator.js';

export class MonGenerateur extends VideoGenerator {
  /**
   * Définit les paramètres configurables
   * @returns {Array} Configuration des paramètres
   */
  getConfig() {
    return [
      { 
        name: 'speed', 
        type: 'number', 
        default: 5, 
        min: 1, 
        max: 10, 
        label: 'Vitesse' 
      },
      { 
        name: 'color', 