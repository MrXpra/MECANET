@echo off
chcp 65001 >nul

REM Ir al directorio raiz del proyecto
cd /d "%~dp0\.."

title MECANET - Servidor

REM ========================================================
REM 1. VERIFICACIONES INICIALES
REM ========================================================

REM Detectar Node.js (portable o global)
set "NODE_CMD=node"
if exist "node\node.exe" (
    set "NODE_CMD=node\node.exe"
) else (
    where node >nul 2>&1
    if %errorlevel% neq 0 (
        cls
        echo.
        echo [ERROR] Node.js no esta instalado.
        echo.
        echo El sistema no puede iniciar porque falta el entorno de ejecucion.
        echo Por favor contacte a soporte tecnico.
        echo.
        pause
        exit /b 1
    )
)

REM Verificar que existe el archivo .env
if not exist ".env" (
    cls
    echo.
    echo [ADVERTENCIA] El sistema no esta configurado.
    echo.
    echo Por favor ejecute el archivo "CONFIGURAR-INICIAL" primero.
    echo.
    pause
    exit /b 1
)

REM Establecer NODE_ENV en produccion
set NODE_ENV=production

REM Verificar si el servidor ya esta corriendo
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [INFO] MECANET ya esta en ejecucion en segundo plano.
    echo        Abriendo el sistema en su navegador...
    echo.
    start http://localhost:5000
    timeout /t 3 >nul
    exit /b 0
)

REM ========================================================
REM 2. INICIAR SERVIDOR
REM ========================================================
cls
echo.
echo ========================================================
echo    INICIANDO MECANET
echo ========================================================
echo.
echo [INFO] Cargando sistema...
echo.

REM Iniciar el servidor
%NODE_CMD% server.js

REM Capturar el codigo de salida
set SERVER_EXIT=%errorlevel%

REM Si el servidor se detiene, mostrar mensaje
echo.
echo ========================================================
echo    SERVIDOR DETENIDO
echo ========================================================
echo.
if %SERVER_EXIT% neq 0 (
    echo [ERROR] El sistema se detuvo inesperadamente (Codigo: %SERVER_EXIT%)
    echo         Por favor revise los mensajes de error arriba.
)
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
