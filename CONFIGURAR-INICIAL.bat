@echo off
chcp 65001 >nul
cd /d "%~dp0"
title CONFIGURACION Y ARRANQUE MECANET

echo.
echo ========================================================
echo    MECANET - CONFIGURACION INICIAL
echo ========================================================
echo.

REM ========================================================
REM 1. INSTALACIÓN DE DEPENDENCIAS (Si es necesario)
REM ========================================================
if not exist "node_modules" (
    echo [PASO 1/3] Instalando dependencias necesarias...
    echo Esto puede tomar unos minutos...
    echo.
    
    REM Detectar si usamos node portable o global
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --omit=dev
    ) else (
        call npm install --omit=dev
    )
    
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Fallo la instalacion de dependencias.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas correctamente.
)

REM ========================================================
REM 2. SMART STARTUP (Verificar actualizaciones)
REM ========================================================
echo.
echo [PASO 2/3] Verificando actualizaciones...
echo.

if exist "node\node.exe" (
    "node\node.exe" scripts/smart-startup.js
) else (
    node scripts/smart-startup.js
)

set STARTUP_CODE=%errorlevel%

if %STARTUP_CODE% equ 2 (
    cls
    echo.
    echo ========================================================
    echo    APLICANDO ACTUALIZACION
    echo ========================================================
    echo.
    echo Por favor espere, no cierre esta ventana...
    echo.

    set /p UPDATE_PATH=<.update-pending
    
    if not exist "%UPDATE_PATH%" (
        echo [ERROR] No se encontro la carpeta de actualizacion.
        echo.
        pause
        goto :CONFIGURACION
    )

    echo Copiando archivos desde: %UPDATE_PATH%
    echo.

    robocopy "%UPDATE_PATH%" "." /E /XO /XD ".git" "node_modules" "temp_source_update" "distribucion" /XF ".env" ".gitignore" "package-lock.json" >nul

    copy /Y "%UPDATE_PATH%\package.json" "." >nul

    rmdir /s /q "temp_source_update"
    del ".update-pending"

    echo.
    echo Actualizando dependencias...
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --production
    ) else (
        call npm install --production
    )

    echo.
    echo [OK] Sistema actualizado correctamente.
    timeout /t 3 >nul
    cls
)

:CONFIGURACION
REM ========================================================
REM 3. CONFIGURACIÓN DEL SISTEMA
REM ========================================================
echo.
echo [PASO 3/3] Iniciando configuracion del sistema...
echo.

powershell -ExecutionPolicy Bypass -File "sistema\CONFIGURAR-INICIAL.ps1"

echo.
echo ========================================================
echo    CONFIGURACION FINALIZADA
echo ========================================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
