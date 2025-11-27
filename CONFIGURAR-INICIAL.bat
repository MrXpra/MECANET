@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MECANET - Configuracion

echo.
echo ========================================================
echo    MECANET - Configuracion Inicial
echo ========================================================
echo.
echo Bienvenido al asistente de configuracion de MECANET.
echo Este proceso preparara todo lo necesario para iniciar el sistema.
echo.

REM ========================================================
REM 1. INSTALACIÓN DE DEPENDENCIAS
REM ========================================================
if not exist "node_modules" (
    echo [1/2] Instalando componentes necesarios...
    echo       Por favor espere, esto puede tomar unos minutos.
    
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --omit=dev
    ) else (
        call npm install --omit=dev
    )
    
    if %errorlevel% neq 0 (
        echo.
        echo [X] Ocurrio un error al instalar los componentes.
        echo     Por favor verifique su conexion a internet e intente nuevamente.
        pause
        exit /b 1
    )
    echo [OK] Componentes instalados correctamente.
) else (
    echo [1/2] Componentes ya instalados. Saltando este paso.
)

:CONFIGURACION
REM ========================================================
REM 2. CONFIGURACIÓN DEL SISTEMA
REM ========================================================
echo.
echo [2/2] Iniciando configuracion del sistema...
echo.

powershell -ExecutionPolicy Bypass -File "sistema\CONFIGURAR-INICIAL.ps1"

echo.
echo ========================================================
echo    Configuracion Finalizada Exitosamente
echo ========================================================
echo.
echo Ya puedes iniciar el sistema ejecutando "INICIAR-MECANET.bat"
echo.
pause
