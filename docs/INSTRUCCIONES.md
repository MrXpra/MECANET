# 📖 MECANET - Instrucciones de Uso

## 🎯 Guía Completa de Instalación, Configuración y Uso

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#-requisitos-previos)
2. [Instalación Inicial](#-instalación-inicial)
3. [Configuración para Nuevo Cliente](#-configuración-para-nuevo-cliente)
4. [Uso del Sistema](#-uso-del-sistema)
5. [Despliegue en Producción](#-despliegue-en-producción)
6. [Flujo de Trabajo Git](#-flujo-de-trabajo-git)
7. [Troubleshooting](#-troubleshooting)

---

## 💻 Requisitos Previos

### Software Necesario

| Software | Versión Mínima | Descarga |
|----------|----------------|----------|
| **Node.js** | 18.0.0+ | [nodejs.org](https://nodejs.org) |
| **MongoDB** | 6.0+ | [mongodb.com](https://mongodb.com) o MongoDB Atlas |
| **Git** | 2.0+ | [git-scm.com](https://git-scm.com) |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com) (recomendado) |

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version
# Debe mostrar v18.0.0 o superior

# Verificar NPM
npm --version
# Debe mostrar 9.0.0 o superior

# Verificar Git
git --version
# Debe mostrar 2.0.0 o superior
```

---

## ⚠️ Antes de Empezar - Importante

### Orden Correcto de Instalación:

```
1. Clonar repositorio
2. Instalar dependencias (backend + frontend)
3. ⚠️ Configurar MongoDB (crear cluster/base de datos)
4. ⚠️ Crear archivo .env con MONGODB_URI y JWT_SECRET
5. AHORA SÍ → Iniciar el servidor
```

**❌ Error común:** Intentar ejecutar `npm run dev` antes de configurar el `.env`

**Resultado:** 
```
❌ Error de conexión a MongoDB: The `uri` parameter to `openUri()` must be a string, got "undefined"
```

**✅ Checklist antes de iniciar:**
- [ ] Dependencias instaladas (backend y frontend)
- [ ] MongoDB configurado (Atlas o local)
- [ ] Archivo `.env` creado y configurado
- [ ] Variables `MONGODB_URI` y `JWT_SECRET` tienen valores reales

---

## 🚀 Instalación Inicial

### Paso 1: Clonar el Repositorio

```bash
# Opción A: Clonar desde GitHub
git clone https://github.com/MrXpra/SistemaGestorDeTallerMecanico.git
cd SistemaGestorDeTallerMecanico

# Opción B: Descargar ZIP
# Descarga el ZIP desde GitHub y descomprime
cd SistemaGestorDeTallerMecanico
```

### Paso 2: Instalar Dependencias del Backend

```bash
# En la raíz del proyecto
npm install
```

Este comando instalará todas las dependencias necesarias del servidor.

### Paso 3: Instalar Dependencias del Frontend

```bash
# Navegar a la carpeta del cliente
cd client

# Instalar dependencias
npm install

# Regresar a la raíz
cd ..
```

---

## ⚙️ Configuración (OBLIGATORIO)

**⚠️ No puedes iniciar el sistema sin completar estos pasos**

### Paso 4: Configurar MongoDB

Antes de iniciar el sistema, necesitas una base de datos MongoDB. Tienes dos opciones:

#### Opción A: MongoDB Atlas (Recomendado - Cloud)

1. Ve a [MongoDB Atlas](https://cloud.mongodb.com) y crea una cuenta gratuita
2. Crea un nuevo cluster (tier gratuito M0)
3. En "Database Access", crea un usuario con contraseña
4. En "Network Access", permite acceso desde cualquier IP (0.0.0.0/0) o tu IP específica
5. Click en "Connect" → "Connect your application"
6. Copia el connection string (se verá así):
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/autoparts_db
   ```

#### Opción B: MongoDB Local

```bash
# Instalar MongoDB Community Edition
# Sigue las instrucciones en: https://www.mongodb.com/docs/manual/installation/

# Tu connection string será:
mongodb://localhost:27017/autoparts_db
```

### Paso 5: Configurar Variables de Entorno

**⚠️ CRÍTICO: Sin este paso, el servidor NO arrancará**

Crea el archivo `.env` en la raíz del proyecto:

```bash
# En la raíz del proyecto (Windows PowerShell)
New-Item -Path .env -ItemType File

# O con CMD:
type nul > .env

# O en Linux/Mac:
touch .env
```
Edita el archivo `.env` con tu editor favorito y **reemplaza los valores** con tus propios datos:

```env
# ========================================
# CONFIGURACIÓN DE BASE DE DATOS (OBLIGATORIO)
# ========================================
# ⚠️ Reemplaza esto con tu connection string real de MongoDB Atlas
MONGODB_URI="mongodb+srv://usuario:password@cluster.mongodb.net/autoparts_db"

# ========================================
# CONFIGURACIÓN DE AUTENTICACIÓN (OBLIGATORIO)
# ========================================
# ⚠️ Genera una clave secreta única (mínimo 32 caracteres)
# Puedes usar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="tu_clave_secreta_super_segura_minimo_32_caracteres_12345"

# ========================================
# CONFIGURACIÓN DEL SERVIDOR
# ========================================
NODE_ENV="development"
PORT="5000"
```

> **💡 Nota:** La configuración de email SMTP se gestiona desde la interfaz del sistema en Configuración > Notificaciones.

**Verificar que el archivo .env esté configurado correctamente:**

```bash
# Windows PowerShell:
Get-Content .env

# CMD:
type .env

# Linux/Mac:
cat .env
```

Deberías ver tus variables con valores reales (no los valores de ejemplo).

---

## 🎬 Iniciar el Sistema

**✅ Checklist antes de iniciar:**
- [ ] Dependencias instaladas (backend y frontend)
- [ ] MongoDB configurado (Atlas o local)
- [ ] Archivo `.env` creado y configurado
- [ ] Variables `MONGODB_URI` y `JWT_SECRET` tienen valores reales

### Paso 6: Iniciar el Sistema

#### Opción A: Modo Desarrollo (Recomendado)

Abre **DOS terminales** separadas:

**Terminal 1 - Backend:**
```bash
# En la raíz del proyecto
npm run dev
```

Deberías ver:
```
[nodemon] starting `node server.js`
🚀 Servidor corriendo en puerto 5000
✅ MongoDB conectado exitosamente
```

❌ **Si ves un error como:**
```
❌ Error de conexión a MongoDB: The `uri` parameter to `openUri()` must be a string, got "undefined"
```
**Solución:** Verifica que el archivo `.env` existe y tiene la variable `MONGODB_URI` configurada correctamente.

**Terminal 2 - Frontend:**
```bash
# Navegar a la carpeta del cliente
cd client

# Iniciar frontend
npm run dev
```

Deberías ver:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

#### Opción B: Usar Tasks de VS Code

Si estás usando VS Code, puedes usar los tasks configurados:

1. Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
2. Escribe "Run Task"
3. Selecciona "Start Full Application"

Esto iniciará automáticamente backend y frontend.

#### Opción C: Modo Producción

```bash
# Build del frontend
cd client
npm run build
cd ..

# Iniciar servidor (sirve frontend desde backend)
npm start
```

### Paso 7: Crear Usuario Administrador

**⚠️ IMPORTANTE: Tu base de datos está vacía. Debes crear al menos un usuario para poder acceder al sistema.**

Tienes 3 opciones:

#### Opción A: Seed con Datos de Prueba (Recomendado para desarrollo/pruebas)

Crea usuarios de ejemplo + datos de prueba:

```bash
# Detén el servidor backend (Ctrl+C)

# Ejecuta el script de seed
npm run seed

# Reinicia el servidor
npm run dev
```

**Crea automáticamente:**
- ✅ Usuario administrador (admin@autoparts.com / admin123)
- ✅ Usuario cajero (cajero@autoparts.com / cajero123)
- ✅ 10 productos de ejemplo
- ✅ 3 clientes
- ✅ 2 proveedores
- ✅ Configuración inicial del negocio

#### Opción B: Setup para Cliente (Para instalación en producción)

Configuración personalizada sin datos de prueba:

```bash
# Detén el servidor backend (Ctrl+C)

# Ejecuta el script de setup
npm run setup-client

# Sigue las instrucciones interactivas
# Reinicia el servidor
npm run dev
```

**Te preguntará:**
- Datos del administrador (nombre, email, contraseña)
- Datos del negocio
- Configuración regional (moneda, impuestos, zona horaria)

#### Opción C: Solo Crear Admin (Mínimo necesario)

Crear solo el usuario administrador:

```bash
# Detén el servidor backend (Ctrl+C)

# Ejecuta el script
npm run create-admin

# Sigue las instrucciones
# Reinicia el servidor
npm run dev
```

**Crea:**
- ✅ 1 usuario administrador con tus datos
- Base de datos vacía (sin productos, clientes, etc.)

### 8. Acceder al Sistema

Abre tu navegador en:
```
http://localhost:3000
```

#### ✅ Escenario A: Si usaste `npm run seed`

**Credenciales de Prueba:**
- **Email:** admin@autoparts.com
- **Contraseña:** admin123

El sistema ya tiene datos de ejemplo:
- 👤 2 usuarios (admin y cajero)
- 📦 10 productos
- 👥 3 clientes
- 🏪 2 proveedores
- ⚙️ Configuración básica del negocio

#### ❌ Escenario B: Si NO usaste `npm run seed`

**Tu base de datos está vacía.** No tienes ningún usuario para hacer login.

**Solución - Opción 1: Ejecutar seed ahora**
```bash
# Detén el servidor backend (Ctrl+C en la terminal del backend)
npm run seed
# Reinicia el servidor
npm run dev
```
Luego usa las credenciales del Escenario A.

**Solución - Opción 2: Usar el script de setup para cliente**

Si prefieres configurar el sistema desde cero con tus propios datos:

```bash
# Detén el servidor backend (Ctrl+C)
npm run setup-client
```

Este script te preguntará:
- Nombre y email del administrador
- Contraseña del administrador
- Datos del negocio
- Configuración regional

Después de completar el script, usa las credenciales que creaste.

**Solución - Opción 3: Crear solo un usuario admin**

Si solo necesitas un usuario administrador sin datos de ejemplo:

```bash
# Detén el servidor backend (Ctrl+C)
npm run create-admin
```

Sigue las instrucciones para crear el usuario admin y luego usa esas credenciales.

---

## 🏢 Configuración para Nuevo Cliente

### ¿Cuándo Usar Este Proceso?

Usa el script de configuración cuando:
- ✅ Vas a vender el sistema a un nuevo cliente
- ✅ Necesitas una instalación limpia sin datos de prueba
- ✅ Quieres resetear completamente el sistema
- ✅ Estás configurando múltiples instancias del sistema

### Paso 3: Ejecutar Script de Inicialización

```bash
npm run setup-client
```

El script te preguntará:

#### **Datos del Administrador:**
```
Nombre completo del administrador: Juan Pérez
Email del administrador: juan@repuestosabc.com
Contraseña (min 6 caracteres): Admin2025!
```

#### **Datos del Negocio:**
```
Nombre del negocio: Repuestos ABC
Teléfono del negocio (opcional): +52 555 123 4567
Dirección del negocio (opcional): Av. Principal 123, CDMX
Email del negocio (opcional): contacto@repuestosabc.com
```

#### **Configuración Regional:**
```
Moneda (ej: USD, MXN, EUR) [USD]: MXN
Tasa de impuesto en % (ej: 16) [16]: 16
Zona horaria (ej: America/Mexico_City) [America/New_York]: America/Mexico_City
```

### Paso 4: Verificar Instalación

```bash
# Iniciar el servidor
npm run dev

# En otro terminal, iniciar frontend
cd client
npm run dev
```

Accede a `http://localhost:3000` y verifica:
- ✅ Login con las credenciales del administrador funciona
- ✅ Dashboard aparece vacío (sin ventas)
- ✅ Inventario vacío (sin productos)
- ✅ Sin clientes ni proveedores
- ✅ Configuración del negocio correcta

### Paso 5: Entregar al Cliente

Prepara un documento con:

```
═══════════════════════════════════════════════
  CREDENCIALES DE ACCESO - [Nombre del Negocio]
═══════════════════════════════════════════════

URL del Sistema:
  https://tu-dominio.com

Administrador:
  Email: [email del admin]
  Contraseña: [contraseña temporal]
  
Recomendaciones:
  1. Cambiar contraseña en el primer acceso
  2. Crear usuarios adicionales desde el panel
  3. Configurar datos del negocio en Configuración
  4. Agregar productos al inventario

Soporte:
  Email: soporte@tuempresa.com
  Teléfono: +XX XXX XXX XXXX
═══════════════════════════════════════════════
```

---

## 💼 Uso del Sistema

### Para Cajeros

#### 1. Iniciar Sesión

```
1. Abrir navegador en la URL del sistema
2. Ingresar email y contraseña
3. Click en "Iniciar Sesión"
```

#### 2. Abrir Caja (Inicio de Turno)

```
1. Ir a "Cierre de Caja"
2. Click en "Abrir Caja"
3. Ingresar monto inicial de efectivo
4. Click en "Abrir"
```

#### 3. Realizar una Venta

```
1. Ir a "Facturación"
2. Buscar producto (por código o nombre)
3. Click en el producto para agregarlo
4. Ajustar cantidad si es necesario
5. Repetir para más productos
6. (Opcional) Seleccionar cliente
7. Aplicar descuento si aplica
8. Click en "Procesar Venta"
9. Seleccionar forma de pago
10. Ingresar monto recibido (si es efectivo)
11. Click en "Confirmar Venta"
12. Imprimir ticket
```

#### 4. Consultar Ventas

```
1. Ir a "Historial de Ventas"
2. Usar filtros si es necesario:
   - Por fecha
   - Por cliente
   - Por vendedor
3. Click en una venta para ver detalles
4. Reimprimir ticket si es necesario
```

#### 5. Cerrar Caja (Fin de Turno)

```
1. Ir a "Cierre de Caja"
2. Ver resumen del turno
3. Click en "Cerrar Caja"
4. Ingresar monto real de efectivo
5. Ver diferencias (si las hay)
6. Click en "Confirmar Cierre"
7. Imprimir reporte de cierre
```

### Para Administradores

#### 1. Gestionar Inventario

**Agregar Producto:**
```
1. Ir a "Inventario"
2. Click en "Nuevo Producto"
3. Llenar formulario:
   - Nombre
   - Categoría
   - Precio de costo
   - Precio de venta (se calcula margen automáticamente)
   - Stock inicial
   - Stock mínimo
   - Proveedor
   - Descripción
4. (Opcional) Subir imagen
5. Click en "Guardar"
```

**Editar Producto:**
```
1. Ir a "Inventario"
2. Buscar el producto
3. Click en ícono de editar (lápiz)
4. Modificar campos necesarios
5. Click en "Actualizar"
```

**Ver Alertas de Stock:**
```
1. Ir a "Inventario"
2. Filtrar por "Stock Bajo"
3. Ver productos que necesitan reabastecimiento
4. Crear orden de compra si es necesario
```

#### 2. Gestionar Clientes

**Agregar Cliente:**
```
1. Ir a "Clientes"
2. Click en "Nuevo Cliente"
3. Llenar formulario:
   - Nombre completo
   - Email
   - Teléfono
   - Dirección
   - RFC/NIT (opcional)
4. Click en "Guardar"
```

**Ver Historial de Cliente:**
```
1. Ir a "Clientes"
2. Buscar cliente
3. Click en el cliente
4. Ver:
   - Total gastado
   - Número de compras
   - Ticket promedio
   - Última compra
   - Historial completo de compras
```

#### 3. Gestionar Proveedores

**Agregar Proveedor:**
```
1. Ir a "Proveedores"
2. Click en "Nuevo Proveedor"
3. Llenar formulario:
   - Nombre comercial
   - Contacto principal
   - Email
   - Teléfono
   - Dirección
   - Productos que suministra
4. Click en "Guardar"
```

#### 4. Crear Orden de Compra

```
1. Ir a "Órdenes de Compra"
2. Click en "Nueva Orden"
3. Seleccionar proveedor
4. Agregar productos:
   - Buscar producto
   - Ingresar cantidad
   - Precio de compra se auto-completa
5. Repetir para más productos
6. Ver total calculado
7. Click en "Guardar Orden"
8. Estado: Pendiente
```

**Recibir Mercancía:**
```
1. Ir a "Órdenes de Compra"
2. Buscar la orden pendiente
3. Click en "Recibir"
4. Inventario se actualiza automáticamente
5. Estado cambia a: Recibida
```

#### 5. Aprobar Retiros de Caja

```
1. Cajero intenta hacer un retiro
2. Sistema solicita contraseña de admin
3. Admin ingresa su contraseña
4. Retiro se registra
5. Se descuenta del efectivo en caja
```

#### 6. Ver Reportes

**Dashboard:**
```
1. Ir a Dashboard
2. Ver KPIs:
   - Ventas del día
   - Ventas del mes
   - Ticket promedio
   - Productos vendidos
3. Ver gráficos:
   - Ventas por día (últimos 7 días)
   - Productos más vendidos (top 5)
```

**Reportes Detallados:**
```
1. Ir a "Reportes"
2. Seleccionar tipo de reporte:
   - Ventas
   - Inventario
   - Clientes
   - Proveedores
3. Seleccionar periodo
4. Click en "Generar"
5. Ver reporte
6. Exportar a Excel/PDF
```

#### 7. Revisar Auditoría

```
1. Ir a "Auditoría"
2. Ver todas las acciones de usuarios
3. Filtrar por:
   - Usuario específico
   - Módulo (ventas, productos, etc.)
   - Acción (crear, editar, eliminar)
   - Rango de fechas
4. Click en registro para ver detalles
5. Ver datos antes y después del cambio
```

#### 8. Configurar Sistema

**Datos del Negocio:**
```
1. Ir a "Configuración" → "Negocio"
2. Editar:
   - Nombre del negocio
   - Logo
   - Datos de contacto
   - Redes sociales
3. Click en "Guardar"
```

**Configuración Regional:**
```
1. Ir a "Configuración" → "Sistema"
2. Editar:
   - Moneda
   - Zona horaria
   - Formato de fecha
   - Idioma
3. Click en "Guardar"
```

**Facturación:**
```
1. Ir a "Configuración" → "Facturación"
2. Editar:
   - Tasa de impuesto
   - Prefijo de factura
   - Mensaje en ticket
3. Click en "Guardar"
```

---

## 🌐 Despliegue en Producción

### Opción 1: Vercel (Frontend) + Railway (Backend)

#### A. Desplegar Frontend en Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Navegar a la carpeta del cliente
cd client

# 3. Build del frontend
npm run build

# 4. Desplegar
vercel --prod

# 5. Seguir instrucciones en pantalla
#    - Login con GitHub
#    - Confirmar proyecto
#    - Esperar deployment
```

**Resultado:** Tu frontend estará en `https://tu-proyecto.vercel.app`

#### B. Desplegar Backend en Railway

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login en Railway
railway login

# 3. Inicializar proyecto
railway init

# 4. Configurar variables de entorno
railway variables set MONGODB_URI="tu-connection-string"
railway variables set JWT_SECRET="tu-jwt-secret"
railway variables set NODE_ENV="production"

# 5. Desplegar
railway up

# 6. Obtener URL
railway domain
```

**Resultado:** Tu backend estará en `https://tu-proyecto.railway.app`

#### C. Conectar Frontend con Backend

1. Edita `client/src/services/api.js`:
```javascript
const API_URL = import.meta.env.PROD 
  ? 'https://tu-backend.railway.app/api'
  : 'http://localhost:5000/api';
```

2. Redeploy frontend:
```bash
cd client
vercel --prod
```

### Opción 2: VPS (Servidor Propio)

#### Requisitos del Servidor
- Ubuntu 20.04+ / Debian 11+
- 2GB RAM mínimo
- 20GB disco
- Node.js 18+
- Nginx (para reverse proxy)

#### Pasos

1. **Conectar al servidor:**
```bash
ssh usuario@tu-servidor.com
```

2. **Instalar dependencias:**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx
```

3. **Clonar proyecto:**
```bash
cd /var/www
sudo git clone https://github.com/tu-usuario/autoparts.git
cd autoparts
```

4. **Configurar:**
```bash
# Instalar dependencias
npm install
cd client && npm install && npm run build && cd ..

# Crear .env
sudo nano .env
# (Pegar configuración de producción)
```

5. **Iniciar con PM2:**
```bash
pm2 start server.js --name autoparts
pm2 save
pm2 startup
```

6. **Configurar Nginx:**
```bash
sudo nano /etc/nginx/sites-available/autoparts
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/autoparts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **SSL con Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## 🌿 Flujo de Trabajo Git

### Trabajo Diario

```bash
# 1. Asegúrate de estar en develop
git checkout develop

# 2. Actualiza tu rama
git pull origin develop

# 3. Haz cambios en el código
# ... editar archivos ...

# 4. Ver cambios
git status
git diff

# 5. Agregar cambios
git add .

# 6. Commit con mensaje descriptivo
git commit -m "feat: agregar funcionalidad X"

# 7. Subir cambios
git push origin develop
```

### Publicar Nueva Versión

```bash
# Para correcciones de bugs (1.0.0 → 1.0.1)
npm run release:patch

# Para nuevas funcionalidades (1.0.0 → 1.1.0)
npm run release:minor

# Para cambios importantes (1.0.0 → 2.0.0)
npm run release:major
```

El script automáticamente:
1. Fusiona `develop` → `main`
2. Crea tag de versión
3. Sube todo a GitHub
4. Te regresa a `develop`

### Comandos Útiles

```bash
# Ver historial
git log --oneline --graph --all

# Ver versiones
git tag -l

# Ver cambios de una versión
git show v1.0.0

# Cambiar de rama
git checkout main      # Ver producción
git checkout develop   # Volver a desarrollo
```

---

## 🔧 Troubleshooting

### ❌ Problema 1: "The uri parameter must be a string, got undefined"

**Este es el error MÁS COMÚN**

**Síntoma completo:**
```
❌ Error de conexión a MongoDB: The `uri` parameter to `openUri()` must be a string, got "undefined". 
Make sure the first parameter to `mongoose.connect()` or `mongoose.createConnection()` is a string.
[nodemon] app crashed - waiting for file changes before starting...
```

**Causa:** El archivo `.env` no existe o la variable `MONGODB_URI` no está configurada.

**Soluciones (en orden):**

1. **Verificar que el archivo .env existe:**
   ```bash
   # Windows PowerShell
   Test-Path .env
   # Debe devolver: True
   
   # Si devuelve False, crear el archivo:
   New-Item -Path .env -ItemType File
   ```

2. **Verificar contenido del .env:**
   ```bash
   # Windows PowerShell
   Get-Content .env
   
   # CMD
   type .env
   ```
   
   Debe contener AL MENOS:
   ```env
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/autoparts_db
   JWT_SECRET=tu_clave_secreta_minimo_32_caracteres
   ```

3. **Verificar que MONGODB_URI tiene un valor válido:**
   - ❌ Incorrecto: `MONGODB_URI=` (vacío)
   - ❌ Incorrecto: `MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/autoparts_db` (con los valores de ejemplo)
   - ✅ Correcto: `MONGODB_URI=mongodb+srv://miusuario:mipassword123@cluster0.abc12.mongodb.net/autoparts_db` (con tus credenciales reales)

4. **Reiniciar el servidor después de editar .env:**
   ```bash
   # En la terminal donde corre npm run dev
   # Presiona Ctrl+C para detener
   # Luego ejecuta de nuevo:
   npm run dev
   ```

### ❌ Problema 2: Error al conectar con MongoDB

**Síntoma:**
```
Error: connect ECONNREFUSED
```

**Soluciones:**
1. Verifica que `MONGODB_URI` en `.env` sea correcto (sin espacios)
2. Si usas MongoDB Atlas:
   - Verifica que el cluster esté activo
   - Verifica IP Whitelist (permite 0.0.0.0/0 o tu IP)
   - Verifica usuario y contraseña de BD (sin caracteres especiales problemáticos)
3. Si usas MongoDB local:
   - Verifica que MongoDB esté corriendo: `mongod --version`

### ❌ Problema 3: Puerto 5000 ya en uso

**Síntoma:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Soluciones:**
```bash
# Opción 1: Cambiar puerto en .env
PORT=5001

# Opción 2: Matar proceso en el puerto
# Windows
netstat -ano | findstr :5000
taskkill /PID [número] /F

# Linux/Mac
lsof -i :5000
kill -9 [PID]
```

### ❌ Problema 4: Módulos no encontrados

**Síntoma:**
```
Error: Cannot find module 'express'
```

**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Y en el cliente
cd client
rm -rf node_modules package-lock.json
npm install
```

### ❌ Problema 5: Frontend no se conecta al Backend

**Síntomas:**
- Errores de CORS
- Peticiones fallidas

**Soluciones:**
1. Verifica que backend esté corriendo en `http://localhost:5000`
2. Verifica CORS en `server.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```
3. Verifica `API_URL` en `client/src/services/api.js`

### ❌ Problema 6: No puedo hacer login / "Invalid credentials"

**Síntomas:**
- Mensaje "Invalid credentials"
- No se puede iniciar sesión
- Página de login sin usuarios

**Causas comunes:**
1. **No creaste ningún usuario** (base de datos vacía)
2. Email o contraseña incorrectos
3. JWT_SECRET no configurado

**Soluciones (en orden):**

**1. Verificar si tienes usuarios en la base de datos:**

Si acabas de instalar el sistema y NO ejecutaste ningún script (`seed`, `setup-client` o `create-admin`), tu base de datos está vacía y NO TIENES USUARIOS.

**2. Crear usuario administrador:**

Elige una opción:

```bash
# Opción A: Con datos de prueba (desarrollo)
npm run seed
# Usuario: admin@autoparts.com / admin123

# Opción B: Configuración personalizada (producción)
npm run setup-client
# Sigue las instrucciones interactivas

# Opción C: Solo crear admin (mínimo)
npm run create-admin
# Sigue las instrucciones
```

**3. Verificar JWT_SECRET:**

Asegúrate de que `.env` tiene:
```env
JWT_SECRET=tu_clave_secreta_minimo_32_caracteres
```

**4. Reiniciar servidor después de crear usuario:**
```bash
# Ctrl+C para detener
npm run dev
```

### ❌ Problema 7: Productos no aparecen

**Síntomas:**
- Inventario vacío después de agregar productos

**Soluciones:**
1. Verifica consola del navegador (F12)
2. Verifica que el backend esté respondiendo:
```bash
curl http://localhost:5000/api/products
```
3. Verifica token de autenticación en localStorage
4. Cierra sesión y vuelve a entrar

### ❌ Problema 8: Script setup-client falla

**Síntomas:**
- Error durante la inicialización

**Soluciones:**
1. Verifica conexión a MongoDB
2. Verifica que todas las dependencias estén instaladas
3. Ejecuta con más información:
```bash
NODE_ENV=development node scripts/setupNewClient.js
```

---

## 📞 Soporte

### Recursos

- **Repositorio GitHub:** https://github.com/MrXpra/SistemaGestorDeTallerMecanico
- **Documentación:** `/docs` folder
- **Issues:** GitHub Issues

### Contacto

Para soporte técnico o consultas:
- **Email:** [tu-email]
- **GitHub:** @MrXpra

---

## 📚 Scripts NPM Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Iniciar en producción |
| `npm run dev` | Iniciar en desarrollo (con nodemon) |
| `npm run seed` | Poblar BD con datos de prueba |
| `npm run setup-client` | Configurar para nuevo cliente |
| `npm run create-admin` | Crear usuario admin |
| `npm run reset-db` | Resetear base de datos |
| `npm run release:patch` | Publicar versión patch (x.x.X) |
| `npm run release:minor` | Publicar versión minor (x.X.0) |
| `npm run release:major` | Publicar versión major (X.0.0) |

---

## ✅ Checklist de Implementación

### Para Desarrollo Local
- [ ] Node.js 18+ instalado
- [ ] MongoDB Atlas configurado
- [ ] .env creado y configurado
- [ ] Dependencias instaladas (backend + frontend)
- [ ] **Usuario administrador creado** (seed, setup-client o create-admin)
- [ ] Backend corriendo en puerto 5000
- [ ] Frontend corriendo en puerto 3000
- [ ] Login exitoso con las credenciales creadas

### Para Nuevo Cliente
- [ ] Cluster MongoDB creado
- [ ] Connection string obtenido
- [ ] .env configurado con datos del cliente
- [ ] `npm run setup-client` ejecutado
- [ ] Usuario admin creado
- [ ] Configuración del negocio completada
- [ ] Credenciales documentadas y guardadas
- [ ] Sistema probado y funcionando

### Para Producción
- [ ] Frontend desplegado en Vercel
- [ ] Backend desplegado en Railway/VPS
- [ ] Base de datos en MongoDB Atlas
- [ ] Variables de entorno configuradas
- [ ] SSL/HTTPS activo
- [ ] DNS configurado
- [ ] Backups automáticos activados
- [ ] Monitoreo configurado
- [ ] Cliente capacitado

---

**Versión:** 1.0.0  
**Última Actualización:** Octubre 2025  
**Estado:** Completo y probado
