@echo off
chcp 65001 >nul
cd /d "%~dp0"
title CONFIGURACION Y ARRANQUE MECANET

REM ========================================================
REM 1. INSTALACIÓN DE DEPENDENCIAS (Si es necesario)
REM ========================================================
REM Necesitamos dependencias para ejecutar el script de chequeo
if not exist "node_modules" (
    echo [INICIO] Instalando dependencias necesarias...
    echo Esto puede tomar unos minutos...
    
    REM Detectar si usamos node portable o global
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --omit=dev
    ) else (
        call npm install --omit=dev
    )
    
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de dependencias.
        echo Continuando con la configuracion sin verificar actualizaciones...
        goto :CONFIGURACION
    )
)

REM ========================================================
REM 2. VERIFICAR ACTUALIZACIONES
REM ========================================================
echo.
echo Verificando actualizaciones en la nube...

REM Ejecutar script de chequeo usando node portable o global
if exist "node\node.exe" (
    "node\node.exe" scripts/startup-check.js
) else (
    node scripts/startup-check.js
)

REM Verificar el código de salida (Exit Code)
REM Si es 2, significa que se descargó una actualización en ./temp_update
if %errorlevel% equ 2 (
    cls
    echo.
    echo [ACTUALIZADOR] Aplicando nueva version...
    echo Por favor espere, no cierre esta ventana.
    echo.

    REM Copiar archivos nuevos sobre los viejos (Sobrescribir todo /s /y)
    REM Se asume que el ZIP no trae .env para no borrar la config del cliente
    xcopy /s /y ".\temp_update\*" "." >nul

    REM Limpiar basura
    rmdir /s /q ".\temp_update"

    echo.
    echo [ACTUALIZADOR] Actualizando dependencias...
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --omit=dev
    ) else (
        call npm install --omit=dev
    )

    echo.
    echo [EXITO] Sistema actualizado correctamente.
    timeout /t 3 >nul
    cls
)

:CONFIGURACION
REM ========================================================
REM 3. INICIAR CONFIGURACIÓN
REM ========================================================
powershell -ExecutionPolicy Bypass -File "sistema\CONFIGURAR-INICIAL.ps1"
if %errorlevel% neq 0 pause
