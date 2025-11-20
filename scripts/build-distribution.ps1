# ============================================
# MECANET - Script de Generación de Paquete de Distribución
# ============================================
# Este script automatiza la creación del paquete completo
# para distribución a clientes (On-Premise)
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ClientName,
    
    [Parameter(Mandatory=$false)]
    [string]$MongoUri = "",
    
    [Parameter(Mandatory=$false)]
    [string]$JwtSecret = ""
)

# Colores para mensajes
$ColorSuccess = "Green"
$ColorInfo = "Cyan"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host "`n============================================" -ForegroundColor $ColorInfo
Write-Host "   MECANET - Generador de Paquete Cliente" -ForegroundColor $ColorInfo
Write-Host "============================================`n" -ForegroundColor $ColorInfo

# Función para mostrar errores y salir
function Show-Error {
    param([string]$Message)
    Write-Host "❌ ERROR: $Message" -ForegroundColor $ColorError
    exit 1
}

# Función para mostrar éxito
function Show-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $ColorSuccess
}

# Función para mostrar información
function Show-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $ColorInfo
}

# Función para mostrar advertencia
function Show-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $ColorWarning
}

# Validar nombre del cliente
if ([string]::IsNullOrWhiteSpace($ClientName)) {
    Show-Error "El nombre del cliente es obligatorio"
}

# Limpiar nombre del cliente (quitar caracteres no válidos para carpetas)
$ClientNameClean = $ClientName -replace '[^\w\s-]', '' -replace '\s+', '-'

Show-Info "Generando paquete para: $ClientName"

# ============================================
# 1. COMPILAR EL EJECUTABLE
# ============================================
Show-Info "Paso 1/5: Compilando el ejecutable..."

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "package.json")) {
    Show-Error "Este script debe ejecutarse desde la raíz del proyecto MECANET"
}

# Ejecutar build:exe
try {
    npm run build:exe 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Fallo la compilación del ejecutable"
    }
    Show-Success "Ejecutable compilado correctamente"
} catch {
    Show-Error "Error al ejecutar npm run build:exe: $_"
}

# Verificar que el ejecutable se generó
$ExePath = "dist\mecanet-backend.exe"
if (-not (Test-Path $ExePath)) {
    Show-Error "No se encontró el ejecutable en dist\mecanet-backend.exe"
}

# ============================================
# 2. CREAR CARPETA DE DISTRIBUCIÓN
# ============================================
Show-Info "Paso 2/5: Creando carpeta de distribución..."

$DistFolder = "MECANET-Distribuciones\$ClientNameClean"
$FullDistPath = Join-Path $PSScriptRoot $DistFolder

# Crear carpeta si no existe
if (Test-Path $FullDistPath) {
    Show-Warning "La carpeta ya existe. Contenido será reemplazado."
    Remove-Item -Path $FullDistPath -Recurse -Force
}

New-Item -ItemType Directory -Path $FullDistPath -Force | Out-Null
Show-Success "Carpeta creada: $DistFolder"

# ============================================
# 3. COPIAR ARCHIVOS
# ============================================
Show-Info "Paso 3/5: Copiando archivos..."

# Copiar ejecutable
Copy-Item -Path $ExePath -Destination $FullDistPath
Show-Success "Ejecutable copiado"

# ============================================
# 4. GENERAR ARCHIVO .ENV
# ============================================
Show-Info "Paso 4/5: Generando archivo .env..."

# Generar JWT_SECRET si no se proporcionó
if ([string]::IsNullOrWhiteSpace($JwtSecret)) {
    Show-Info "Generando JWT_SECRET aleatorio..."
    $JwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
}

# Plantilla del .env
$EnvContent = @"
# ============================================
# MECANET - Configuración para: $ClientName
# Generado: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
# ============================================

# CONEXIÓN A BASE DE DATOS
MONGODB_URI=$MongoUri

# SEGURIDAD
JWT_SECRET=$JwtSecret
JWT_EXPIRE=8h

# SERVIDOR
PORT=5000
NODE_ENV=production
"@

# Guardar .env
$EnvPath = Join-Path $FullDistPath ".env"
$EnvContent | Out-File -FilePath $EnvPath -Encoding UTF8 -NoNewline

