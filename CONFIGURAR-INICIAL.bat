@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MECANET - Configuracion Inicial

cls
echo.
echo ========================================================
echo    MECANET - Configuracion Inicial
echo ========================================================
echo.

REM ========================================================
REM 1. INSTALACIÓN DE DEPENDENCIAS
REM ========================================================
if not exist "node_modules" (
    echo [1/2] Instalando dependencias del sistema...
    echo       Por favor espere, esto puede tomar unos minutos.
    echo.
    
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --omit=dev --no-audit --no-fund --quiet
    ) else (
        call npm install --omit=dev --no-audit --no-fund --quiet
    )
    
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Hubo un problema instalando las dependencias.
        echo         Verifique su conexion a internet e intente nuevamente.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas.
) else (
    echo [1/2] Dependencias ya instaladas. Omitiendo...
)

REM ========================================================
REM 2. CONFIGURACIÓN DEL SISTEMA
REM ========================================================
echo.
echo [2/2] Iniciando asistente de configuracion...
echo.

powershell -ExecutionPolicy Bypass -File "sistema\CONFIGURAR-INICIAL.ps1"

echo.
echo ========================================================
echo    Configuracion Finalizada Exitosamente
echo ========================================================
echo.
echo Ya puede iniciar el sistema usando el icono "INICIAR-MECANET".
echo.
pause
