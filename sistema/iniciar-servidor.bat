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

REM ========================================================
REM VERIFICAR ACTUALIZACIONES
REM ========================================================
echo Verificando actualizaciones...
%NODE_CMD% scripts/smart-startup.js

set STARTUP_CODE=%errorlevel%

if %STARTUP_CODE% equ 2 (
    echo.
    echo ========================================================
    echo    APLICANDO ACTUALIZACION
    echo ========================================================
    echo.
    
    REM Buscar directamente la carpeta dentro de temp_source_update
    echo Buscando carpeta de actualizacion...
    
    set "UPDATE_PATH="
    for /d %%G in ("temp_source_update\MrXpra-MECANET-*") do (
        set "UPDATE_PATH=%%G"
        goto :FOUND_UPDATE
    )
    
    :FOUND_UPDATE
    if not defined UPDATE_PATH (
        echo [ERROR] No se encontro carpeta de actualizacion en temp_source_update
        echo [DEBUG] Contenido de temp_source_update:
        dir /b temp_source_update 2>nul
        pause
        goto :START_SERVER
    )

    echo [OK] Carpeta encontrada: %UPDATE_PATH%
    echo.
    echo Copiando archivos del sistema...
    
    REM Copiar package.json primero
    copy /Y "%UPDATE_PATH%\package.json" "." >nul
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudo copiar package.json
        pause
        goto :CLEANUP_AND_START
    )
    
    REM Copiar el resto de archivos
    robocopy "%UPDATE_PATH%" "." /E /XO /XD ".git" "node_modules" "temp_source_update" "distribucion" /XF ".env" ".gitignore" "package-lock.json" /NFL /NDL /NJH /NJS
    
    echo [OK] Archivos copiados exitosamente
    
    echo Limpiando archivos temporales...
    rmdir /s /q "temp_source_update" 2>nul
    del ".update-pending" 2>nul

    echo.
    echo Actualizando dependencias...
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --production
    ) else (
        call npm install --production
    )

    echo.
    echo ========================================================
    echo   ACTUALIZACION COMPLETADA
    echo ========================================================
    echo.
    timeout /t 2 >nul
    goto :START_SERVER
    
    :CLEANUP_AND_START
    rmdir /s /q "temp_source_update" 2>nul
    del ".update-pending" 2>nul
)

:START_SERVER
REM Iniciar el servidor mostrando logs en pantalla
echo.
echo Iniciando servidor...
echo.

REM NO abrir navegador desde aquí, el servidor lo abre automáticamente
%NODE_CMD% server.js

REM Capturar el código de salida
set SERVER_EXIT=%errorlevel%

REM Si el servidor se detiene, mantener la ventana abierta
echo.
echo ========================================================
echo   SERVIDOR DETENIDO (Codigo: %SERVER_EXIT%)
echo ========================================================
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
