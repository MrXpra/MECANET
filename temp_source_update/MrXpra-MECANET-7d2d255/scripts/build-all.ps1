# ============================================
# MECANET - BUILD COMPLETO PARA DISTRIBUCION
# ============================================
# Este script ejecuta todo el proceso de forma automatica

param(
    [switch]$SkipNodeJS,
    [switch]$Clean
)

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   MECANET - BUILD COMPLETO" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Leer version del proyecto
$versionJson = Get-Content "version.json" | ConvertFrom-Json
$version = $versionJson.version

Write-Host "Version: $version" -ForegroundColor Yellow
Write-Host "Fecha: $(Get-Date -Format 'dd/MM/yyyy HH:mm')`n" -ForegroundColor Gray

# ============================================
# PASO 1: LIMPIAR (OPCIONAL)
# ============================================
if ($Clean) {
    Write-Host "PASO 1: Limpiando carpeta de distribucion..." -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File .\scripts\clean-dist.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nError en la limpieza" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "PASO 1: Saltando limpieza (usa -Clean para limpiar)" -ForegroundColor Gray
}

# ============================================
# PASO 2: COMPILAR FRONTEND
# ============================================
Write-Host "`nPASO 2: Compilando frontend..." -ForegroundColor Cyan
Set-Location client
npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError instalando dependencias del frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError compilando frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "OK - Frontend compilado" -ForegroundColor Green

# ============================================
# PASO 3: CREAR PAQUETE PORTABLE
# ============================================
Write-Host "`nPASO 3: Creando paquete portable..." -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File .\scripts\create-portable.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError creando paquete portable" -ForegroundColor Red
    exit 1
}
Write-Host "OK - Paquete portable creado" -ForegroundColor Green

# ============================================
# PASO 4: DESCARGAR NODE.JS (OPCIONAL)
# ============================================
if (-not $SkipNodeJS) {
    if (-not (Test-Path "distribucion\MECANET-Portable\node\node.exe")) {
        Write-Host "`nPASO 4: Descargando Node.js portable..." -ForegroundColor Cyan
        & powershell -ExecutionPolicy Bypass -File .\scripts\download-nodejs.ps1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`nADVERTENCIA: Error descargando Node.js (continuando sin el)" -ForegroundColor Yellow
        } else {
            Write-Host "OK - Node.js descargado" -ForegroundColor Green
        }
    } else {
        Write-Host "`nPASO 4: Node.js ya esta incluido" -ForegroundColor Gray
    }
} else {
    Write-Host "`nPASO 4: Saltando descarga de Node.js (-SkipNodeJS)" -ForegroundColor Gray
}

# ============================================
# PASO 5: RENOMBRAR CARPETA FINAL
# ============================================
Write-Host "`nPASO 5: Preparando carpeta final..." -ForegroundColor Cyan

$finalFolder = "distribucion\MECANET-v$version"

# Eliminar carpeta final anterior si existe
if (Test-Path $finalFolder) {
    Write-Host "Eliminando version anterior..." -ForegroundColor Yellow
    Remove-Item $finalFolder -Recurse -Force
}

# Renombrar carpeta
try {
    Move-Item -Path "distribucion\MECANET-Portable" -Destination $finalFolder -Force
    Write-Host "OK - Carpeta final creada" -ForegroundColor Green
} catch {
    Write-Host "`nError preparando carpeta final: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "   BUILD COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

$folderSize = (Get-ChildItem $finalFolder -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$sizeMB = [math]::Round($folderSize, 2)

Write-Host "Carpeta generada:" -ForegroundColor Cyan
Write-Host "  Nombre: MECANET-v$version" -ForegroundColor White
Write-Host "  Ubicacion: distribucion\" -ForegroundColor White
Write-Host "  Tamano: $sizeMB MB" -ForegroundColor White
Write-Host "  Fecha: $(Get-Date -Format 'dd/MM/yyyy HH:mm')" -ForegroundColor White

Write-Host "`nContenido:" -ForegroundColor Cyan
if (Test-Path "$finalFolder\node\node.exe") {
    Write-Host "  [OK] Node.js v18.17.0 incluido" -ForegroundColor Green
} else {
    Write-Host "  [!] Node.js NO incluido" -ForegroundColor Yellow
    Write-Host "      Cliente debera tenerlo instalado" -ForegroundColor Gray
}
Write-Host "  [OK] Backend + Frontend compilado" -ForegroundColor Green
Write-Host "  [OK] Scripts de configuracion e inicio" -ForegroundColor Green
Write-Host "  [OK] Instrucciones completas (LEEME-PRIMERO.txt)" -ForegroundColor Green

Write-Host "`nProximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Copia la carpeta MECANET-v$version al cliente" -ForegroundColor White
Write-Host "  2. Cliente ejecuta CONFIGURAR-INICIAL.bat" -ForegroundColor White
Write-Host "  3. Cliente ejecuta INICIAR-MECANET.bat" -ForegroundColor White

Write-Host "`nRuta completa:" -ForegroundColor Gray
Write-Host "  $((Get-Item $finalFolder).FullName)`n" -ForegroundColor White

# Ofrecer abrir la carpeta
$response = Read-Host "Abrir carpeta de distribucion? (s/n)"
if ($response -eq 's' -or $response -eq 'S') {
    Start-Process "explorer.exe" -ArgumentList $finalFolder
}

Write-Host "`nProceso completado exitosamente`n" -ForegroundColor Green
