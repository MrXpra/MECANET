# ================================================================
# SOLUCION ALTERNATIVA: Usar Node.js Portable + PM2
# ================================================================
# pkg tiene limitaciones con ES Modules. La mejor alternativa
# es distribuir Node.js portable con el proyecto.

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   CREANDO PAQUETE PORTABLE" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Leer version del proyecto
$versionJson = Get-Content "version.json" | ConvertFrom-Json
$version = $versionJson.version

Write-Host "Version: $version" -ForegroundColor Yellow

$distFolder = "MECANET-Portable"

# Limpiar carpeta anterior
if (Test-Path $distFolder) {
    Remove-Item -Path $distFolder -Recurse -Force
}

Write-Host "Creando estructura de carpetas..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "distribucion" -Force | Out-Null
New-Item -ItemType Directory -Path "distribucion\$distFolder" -Force | Out-Null
New-Item -ItemType Directory -Path "distribucion\$distFolder\sistema" -Force | Out-Null
New-Item -ItemType Directory -Path "distribucion\$distFolder\node" -Force | Out-Null

# Copiar archivos del backend al sistema
Write-Host "Copiando archivos del proyecto..." -ForegroundColor Cyan
$exclude = @('node_modules', '.git', 'distribucion', 'MECANET-*', 'logs', '*.log', '.env', 'CONFIGURAR-INICIAL.bat', 'CONFIGURAR-INICIAL.ps1')

# Copiar carpetas principales
$folders = @('config', 'controllers', 'middleware', 'models', 'routes', 'scripts', 'services')
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Copy-Item -Path $folder -Destination "distribucion\$distFolder" -Recurse -Force
    }
}

# Copiar archivos de configuración
$files = @('server.js', 'package.json', 'package-lock.json', 'nodemon.json', 'version.json', '.env.example', '.gitignore')
foreach ($file in $files) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "distribucion\$distFolder" -Force
    }
}

# Copiar documentación
$docs = @('README.md', 'CHANGELOG.md')
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Copy-Item -Path $doc -Destination "distribucion\$distFolder" -Force
    }
}

# Copiar client/dist si existe
if (Test-Path "client\dist") {
    Write-Host "Copiando frontend compilado..." -ForegroundColor Cyan
    # Crear carpeta client/dist en destino
    New-Item -ItemType Directory -Path "distribucion\$distFolder\client\dist" -Force | Out-Null
    # Copiar TODO el contenido de dist (incluyendo carpeta assets)
    Copy-Item -Path "client\dist\*" -Destination "distribucion\$distFolder\client\dist\" -Recurse -Force
} else {
    Write-Host "ADVERTENCIA: client\dist no existe" -ForegroundColor Yellow
}

# Crear script de inicio
Write-Host "Creando script de inicio..." -ForegroundColor Cyan

$startScript = @'
@echo off
chcp 65001 >nul

REM Ir al directorio raiz del proyecto
cd /d "%~dp0\.."

REM Verificar que existe node.exe
if not exist "node\node.exe" (
    echo ERROR: No se encuentra node.exe
    pause
    exit /b 1
)

REM Verificar que existe el archivo .env
if not exist ".env" (
    echo ADVERTENCIA: No se encuentra el archivo .env
    pause
)

REM Establecer NODE_ENV
set NODE_ENV=production

REM Verificar si el servidor ya esta corriendo
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo MECANET ya esta en ejecucion.
    echo Abriendo navegador...
    echo.
    start http://localhost:5000
    timeout /t 2 >nul
    exit /b 0
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias ^(esto puede tomar unos minutos^)...
    echo.
    node\node.exe node\node_modules\npm\bin\npm-cli.js install --omit=dev
    echo.
    echo Dependencias instaladas
    pause
)

REM Iniciar el servidor en segundo plano usando VBScript
echo Set WshShell = CreateObject^("WScript.Shell"^) > "%temp%\mecanet-start.vbs"
echo WshShell.Run "cmd /c cd /d ""%~dp0"" && node\node.exe server.js", 0, False >> "%temp%\mecanet-start.vbs"
cscript //nologo "%temp%\mecanet-start.vbs"
del "%temp%\mecanet-start.vbs"

REM Mensaje final
echo.
echo MECANET se esta iniciando en segundo plano...
echo El navegador se abrira automaticamente.
echo.
echo Para detener el servidor, ejecuta DETENER-MECANET.bat
timeout /t 3 >nul
'@

$startScript | Out-File -FilePath "distribucion\$distFolder\sistema\iniciar-servidor.bat" -Encoding ASCII

# Crear script de inicio en la raíz (launcher)
$launcherStart = @'
@echo off
cd /d "%~dp0\sistema"
call iniciar-servidor.bat
'@

