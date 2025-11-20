@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "sistema\CONFIGURAR-INICIAL.ps1"
if %errorlevel% neq 0 pause
