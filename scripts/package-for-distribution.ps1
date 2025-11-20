# Script para comprimir el paquete MECANET-Portable listo para distribución

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   CREAR PAQUETE DE DISTRIBUCIÓN" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Leer versión del proyecto
$versionJson = Get-Content "version.json" | ConvertFrom-Json
$version = $versionJson.version

$packageFolder = "distribucion\MECANET-Portable"
$zipName = "distribucion\MECANET-v$version-Portable.zip"

# Verificar que existe el paquete
if (-not (Test-Path $packageFolder)) {
    Write-Host "✗ Error: No se encuentra la carpeta $packageFolder" -ForegroundColor Red
    Write-Host "  Ejecuta primero: .\scripts\create-portable.ps1`n" -ForegroundColor Yellow
    exit 1
}

# Verificar que Node.js está incluido
if (-not (Test-Path "$packageFolder\node\node.exe")) {
    Write-Host "⚠️  ADVERTENCIA: Node.js no está incluido" -ForegroundColor Yellow
    Write-Host "   El paquete será más pequeño pero el cliente deberá descargar Node.js" -ForegroundColor Yellow
    Write-Host "   Para incluir Node.js, ejecuta: .\scripts\download-nodejs.ps1`n" -ForegroundColor Yellow
    
    $response = Read-Host "¿Continuar sin Node.js? (s/n)"
    if ($response -ne 's') {
        Write-Host "Operación cancelada`n" -ForegroundColor Yellow
        exit 0
    }
}

# Verificar que existe .env
if (-not (Test-Path "$packageFolder\.env")) {
    Write-Host "⚠️  ADVERTENCIA: No se encuentra .env" -ForegroundColor Yellow
    Write-Host "   El paquete no tendrá configuración predefinida.`n" -ForegroundColor Yellow
}

# Verificar que existe .env.example
if (-not (Test-Path "$packageFolder\.env.example")) {
    Write-Host "⚠️  ADVERTENCIA: No se encuentra .env.example" -ForegroundColor Red
    Write-Host "   El script de configuración inicial fallará sin este archivo.`n" -ForegroundColor Yellow
}

# Eliminar ZIP anterior si existe
if (Test-Path $zipName) {
    Write-Host "Eliminando ZIP anterior..." -ForegroundColor Yellow
    Remove-Item $zipName -Force
}

# Comprimir
Write-Host "Comprimiendo paquete..." -ForegroundColor Cyan
Write-Host "Esto puede tomar unos minutos...`n" -ForegroundColor Gray

try {
    Compress-Archive -Path $packageFolder -DestinationPath $zipName -CompressionLevel Optimal -Force
    
    $zipFile = Get-Item $zipName
    $sizeMB = [math]::Round($zipFile.Length / 1MB, 2)
    
    Write-Host "`n✅ Paquete creado exitosamente" -ForegroundColor Green
    Write-Host "   Archivo: $zipName" -ForegroundColor White
    Write-Host "   Tamaño: $sizeMB MB`n" -ForegroundColor Cyan
    
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "   ✓ LISTO PARA DISTRIBUIR" -ForegroundColor Green
    Write-Host "============================================`n" -ForegroundColor Green
    
    Write-Host "Siguiente paso:" -ForegroundColor Cyan
    Write-Host "  • Enviar $zipName al cliente" -ForegroundColor White
    Write-Host "  • Cliente descomprime y ejecuta INICIAR-MECANET.bat`n" -ForegroundColor White
    
    # Mostrar checklist
    Write-Host "Checklist de distribución:" -ForegroundColor Yellow
    if (Test-Path "$packageFolder\node\node.exe") {
        Write-Host "  ✓ Node.js incluido" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Node.js NO incluido (cliente debe descargar)" -ForegroundColor Red
    }
    
    if (Test-Path "$packageFolder\.env") {
        Write-Host "  ✓ Archivo .env incluido" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Archivo .env NO incluido" -ForegroundColor Red
    }
    
    if (Test-Path "$packageFolder\client\dist\index.html") {
        Write-Host "  ✓ Frontend compilado incluido" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Frontend NO compilado" -ForegroundColor Red
    }
    
    if (Test-Path "$packageFolder\INSTRUCCIONES.txt") {
        Write-Host "  ✓ Instrucciones incluidas" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Instrucciones no encontradas" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
} catch {
    Write-Host "`n✗ Error al comprimir: $_" -ForegroundColor Red
    exit 1
}
