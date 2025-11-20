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
REM 2. SMART STARTUP (Verificar actualizaciones)
REM ========================================================
echo.
echo Ejecutando Smart Startup...

REM Ejecutar script de inicio inteligente
if exist "node\node.exe" (
    "node\node.exe" scripts/smart-startup.js
) else (
    node scripts/smart-startup.js
)

REM Verificar el código de salida (Exit Code)
REM Si es 2, significa que hay una actualización pendiente
if %errorlevel% equ 2 (
    cls
    echo.
    echo [ACTUALIZADOR] Aplicando nueva version desde codigo fuente...
    echo Por favor espere, no cierre esta ventana.
    echo.

    REM Leer la ruta de la actualización desde el archivo bandera
    set /p UPDATE_PATH=<.update-pending
    
    if not exist "%UPDATE_PATH%" (
        echo [ERROR] No se encontro la carpeta de actualizacion.
        goto :CONFIGURACION
    )

    echo Copiando archivos desde: %UPDATE_PATH%

    REM Copiar archivos nuevos sobre los viejos
    REM Excluir .env y node_modules (aunque el zip no trae node_modules)
    REM Usamos robocopy por ser mas robusto que xcopy para exclusiones
    
    REM 1. Copiar todo EXCEPTO carpetas protegidas y archivos protegidos
    robocopy "%UPDATE_PATH%" "." /E /XO /XD ".git" "node_modules" "temp_source_update" "distribucion" /XF ".env" ".gitignore" "package-lock.json" >nul

    REM 2. Forzar copia de package.json si cambio
    copy /Y "%UPDATE_PATH%\package.json" "." >nul

    REM Limpiar temporales
    rmdir /s /q "temp_source_update"
    del ".update-pending"

    echo.
    echo [ACTUALIZADOR] Actualizando dependencias (npm install)...
    if exist "node\node.exe" (
        "node\node.exe" "node\node_modules\npm\bin\npm-cli.js" install --production
    ) else (
        call npm install --production
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

echo.
echo ========================================================
echo PROCESO FINALIZADO
echo ========================================================
pause
