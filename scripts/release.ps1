# Script de release simplifié pour VibeCraft
param([string]$Version)

if (-not $Version) {
    Write-Host "Usage: .\release.ps1 <version>" -ForegroundColor Red
    exit 1
}

if (-not ($Version -match '^[0-9]+\.[0-9]+\.[0-9]+(-.*)?$')) {
    Write-Host "Erreur: Format de version invalide" -ForegroundColor Red
    exit 1
}

$TagVersion = "v$Version"

Write-Host "=== Release $Version ===" -ForegroundColor Green

# Étape 1: Mise à jour des versions
Write-Host "1. Mise à jour des versions..." -ForegroundColor Yellow
& node scripts\update-version.js $Version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec de la mise à jour des versions" -ForegroundColor Red
    exit 1
}

# Étape 2: Test de compilation
Write-Host "2. Test de compilation..." -ForegroundColor Yellow
& go build -o "$env:TEMP\test.exe" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: La compilation a échoué" -ForegroundColor Red
    exit 1
}
Remove-Item "$env:TEMP\test.exe" -ErrorAction SilentlyContinue

# Étape 3: Git add
Write-Host "3. Git add..." -ForegroundColor Yellow
& git add .

# Étape 4: Git commit
Write-Host "4. Git commit..." -ForegroundColor Yellow
& git commit -m "Bump version to $TagVersion"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec du commit" -ForegroundColor Red
    exit 1
}

# Étape 5: Git tag
Write-Host "5. Création du tag..." -ForegroundColor Yellow
& git tag -a $TagVersion -m "Release $TagVersion"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec de la création du tag" -ForegroundColor Red
    exit 1
}

# Étape 6: Git push
Write-Host "6. Push vers GitHub..." -ForegroundColor Yellow
$CurrentBranch = & git branch --show-current
& git push origin $CurrentBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec du push de la branche" -ForegroundColor Red
    exit 1
}

& git push origin $TagVersion
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec du push du tag" -ForegroundColor Red
    exit 1
}

Write-Host "Release $TagVersion creee avec succes !" -ForegroundColor Green
Write-Host "https://github.com/Cleboost/VibeCraft/actions" -ForegroundColor Blue 