# ============================================
# MECANET - Script de Configuración Inicial
# ============================================
# Este script ayuda a configurar MECANET para un nuevo cliente

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   MECANET - Configuracion Inicial" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Verificar si ya fue configurado
$configFlag = ".mecanet-configured"
if (Test-Path $configFlag) {
    Write-Host "MECANET ya esta configurado." -ForegroundColor Yellow
    Write-Host "Si necesitas reconfigurar, elimina el archivo: $configFlag" -ForegroundColor Gray
    Write-Host "`nPresiona Enter para continuar..." -ForegroundColor Gray
    Read-Host
    exit 0
}

# Verificar si ya existe .env
if (Test-Path ".env") {
    Write-Host "ADVERTENCIA: Ya existe un archivo .env" -ForegroundColor Yellow
    $response = Read-Host "Deseas sobrescribirlo? (s/n)"
    if ($response -ne 's' -and $response -ne 'S') {
        Write-Host "Operacion cancelada" -ForegroundColor Gray
        exit 0
    }
}

# Verificar que existe .env.example
if (-not (Test-Path ".env.example")) {
    Write-Host "ERROR: No se encuentra el archivo .env.example" -ForegroundColor Red
    exit 1
}

Write-Host "Configurando MECANET para nuevo cliente...`n" -ForegroundColor White

# Generar JWT Secret
Write-Host "[1/4] Generando JWT Secret seguro..." -ForegroundColor Cyan
$jwtSecret = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })

# Solicitar información de MongoDB
Write-Host "[2/4] Configuracion de Base de Datos" -ForegroundColor Cyan
Write-Host "Opciones:" -ForegroundColor White
Write-Host "  1. MongoDB Atlas (en la nube - recomendado)" -ForegroundColor Gray
Write-Host "  2. MongoDB Local (en esta computadora)" -ForegroundColor Gray
$dbOption = Read-Host "Selecciona una opcion (1/2)"

if ($dbOption -eq "1") {
    Write-Host "`nPara obtener tu URL de MongoDB Atlas:" -ForegroundColor Yellow
    Write-Host "  1. Ve a https://www.mongodb.com/cloud/atlas" -ForegroundColor Gray
    Write-Host "  2. Crea una cuenta gratuita" -ForegroundColor Gray
    Write-Host "  3. Crea un cluster" -ForegroundColor Gray
    Write-Host "  4. Conecta -> Drivers -> Copia la cadena de conexion`n" -ForegroundColor Gray
    
    $mongoUri = Read-Host "Pega tu URL de MongoDB Atlas"
    
    # Validar formato básico
    if ($mongoUri -notmatch "^mongodb(\+srv)?://") {
        Write-Host "ADVERTENCIA: La URL no parece valida. Asegurate de que comience con mongodb:// o mongodb+srv://" -ForegroundColor Yellow
    }
} else {
    $mongoUri = "mongodb://localhost:27017/mecanet"
    Write-Host "Usando MongoDB local: $mongoUri" -ForegroundColor Green
}

# Solicitar puerto
Write-Host "`n[3/4] Configuracion del Puerto" -ForegroundColor Cyan
$port = Read-Host "Puerto del servidor (presiona Enter para usar 5000)"
if ([string]::IsNullOrWhiteSpace($port)) {
    $port = "5000"
}

# Crear archivo .env
Write-Host "`n[4/4] Creando archivo de configuracion..." -ForegroundColor Cyan

$envContent = @"
# ============================================
# MECANET - Configuración del Sistema
# ============================================
# Generado automáticamente el $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')

# Conexión a MongoDB
MONGODB_URI=$mongoUri

# Secreto para JWT (¡NUNCA COMPARTAS ESTE VALOR!)
JWT_SECRET=$jwtSecret
JWT_EXPIRE=1h

# Puerto del servidor
PORT=$port

# Entorno de ejecución
NODE_ENV=production
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "`n[OK] Archivo .env creado!" -ForegroundColor Green

