# Exemples de Générateurs VibeCraft

Ce dossier contient des exemples de générateurs personnalisés que vous pouvez importer dans VibeCraft.

## 📁 Fichiers disponibles

### 🌀 spiral.js - Spirale Colorée
Un générateur qui crée une spirale colorée avec effet de traînée optionnel.

**Paramètres :**
- Vitesse de rotation (0.5 - 10)
- Croissance du rayon (10 - 200)
- Vitesse de changement de couleur (0.01 - 1)
- Épaisseur de la ligne (1 - 10)
- Couleur de fond (sélecteur)
- Activer la traînée (checkbox)

### 🌈 rainbow-particles.js - Particules Arc-en-ciel
Un système de particules colorées qui tombent avec des couleurs arc-en-ciel.

**Paramètres :**
- Nombre de particules (10 - 200)
- Taille des particules (2 - 20)
- Vitesse de chute (1 - 10)
- Vitesse changement couleur (0.5 - 5)
- Gravité (0 - 1)
- Couleur de fond (sélecteur)
- Effet de lueur (checkbox)

## 🚀 Comment utiliser

1. **Télécharger un fichier** : Sauvegardez l'un des fichiers `.js` sur votre ordinateur
2. **Ouvrir VibeCraft** : Lancez l'application VibeCraft
3. **Importer** : Dans la section "Gestion des générateurs", cliquez sur "Importer un générateur personnalisé"
4. **Sélectionner** : Choisissez le fichier `.js` que vous avez téléchargé
5. **Utiliser** : Le générateur apparaîtra dans la liste déroulante et sera prêt à utiliser !

## 🛠️ Créer vos propres générateurs

Utilisez ces exemples comme base pour créer vos propres générateurs. Chaque générateur doit :

1. **Hériter de VideoGenerator** (ou inclure la classe de base)
2. **Implémenter getConfig()** : Définir les paramètres configurables
3. **Implémenter setup()** : Initialiser l'état du générateur
4. **Implémenter draw()** : Dessiner une frame de l'animation
5. **Optionnel cleanup()** : Nettoyer les ressources

### Types de paramètres supportés :
- `number` : Champ numérique avec min/max
- `color` : Sélecteur de couleur
- `boolean` : Checkbox
- `file` : Sélecteur de fichier (images)

## 📖 Documentation complète

Consultez le README principal du projet pour une documentation complète sur le développement de générateurs personnalisés.

---

**Amusez-vous bien avec VibeCraft ! 🎬✨** 