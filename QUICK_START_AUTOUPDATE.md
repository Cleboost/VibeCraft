# Guide de démarrage rapide - Auto-Update VibeCraft

## 🎯 Votre système d'auto-update est maintenant installé !

### ✅ Ce qui a été implémenté

1. **Package Go complet** (`pkg/autoupdater/`) pour gérer les mises à jour
2. **Interface React moderne** (`frontend/src/components/UpdateDialog.*`) 
3. **Action GitHub automatisée** (`.github/workflows/build.yml`)
4. **Scripts de release** (`scripts/`)
5. **Intégration complète** dans votre app Wails

### 🔧 Configuration nécessaire

**IMPORTANT** : Modifiez `app.go` ligne ~27 :
```go
// Repository GitHub - à modifier avec votre repository
githubRepo := "votre-username/VibeCraft"
```
Remplacez par votre vrai repository GitHub !

### 🚀 Comment créer votre première release

#### Méthode 1 : Script automatique (recommandé)
```powershell
# Windows
.\scripts\release-fixed.ps1 1.0.0

# Linux/macOS
./scripts/release.sh 1.0.0
```

#### Méthode 2 : Manuel
```powershell
# 1. Mettre à jour les versions
node scripts\update-version.js 1.0.0

# 2. Commiter
git add .
git commit -m "Bump version to v1.0.0"

# 3. Créer le tag
git tag -a v1.0.0 -m "Release v1.0.0"

# 4. Pousser vers GitHub
git push origin master
git push origin v1.0.0
```

### 📦 Ce qui se passe automatiquement

1. **GitHub Action se déclenche** quand vous poussez un tag `v*`
2. **Build multi-plateforme** : Windows (.zip), Linux (.tar.gz), macOS (.tar.gz)
3. **Release automatique** créée avec les binaires attachés
4. **Vos utilisateurs** reçoivent la notification au démarrage de l'app

### 🎨 Interface utilisateur

- **Au démarrage** : Vérification automatique, dialogue si update disponible
- **Manuel** : Bouton "Vérifier les mises à jour" dans l'en-tête
- **Progression** : Barre de progression pour les téléchargements
- **Sécurité** : Rollback automatique en cas d'échec

### 🛠️ Test de votre implémentation

1. **Tester l'interface** :
   ```powershell
   wails dev
   ```
   Cliquez sur "Vérifier les mises à jour" dans l'en-tête

2. **Tester une vraie mise à jour** :
   - Créez une release v1.0.0
   - Attendez que le build se termine
   - Modifiez la version à v0.9.0 dans `app.go`
   - Relancez l'app → elle devrait proposer la mise à jour !

### 📁 Structure des fichiers assets attendus

Votre action GitHub créera automatiquement :
```
Release v1.0.0
├── VibeCraft-windows-amd64.zip
├── VibeCraft-linux-amd64.tar.gz
└── VibeCraft-darwin-amd64.tar.gz
```

### 🔍 Debugging

Si ça ne marche pas :

1. **Vérifiez les Actions GitHub** : Allez sur votre repo → Actions
2. **Vérifiez les assets** : La release doit avoir les bons noms de fichiers
3. **Vérifiez la version** : Le repository dans `app.go` doit être correct
4. **Logs de l'app** : Ouvrez les outils dev du navigateur dans Wails

### 🎊 Fonctionnalités avancées

- **Notes de version** : Affichées automatiquement depuis GitHub
- **Taille des fichiers** : Affichée avant téléchargement
- **Gestion d'erreurs** : Messages utilisateur-friendly
- **Multi-plateforme** : Détection automatique de l'OS

### 📚 Prochaines étapes

1. **Configurez votre repository** dans `app.go`
2. **Créez votre première release** avec les scripts
3. **Testez le système** en local avec `wails dev`
4. **Partagez votre app** - l'auto-update est prêt !

---

**🎉 Félicitations ! Votre app VibeCraft a maintenant un système d'auto-update professionnel !**

Pour toute question, consultez les fichiers de documentation dans le projet. 