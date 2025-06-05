# Script de release pour VibeCraft (PowerShell)
param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

# Fonction d'aide
function Show-Usage {
    Write-Host "Usage: .\release.ps1 <version>" -ForegroundColor Red
    Write-Host "Exemple: .\release.ps1 1.0.1" -ForegroundColor Yellow
    exit 1
}

# Validation du format de version
if (-not ($Version -match '^[0-9]+\.[0-9]+\.[0-9]+(-.*)?$')) {
    Write-Host "Erreur: Format de version invalide. Utilisez le format: 1.0.0" -ForegroundColor Red
    exit 1
}

$TagVersion = "v$Version"

Write-Host "🚀 Début du processus de release pour la version $Version" -ForegroundColor Yellow

# Vérifier que nous sommes sur la branche main
$CurrentBranch = git branch --show-current
if ($CurrentBranch -ne "main") {
    Write-Host "Erreur: Vous devez être sur la branche main" -ForegroundColor Red
    exit 1
}

# Vérifier qu'il n'y a pas de changements non commités
$GitStatus = git status --porcelain
if ($GitStatus) {
    Write-Host "Erreur: Il y a des changements non commités" -ForegroundColor Red
    git status --short
    exit 1
}

# Vérifier que le tag n'existe pas déjà
$ExistingTag = git tag --list | Where-Object { $_ -eq $TagVersion }
if ($ExistingTag) {
    Write-Host "Erreur: Le tag $TagVersion existe déjà" -ForegroundColor Red
    exit 1
}

# Mettre à jour les versions
Write-Host "📝 Mise à jour des fichiers de version..." -ForegroundColor Yellow
if (Test-Path "scripts\update-version.js") {
    node scripts\update-version.js $Version
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur: Échec de la mise à jour des versions" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Erreur: Le script update-version.js est introuvable" -ForegroundColor Red
    exit 1
}

# Tester que l'application compile
Write-Host "🔨 Test de compilation..." -ForegroundColor Yellow
go build -o "$env:TEMP\vibecraft-test.exe" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: La compilation a échoué" -ForegroundColor Red
    exit 1
}
Remove-Item "$env:TEMP\vibecraft-test.exe" -ErrorAction SilentlyContinue

# Commit des changements
Write-Host "📤 Commit des changements..." -ForegroundColor Yellow
git add .
git commit -m "Bump version to $TagVersion"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec du commit" -ForegroundColor Red
    exit 1
}

# Créer le tag
Write-Host "🏷️ Création du tag $TagVersion..." -ForegroundColor Yellow
git tag -a $TagVersion -m "Release $TagVersion"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec de la création du tag" -ForegroundColor Red
    exit 1
}

# Push vers GitHub
Write-Host "⬆️ Push vers GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec du push de la branche main" -ForegroundColor Red
    exit 1
}

git push origin $TagVersion
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec du push du tag" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Release $TagVersion créée avec succès !" -ForegroundColor Green
Write-Host "📦 L'action GitHub va maintenant builder et publier la release automatiquement" -ForegroundColor Green

# Essayer d'obtenir l'URL du repository
try {
    $RemoteUrl = git remote get-url origin
    $RepoPath = $RemoteUrl -replace '.*github\.com[:/]([^.]*)(\.git)?.*', '$1'
    Write-Host "🔗 Surveillez: https://github.com/$RepoPath/actions" -ForegroundColor Green
}
catch {
    Write-Host "🔗 Surveillez vos actions GitHub pour le progress du build" -ForegroundColor Green
}