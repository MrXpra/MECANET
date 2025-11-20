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

REM Iniciar el servidor en segundo plano usando VBScript
echo Set WshShell = CreateObject^("WScript.Shell"^) > "%temp%\mecanet-start.vbs"
echo WshShell.Run "cmd /c cd /d ""%~dp0\.."" && %NODE_CMD% server.js", 0, False >> "%temp%\mecanet-start.vbs"
cscript //nologo "%temp%\mecanet-start.vbs"
del "%temp%\mecanet-start.vbs"

REM Mensaje final y abrir navegador
echo.
echo MECANET se esta iniciando...
echo Esperando que el servidor este listo...
timeout /t 5 >nul

echo Abriendo navegador...
start http://localhost:5000

echo.
echo MECANET ejecutandose en segundo plano
echo Para detener el servidor, ejecuta DETENER-MECANET.bat
echo.
timeout /t 2 >nul
