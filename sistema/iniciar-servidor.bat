@echo off
chcp 65001 >nul

REM Ir al directorio raiz del proyecto
cd /d "%~dp0\.."

REM Detectar Node.js (portable o global)
set "NODE_CMD=node"
if exist "node\node.exe" (
    set "NODE_CMD=node\node.exe"
    echo Usando Node.js portable
) else (
    where node >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Node.js no esta instalado
        echo.
        echo Opciones:
        echo   1. Instala Node.js desde https://nodejs.org/
        echo   2. O copia Node.js portable en la carpeta node/
        echo.
        pause
        exit /b 1
    )
    echo Usando Node.js global
)

REM Verificar que existe el archivo .env
if not exist ".env" (
    echo ADVERTENCIA: No se encuentra el archivo .env
    echo Ejecuta CONFIGURAR-INICIAL.bat primero
    pause
)

REM Establecer NODE_ENV en producción para servir el frontend
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

REM Iniciar el servidor en PRIMER PLANO (para ver logs de error)
echo.
echo ========================================================
echo   INICIANDO SERVIDOR MECANET
echo ========================================================
echo.
echo Puerto: 5000
echo Presiona Ctrl+C para detener el servidor
echo.
echo Logs del servidor:
echo --------------------------------------------------------
echo.

REM Abrir navegador después de 5 segundos (en segundo plano)
start /B cmd /c "timeout /t 5 >nul && start http://localhost:5000"

REM Iniciar servidor en PRIMER PLANO para ver logs
%NODE_CMD% server.js