$launcherStart | Out-File -FilePath "distribucion\$distFolder\INICIAR-MECANET.bat" -Encoding ASCII

# Crear script para detener el servidor
Write-Host "Creando script para detener servidor..." -ForegroundColor Cyan

$stopScript = @'
@echo off
chcp 65001 >nul
title MECANET - Detener Servidor

echo.
echo ============================================
echo    MECANET - Deteniendo Servidor
echo ============================================
echo.

REM Detener todos los procesos de node.exe
taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Servidor MECANET detenido correctamente
) else (
    echo [INFO] No hay ningun servidor MECANET ejecutandose
)

echo.
echo ============================================
timeout /t 2 >nul
'@

$stopScript | Out-File -FilePath "distribucion\$distFolder\sistema\detener-servidor.bat" -Encoding ASCII

# Crear script de detención en la raíz (launcher)
$launcherStop = @'
@echo off
cd /d "%~dp0\sistema"
call detener-servidor.bat
'@

$launcherStop | Out-File -FilePath "distribucion\$distFolder\DETENER-MECANET.bat" -Encoding ASCII

# Crear archivo README de inicio rápido
Write-Host "Creando documentacion de inicio..." -ForegroundColor Cyan

$readmeContent = @"
# MECANET - Inicio Rapido

## Primera Vez - Configuracion Inicial

1. Ejecuta **CONFIGURAR-INICIAL.bat**
2. Sigue las instrucciones para configurar tu base de datos
3. El sistema generara automaticamente tu archivo de configuracion

## Uso Diario

- **INICIAR-MECANET.bat** - Inicia el servidor
- **DETENER-MECANET.bat** - Detiene el servidor

Para mas informacion, consulta README.md
"@

$readmeContent | Out-File -FilePath "distribucion\$distFolder\LEEME-PRIMERO.txt" -Encoding UTF8

# Copiar launchers a la raíz del paquete
Write-Host "Copiando launchers a la raiz..." -ForegroundColor Cyan
$launchers = @('CONFIGURAR-INICIAL.bat', 'INICIAR-MECANET.bat', 'DETENER-MECANET.bat')
foreach ($launcher in $launchers) {
    if (Test-Path $launcher) {
        Copy-Item $launcher "distribucion\$distFolder\" -Force
    }
}

# Copiar scripts reales del sistema (solo .ps1 y scripts de servidor)
Write-Host "Copiando scripts del sistema..." -ForegroundColor Cyan
$systemScripts = @('CONFIGURAR-INICIAL.ps1', 'iniciar-servidor.bat', 'detener-servidor.bat')
foreach ($script in $systemScripts) {
    if (Test-Path "sistema\$script") {
        Copy-Item "sistema\$script" "distribucion\$distFolder\sistema\" -Force
    }
}

# Crear README en carpeta node
$nodeReadme = @"
COPIAR NODE.JS PORTABLE AQUI

1. Descarga Node.js v18.17.0 portable desde:
   https://nodejs.org/dist/v18.17.0/node-v18.17.0-win-x64.zip

2. Extrae el contenido y copia TODOS los archivos de la carpeta
   node-v18.17.0-win-x64 a esta carpeta node/

3. Debe quedar asi:
   node/
   ├── node.exe
   ├── npm
   ├── npx
   └── node_modules/

4. Luego ejecuta CONFIGURAR-INICIAL.bat
"@

$nodeReadme | Out-File -FilePath "distribucion\$distFolder\node\README.txt" -Encoding UTF8

# Limpiar archivos innecesarios de la raíz
Write-Host "Limpiando archivos innecesarios..." -ForegroundColor Cyan
$filesToRemove = @(
    'NUEVAS-FUNCIONALIDADES.txt',
    'ORGANIZACION-PROYECTO.txt'
)
foreach ($file in $filesToRemove) {
    if (Test-Path "distribucion\$distFolder\$file") {
        Remove-Item "distribucion\$distFolder\$file" -Force
    }
}

Write-Host "[OK] Paquete portable creado" -ForegroundColor Green
Write-Host "Directorio: distribucion\$distFolder" -ForegroundColor Cyan
Write-Host "`nEstructura del paquete:" -ForegroundColor Yellow
Write-Host "  [RAIZ]" -ForegroundColor White
Write-Host "    - CONFIGURAR-INICIAL.bat (primera vez)" -ForegroundColor Gray
Write-Host "    - INICIAR-MECANET.bat (iniciar servidor)" -ForegroundColor Gray
Write-Host "    - DETENER-MECANET.bat (detener servidor)" -ForegroundColor Gray
Write-Host "    - LEEME-PRIMERO.txt (instrucciones)" -ForegroundColor Gray
Write-Host "  [SISTEMA/]" -ForegroundColor White
Write-Host "    - Scripts internos del sistema" -ForegroundColor Gray
