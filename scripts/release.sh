#!/bin/bash

# Script de release pour VibeCraft
set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'aide
usage() {
    echo "Usage: $0 <version>"
    echo "Exemple: $0 1.0.1"
    exit 1
}

# Vérifier les arguments
if [ $# -eq 0 ]; then
    usage
fi

VERSION=$1
TAG_VERSION="v$VERSION"

# Validation du format de version
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-.*)?$ ]]; then
    echo -e "${RED}Erreur: Format de version invalide. Utilisez le format: 1.0.0${NC}"
    exit 1
fi

echo -e "${YELLOW}🚀 Début du processus de release pour la version $VERSION${NC}"

# Vérifier que nous sommes sur la branche main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Erreur: Vous devez être sur la branche main${NC}"
    exit 1
fi

# Vérifier qu'il n'y a pas de changements non committé
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Erreur: Il y a des changements non commités${NC}"
    git status --short
    exit 1
fi

# Vérifier que le tag n'existe pas déjà
if git tag --list | grep -q "^$TAG_VERSION$"; then
    echo -e "${RED}Erreur: Le tag $TAG_VERSION existe déjà${NC}"
    exit 1
fi

# Mettre à jour les versions
echo -e "${YELLOW}📝 Mise à jour des fichiers de version...${NC}"
if [ -f "scripts/update-version.js" ]; then
    node scripts/update-version.js "$VERSION"
else
    echo -e "${RED}Erreur: Le script update-version.js est introuvable${NC}"
    exit 1
fi

# Tester que l'application compile
echo -e "${YELLOW}🔨 Test de compilation...${NC}"
if ! go build -o /tmp/vibecraft-test .; then
    echo -e "${RED}Erreur: La compilation a échoué${NC}"
    exit 1
fi
rm -f /tmp/vibecraft-test

# Commit des changements
echo -e "${YELLOW}📤 Commit des changements...${NC}"
git add .
git commit -m "Bump version to $TAG_VERSION"

# Créer le tag
echo -e "${YELLOW}🏷️ Création du tag $TAG_VERSION...${NC}"
git tag -a "$TAG_VERSION" -m "Release $TAG_VERSION"

# Push vers GitHub
echo -e "${YELLOW}⬆️ Push vers GitHub...${NC}"
git push origin main
git push origin "$TAG_VERSION"

echo -e "${GREEN}✅ Release $TAG_VERSION créée avec succès !${NC}"
echo -e "${GREEN}📦 L'action GitHub va maintenant builder et publier la release automatiquement${NC}"
echo -e "${GREEN}🔗 Surveillez: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions${NC}" 