if ([string]::IsNullOrWhiteSpace($MongoUri)) {
    Show-Warning "MONGODB_URI no proporcionado. Debe editarse manualmente en el .env"
}

Show-Success "Archivo .env generado"

# ============================================
# 5. CREAR INSTRUCCIONES
# ============================================
Show-Info "Paso 5/5: Creando archivo de instrucciones..."

$InstructionsContent = @"
========================================
   MECANET - Instrucciones de Uso
   Cliente: $ClientName
========================================

INSTALACIÓN:

1. Copie toda esta carpeta a una ubicación permanente
   Ejemplo: C:\MECANET\

2. NO elimine ni modifique el archivo .env

3. Asegúrese de tener conexión a Internet


INICIAR EL SISTEMA:

1. Doble clic en "mecanet-backend.exe"

2. Se abrirá una ventana de terminal - NO LA CIERRE

3. El navegador se abrirá automáticamente

4. Si no se abre, vaya a: http://localhost:5000


PRIMER INICIO:

Usuario: admin
Contraseña: (proporcionada por el proveedor)


DETENER EL SISTEMA:

- Cierre la ventana de terminal
- O presione Ctrl+C en la terminal


PROBLEMAS COMUNES:

Problema: "Puerto 5000 en uso"
Solución: Edite .env y cambie PORT=5000 a PORT=5001

Problema: No se conecta a la base de datos
Solución: Verifique su conexión a Internet

Problema: El navegador no se abre
Solución: Abra manualmente http://localhost:5000


SOPORTE TÉCNICO:

Para asistencia, contacte a su proveedor de software.


INFORMACIÓN TÉCNICA:

Archivo de configuración: .env
Puerto del servidor: 5000 (configurable en .env)
Requiere Internet: Sí (base de datos en la nube)
Compatible con: Windows 10/11 (64-bit)


IMPORTANTE:

✓ Mantener la carpeta en ubicación segura
✓ Hacer respaldo del archivo .env
✓ NO ejecutar múltiples instancias simultáneamente
✓ Contactar a soporte para actualizaciones


========================================
Generado: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
Versión del sistema: 1.0.1
========================================
"@

$InstructionsPath = Join-Path $FullDistPath "INSTRUCCIONES.txt"
$InstructionsContent | Out-File -FilePath $InstructionsPath -Encoding UTF8

Show-Success "Instrucciones creadas"

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "`n============================================" -ForegroundColor $ColorSuccess
Write-Host "   ✓ PAQUETE GENERADO EXITOSAMENTE" -ForegroundColor $ColorSuccess
Write-Host "============================================`n" -ForegroundColor $ColorSuccess

Show-Info "Ubicación: $FullDistPath"
Show-Info "Archivos incluidos:"
Write-Host "  - mecanet-backend.exe" -ForegroundColor White
Write-Host "  - .env" -ForegroundColor White
Write-Host "  - INSTRUCCIONES.txt" -ForegroundColor White

Write-Host "`n📋 SIGUIENTES PASOS:`n" -ForegroundColor $ColorInfo

if ([string]::IsNullOrWhiteSpace($MongoUri)) {
    Show-Warning "1. EDITAR el archivo .env y configurar MONGODB_URI"
    Write-Host "   Ubicación: $EnvPath`n" -ForegroundColor Yellow
}

Write-Host "2. PROBAR el paquete localmente:" -ForegroundColor White
Write-Host "   cd '$FullDistPath'" -ForegroundColor Gray
Write-Host "   .\mecanet-backend.exe`n" -ForegroundColor Gray

Write-Host "3. DISTRIBUIR al cliente:" -ForegroundColor White
Write-Host "   - Comprimir la carpeta en ZIP" -ForegroundColor Gray
Write-Host "   - Enviar por email/USB/remoto" -ForegroundColor Gray
Write-Host "   - O copiar directamente a la PC del cliente`n" -ForegroundColor Gray

Write-Host "4. CREAR usuario administrador inicial:" -ForegroundColor White
Write-Host "   npm run create-admin`n" -ForegroundColor Gray

Show-Success "¡Listo para distribuir!"

Write-Host "`n============================================`n" -ForegroundColor $ColorInfo
