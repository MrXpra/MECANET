# Script para limpiar completamente la carpeta de distribución
# Útil antes de generar un nuevo paquete limpio

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   LIMPIAR CARPETA DE DISTRIBUCIÓN" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$distFolder = "distribucion"

if (Test-Path $distFolder) {
    Write-Host "Limpiando carpeta distribucion/..." -ForegroundColor Yellow
    
    # Eliminar todo excepto README.md
    Get-ChildItem -Path $distFolder | Where-Object { $_.Name -ne "README.md" } | Remove-Item -Recurse -Force
    
    Write-Host "✅ Carpeta limpiada exitosamente`n" -ForegroundColor Green
    Write-Host "Contenido restante:" -ForegroundColor Cyan
    Get-ChildItem -Path $distFolder | Select-Object Name
} else {
    Write-Host "⚠️  La carpeta distribucion/ no existe" -ForegroundColor Yellow
    Write-Host "   Creando carpeta..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $distFolder -Force | Out-Null
    Write-Host "✅ Carpeta creada`n" -ForegroundColor Green
}

Write-Host "`nPróximos pasos:" -ForegroundColor Cyan
Write-Host "1. npm run build:portable    # Generar paquete" -ForegroundColor White
Write-Host "2. npm run package:zip       # Comprimir`n" -ForegroundColor White