# ============================================
# VERIFICAR CONEXION Y CREAR USUARIO
# ============================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   VERIFICANDO CONEXION A MONGODB" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Detectar Node.js
$nodePath = "node"
if (Test-Path "node\node.exe") {
    $nodePath = "node\node.exe"
} else {
    try {
        $null = & node --version 2>&1
    } catch {
        Write-Host "ERROR: Node.js no instalado" -ForegroundColor Red
        Read-Host "`nPresiona Enter"
        exit 1
    }
}

# Iniciar servidor temporalmente
Write-Host "Iniciando servidor..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath $nodePath -ArgumentList "server.js" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 10

# Verificar conexión
try {
    $null = Invoke-RestMethod -Uri "http://localhost:$port/" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] Conexion a MongoDB exitosa!" -ForegroundColor Green
    $connectionOk = $true
} catch {
    Write-Host "[ERROR] No se pudo conectar a MongoDB" -ForegroundColor Red
    Write-Host "Verifica tu configuracion de MongoDB Atlas" -ForegroundColor Yellow
    $connectionOk = $false
}

# Crear usuario si hay conexión
if ($connectionOk) {
    Write-Host "`n============================================" -ForegroundColor Cyan
    Write-Host "   CREAR USUARIO ADMINISTRADOR" -ForegroundColor Cyan
    Write-Host "============================================`n" -ForegroundColor Cyan
    
    $createUser = Read-Host "Crear usuario administrador ahora? (s/n)"
    
    if ($createUser -eq 's' -or $createUser -eq 'S') {
        Write-Host "`nCreando usuario administrador..." -ForegroundColor Cyan
        Write-Host "Usando script createAdmin.js" -ForegroundColor Gray
        
        try {
            # Detener servidor temporal primero
            Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            
            # Ejecutar script de creación de admin
            $output = & $nodePath "scripts\createAdmin.js" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Usuario administrador creado!" -ForegroundColor Green
                Write-Host "`nCredenciales por defecto:" -ForegroundColor White
                Write-Host "  Email: admin@mecanet.com" -ForegroundColor Cyan
                Write-Host "  Contraseña: Admin123!" -ForegroundColor Cyan
                
                # Preguntar si desea crear usuario desarrollador
                Write-Host "`n" -NoNewline
                $createDev = Read-Host "Crear usuario desarrollador tambien? (s/n)"
                
                if ($createDev -eq 's' -or $createDev -eq 'S') {
                    Write-Host "`nCreando usuario desarrollador..." -ForegroundColor Cyan
                    $output = & $nodePath "scripts\createDeveloper.js" 2>&1
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "[OK] Usuario desarrollador creado!" -ForegroundColor Green
                        Write-Host "`nCredenciales desarrollador:" -ForegroundColor White
                        Write-Host "  Email: dev@mecanet.com" -ForegroundColor Cyan
                        Write-Host "  Contraseña: Dev123!" -ForegroundColor Cyan
                    } else {
                        Write-Host "[ADVERTENCIA] No se pudo crear usuario desarrollador" -ForegroundColor Yellow
                    }
                }
                
                Write-Host "`n⚠️  IMPORTANTE: Cambia las contraseñas tras el primer login" -ForegroundColor Yellow
                $serverProcess = $null
            } else {
                Write-Host "[ERROR] No se pudo crear el usuario" -ForegroundColor Red
                Write-Host "Podras crearlo desde la interfaz web" -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host "[ERROR] Error ejecutando createAdmin.js" -ForegroundColor Red
            Write-Host "Podras crear usuarios desde la interfaz web" -ForegroundColor Yellow
        }
    }
}

# Detener servidor si aún está corriendo
if ($serverProcess) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Crear marca de configuración
"Configurado el $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" | Out-File -FilePath $configFlag -Encoding UTF8

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "   CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "`nProximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Ejecuta INICIAR-MECANET.bat" -ForegroundColor White
Write-Host "  2. Abre http://localhost:$port" -ForegroundColor White
Write-Host "  3. Inicia sesion y comienza a usar MECANET!" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Cyan

Read-Host "Presiona Enter para continuar"
