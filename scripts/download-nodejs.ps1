# Script para descargar Node.js portable automáticamente

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   DESCARGA DE NODE.JS PORTABLE" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$nodeVersion = "v18.17.0"
$nodeUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
$zipFile = "distribucion\node-portable.zip"
$targetFolder = "distribucion\MECANET-Portable\node"

Write-Host "Descargando Node.js $nodeVersion..." -ForegroundColor Yellow
Write-Host "URL: $nodeUrl`n" -ForegroundColor Gray

try {
    # Descargar Node.js
    Invoke-WebRequest -Uri $nodeUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "✓ Descarga completada" -ForegroundColor Green
    
    # Crear carpeta node si no existe
    if (Test-Path $targetFolder) {
        Write-Host "Limpiando carpeta node anterior..." -ForegroundColor Yellow
        Remove-Item -Path $targetFolder -Recurse -Force
    }
    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
    
    # Extraer ZIP
    Write-Host "Extrayendo archivos..." -ForegroundColor Yellow
    Expand-Archive -Path $zipFile -DestinationPath "distribucion\temp-node" -Force
    
    # Mover archivos a la carpeta node (sin la carpeta intermedia)
    $extractedFolder = Get-ChildItem "distribucion\temp-node" | Select-Object -First 1
    Move-Item -Path "$($extractedFolder.FullName)\*" -Destination $targetFolder -Force
    
    # Limpiar
    Remove-Item -Path "distribucion\temp-node" -Recurse -Force
    Remove-Item -Path $zipFile -Force
    
    Write-Host "`n✓ Node.js instalado correctamente" -ForegroundColor Green
    Write-Host "  Ubicación: $targetFolder" -ForegroundColor Gray
    
    # Verificar instalación
    $nodeExe = "$targetFolder\node.exe"
    if (Test-Path $nodeExe) {
        $version = & $nodeExe --version
        Write-Host "  Versión: $version`n" -ForegroundColor Gray
        
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "   ✓ INSTALACIÓN COMPLETADA" -ForegroundColor Green
        Write-Host "============================================`n" -ForegroundColor Green
        
        Write-Host "Siguiente paso:" -ForegroundColor Cyan
        Write-Host "cd distribucion\MECANET-Portable" -ForegroundColor White
        Write-Host ".\INICIAR-MECANET.bat`n" -ForegroundColor White
    } else {
        throw "No se encontró node.exe después de la instalación"
    }
    
} catch {
    Write-Host "`n✗ ERROR: $_" -ForegroundColor Red
    Write-Host "`nSi la descarga automática falla, descarga manualmente desde:" -ForegroundColor Yellow
    Write-Host "$nodeUrl`n" -ForegroundColor Gray
    exit 1
}
