# Script pour créer et pousser la branche tmp
Write-Host "🌿 Création de la branche tmp..." -ForegroundColor Cyan

# Vérifier si on est dans un dépôt git
if (-not (Test-Path .git)) {
    Write-Host "❌ Erreur: Ce n'est pas un dépôt git!" -ForegroundColor Red
    exit 1
}

# Afficher la branche actuelle
$currentBranch = git branch --show-current
Write-Host "📍 Branche actuelle: $currentBranch" -ForegroundColor Yellow

# Créer et basculer sur la branche tmp
Write-Host "`n🔄 Création de la branche tmp..." -ForegroundColor Cyan
git checkout -b tmp 2>&1 | Write-Host

# Vérifier si la branche a été créée
$currentBranch = git branch --show-current
if ($currentBranch -eq "tmp") {
    Write-Host "✅ Branche tmp créée et activée" -ForegroundColor Green
} else {
    Write-Host "⚠️  La branche tmp existe peut-être déjà, basculement..." -ForegroundColor Yellow
    git checkout tmp 2>&1 | Write-Host
}

# Ajouter tous les fichiers
Write-Host "`n📦 Ajout des fichiers..." -ForegroundColor Cyan
git add . 2>&1 | Write-Host

# Vérifier le statut
Write-Host "`n📊 Statut des fichiers:" -ForegroundColor Cyan
git status --short 2>&1 | Write-Host

# Commit
Write-Host "`n💾 Création du commit..." -ForegroundColor Cyan
$commitMessage = "feat: add seed script for projects with dummy documents and update AI service to use local AI service URL"
git commit -m $commitMessage 2>&1 | Write-Host

# Vérifier le remote
Write-Host "`n🔗 Vérification du remote..." -ForegroundColor Cyan
$remoteUrl = git remote get-url origin 2>&1
Write-Host "Remote origin: $remoteUrl" -ForegroundColor Yellow

# Pousser la branche
Write-Host "`n🚀 Push de la branche tmp vers origin..." -ForegroundColor Cyan
git push -u origin tmp 2>&1 | Write-Host

Write-Host "`n✅ Terminé!" -ForegroundColor Green
Write-Host "📍 Branche actuelle: $(git branch --show-current)" -ForegroundColor Yellow
