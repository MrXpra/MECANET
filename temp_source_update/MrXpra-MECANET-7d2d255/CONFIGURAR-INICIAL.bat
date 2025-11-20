@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MECANET - Configuracion

echo.
echo ========================================================
echo    MECANET - Configuracion Inicial
echo ========================================================
echo.

REM ========================================================
REM 1. INSTALACIÓN DE DEPENDENCIAS
REM ========================================================
if not exist "node_modules" (
    echo [1/3] Instalando dependencias...
    
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --omit=dev
    ) else (
        call npm install --omit=dev
    )
    
    if %errorlevel% neq 0 (
        echo.
        echo Error instalando dependencias.
        pause
        exit /b 1
    )
    echo OK
)

REM ========================================================
REM 2. VERIFICAR ACTUALIZACIONES
REM ========================================================
echo.
echo [2/3] Verificando actualizaciones...

if exist "node\node.exe" (
    "node\node.exe" scripts/smart-startup.js
) else (
    node scripts/smart-startup.js
)

set STARTUP_CODE=%errorlevel%

if %STARTUP_CODE% equ 2 (
    cls
    echo.
    echo Aplicando actualizacion...
    
    set /p UPDATE_PATH=<.update-pending
    
    if not exist "%UPDATE_PATH%" (
        echo Error: Carpeta de actualizacion no encontrada
        pause
        goto :CONFIGURACION
    )

    robocopy "%UPDATE_PATH%" "." /E /XO /XD ".git" "node_modules" "temp_source_update" "distribucion" /XF ".env" ".gitignore" "package-lock.json" >nul
    copy /Y "%UPDATE_PATH%\package.json" "." >nul
    rmdir /s /q "temp_source_update"
    del ".update-pending"

    echo Actualizando dependencias...
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --production
    ) else (
        call npm install --production
    )

    echo OK
    timeout /t 2 >nul
    cls
)

:CONFIGURACION
REM ========================================================
REM 3. CONFIGURACIÓN DEL SISTEMA
REM ========================================================
echo.
echo [3/3] Configurando sistema...
echo.

powershell -ExecutionPolicy Bypass -File "sistema\CONFIGURAR-INICIAL.ps1"

echo.
echo ========================================================
echo    Configuracion Finalizada
echo ========================================================
echo.
pause >nul
