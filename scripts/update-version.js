#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Lire la version depuis package.json ou les arguments
const version = process.argv[2] || getPackageVersion();

if (!version) {
  console.error('Erreur: Aucune version spécifiée');
  console.error('Usage: node update-version.js <version>');
  process.exit(1);
}

// Valider le format de version
if (!/^v?\d+\.\d+\.\d+(-.*)?$/.test(version)) {
  console.error('Erreur: Format de version invalide. Utilisez le format: 1.0.0 ou v1.0.0');
  process.exit(1);
}

// Normaliser la version (enlever le 'v' si présent)
const normalizedVersion = version.replace(/^v/, '');
const tagVersion = version.startsWith('v') ? version : `v${version}`;

console.log(`Mise à jour vers la version ${normalizedVersion}...`);

try {
  // Mettre à jour version.json
  updateVersionJson(normalizedVersion);
  
  // Mettre à jour app.go
  updateAppGo(tagVersion);
  
  // Mettre à jour package.json du frontend s'il existe
  updatePackageJson(normalizedVersion);
  
  // Mettre à jour wails.json
  updateWailsJson(normalizedVersion);
  
  console.log('✓ Tous les fichiers de version ont été mis à jour');
  console.log(`✓ Version: ${normalizedVersion}`);
  console.log(`✓ Tag Git suggéré: ${tagVersion}`);
  
} catch (error) {
  console.error('Erreur lors de la mise à jour:', error.message);
  process.exit(1);
}

function getPackageVersion() {
  try {
    const packagePath = path.join(process.cwd(), 'frontend', 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return pkg.version;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function updateVersionJson(version) {
  const versionPath = path.join(process.cwd(), 'version.json');
  const versionData = {
    version: version,
    buildDate: new Date().toISOString().split('T')[0],
    gitCommit: getGitCommit(),
    description: "VibeCraft - Générateur de vidéos satisfaisantes"
  };
  
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2) + '\n');
  console.log('✓ version.json mis à jour');
}

function updateAppGo(version) {
  const appGoPath = path.join(process.cwd(), 'app.go');
  
  if (!fs.existsSync(appGoPath)) {
    console.log('! app.go non trouvé, ignoré');
    return;
  }
  
  let content = fs.readFileSync(appGoPath, 'utf8');
  
  // Remplacer la version dans NewApp
  content = content.replace(
    /currentVersion := "v[\d\.]+"/, 
    `currentVersion := "${version}"`
  );
  
  // Remplacer la version dans GetAppVersion
  content = content.replace(
    /return "v[\d\.]+"/, 
    `return "${version}"`
  );
  
  fs.writeFileSync(appGoPath, content);
  console.log('✓ app.go mis à jour');
}

function updatePackageJson(version) {
  const packagePath = path.join(process.cwd(), 'frontend', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('! frontend/package.json non trouvé, ignoré');
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  pkg.version = version;
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('✓ frontend/package.json mis à jour');
}

function updateWailsJson(version) {
  const wailsPath = path.join(process.cwd(), 'wails.json');
  
  if (!fs.existsSync(wailsPath)) {
    console.log('! wails.json non trouvé, ignoré');
    return;
  }
  
  const wailsConfig = JSON.parse(fs.readFileSync(wailsPath, 'utf8'));
  wailsConfig.info = wailsConfig.info || {};
  wailsConfig.info.productVersion = version;
  
  fs.writeFileSync(wailsPath, JSON.stringify(wailsConfig, null, 2) + '\n');
  console.log('✓ wails.json mis à jour');
}

function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    return '';
  }
} 