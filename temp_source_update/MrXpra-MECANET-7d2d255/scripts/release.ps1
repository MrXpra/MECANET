# Script de publicación de versiones - MECANET
# Uso: .\scripts\release.ps1 -Type [patch|minor|major]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('patch', 'minor', 'major')]
    [string]$Type
)

# Colores para output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }

Write-Info "=== Sistema de Versionado Automático ==="
Write-Info "Tipo de versión: $Type"
Write-Host ""

# Verificar que estamos en la rama develop
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "develop") {
    Write-Error "Debes estar en la rama 'develop' para ejecutar este script"
    Write-Info "Rama actual: $currentBranch"
    exit 1
}

# Verificar que no hay cambios sin commitear
$status = git status --porcelain
if ($status) {
    Write-Error "Hay cambios sin commitear. Por favor, commitea o descarta los cambios antes de continuar."
    git status --short
    exit 1
}

# Leer la versión actual
if (Test-Path ".\version.json") {
    $versionData = Get-Content ".\version.json" | ConvertFrom-Json
    $currentVersion = $versionData.version
} else {
    Write-Warning "No se encontró version.json, iniciando desde v0.0.0"
    $currentVersion = "0.0.0"
}

Write-Info "Versión actual: v$currentVersion"

# Calcular la nueva versión
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

switch ($Type) {
    'major' { 
        $major++
        $minor = 0
        $patch = 0
    }
    'minor' { 
        $minor++
        $patch = 0
    }
    'patch' { 
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
$newTag = "v$newVersion"

Write-Success "Nueva versión calculada: $newTag"
Write-Host ""

# Confirmación del usuario
Write-Warning "Estás a punto de:"
Write-Host "  1️⃣  Fusionar develop → main"
Write-Host "  2️⃣  Crear tag $newTag"
Write-Host "  3️⃣  Subir cambios al repositorio remoto"
Write-Host ""
$confirm = Read-Host "¿Continuar? (s/n)"

if ($confirm -ne 's' -and $confirm -ne 'S') {
    Write-Info "Operación cancelada por el usuario"
    exit 0
}

Write-Host ""
Write-Info "=== Iniciando proceso de release ==="
Write-Host ""

# Paso 1: Actualizar version.json
Write-Info "[1/7] Actualizando version.json..."
$versionData = @{
    version = $newVersion
    lastUpdated = (Get-Date -Format "yyyy-MM-dd")
    releaseNotes = "Versión $newVersion del sistema MECANET"
}
$versionData | ConvertTo-Json | Set-Content ".\version.json"

# Actualizar package.json (Backend)
Write-Info "[1.1/7] Actualizando package.json (Backend)..."
$pkgBackend = Get-Content ".\package.json" | ConvertFrom-Json
$pkgBackend.version = $newVersion
$pkgBackend | ConvertTo-Json -Depth 10 | Set-Content ".\package.json"

# Actualizar client/package.json (Frontend)
Write-Info "[1.2/7] Actualizando client/package.json (Frontend)..."
$pkgClient = Get-Content ".\client\package.json" | ConvertFrom-Json
$pkgClient.version = $newVersion
$pkgClient | ConvertTo-Json -Depth 10 | Set-Content ".\client\package.json"

# Commitear el cambio de versión
git add version.json package.json client/package.json
git commit -m "chore: bump version to $newVersion"
Write-Success "version.json actualizado"

# Paso 2: Cambiar a main
Write-Info "[2/7] Cambiando a rama main..."
git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al cambiar a la rama main"
    git checkout develop
    exit 1
}
Write-Success "Cambiado a rama main"

# Paso 3: Fusionar develop en main
Write-Info "[3/7] Fusionando develop → main..."
git merge develop --no-ff -m "chore: release version $newVersion"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al fusionar develop en main"
    git merge --abort
    git checkout develop
    exit 1
}
Write-Success "Fusión completada"

# Paso 4: Crear etiqueta
Write-Info "[4/7] Creando etiqueta $newTag..."
git tag -a $newTag -m "Release version $newVersion"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al crear la etiqueta"
    git checkout develop
    exit 1
}
Write-Success "Etiqueta $newTag creada"

# Paso 5: Subir cambios a main
Write-Info "[5/7] Subiendo rama main al repositorio remoto..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al subir la rama main"
    git checkout develop
    exit 1
}
Write-Success "Rama main subida"

# Paso 6: Subir etiquetas
Write-Info "[6/7] Subiendo etiquetas al repositorio remoto..."
git push origin --tags
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al subir las etiquetas"
    git checkout develop
    exit 1
}
Write-Success "Etiquetas subidas"

# Paso 7: Volver a develop
Write-Info "[7/7] Volviendo a la rama develop..."
git checkout develop
Write-Success "De vuelta en rama develop"

# Resumen final
Write-Host ""
Write-Success "=== 🎉 Release completado exitosamente ==="
Write-Host ""
Write-Host "📦 Nueva versión: " -NoNewline
Write-Host "$newTag" -ForegroundColor Yellow
Write-Host "🌿 Rama main actualizada y etiquetada"
Write-Host "☁️  Cambios subidos al repositorio remoto"
Write-Host "🔄 De vuelta en rama develop para continuar desarrollo"
Write-Host ""
Write-Info "Comandos útiles:"
Write-Host "  • Ver todas las versiones: git tag -l"
Write-Host "  • Ver cambios de una versión: git show $newTag"
Write-Host "  • Ver historial: git log --oneline --graph --all"
Write-Host ""
