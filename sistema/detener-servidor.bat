@echo off
chcp 65001 >nul
title MECANET - Detener Servidor

echo.
echo ============================================
echo    MECANET - Deteniendo Servidor
echo ============================================
echo.

REM Detener todos los procesos de node.exe
taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Servidor MECANET detenido correctamente
) else (
    echo [INFO] No hay ningun servidor MECANET ejecutandose
)

echo.
echo ============================================
timeout /t 2 >nul
