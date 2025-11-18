# 🚗 MECANET - Sistema POS

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Sistema de Punto de Venta (POS) moderno y completo para tiendas de repuestos automotrices, desarrollado con tecnologías de vanguardia y diseño minimalista con efectos glassmorphism.

[🚀 Demo](#) | [📖 Documentación](./docs/) | [🐛 Reportar Bug](https://github.com/MrXpra/SistemaGestorDeTallerMecanico/issues)

</div>

---

## ⚡ Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/MrXpra/SistemaGestorDeTallerMecanico.git
cd SistemaGestorDeTallerMecanico

# 2. Instalar dependencias backend
npm install

# 3. Instalar dependencias frontend
cd client
npm install
cd ..

# 4. Configurar el sistema (REQUERIDO)
npm run setup

# 5. Inicializar base de datos
npm run create-admin  # o npm run seed

# 6. Iniciar servidores
npm run dev           # Terminal 1: Backend
cd client && npm run dev  # Terminal 2: Frontend
```

> 📚 Para más detalles, consulta la [Guía de Instalación Completa](#-instalación)

### 🔄 Flujo de Instalación

```
┌─────────────────────────────────────────────────────────────┐
│  1. npm install (raíz)                                      │
│     └─ Instala dependencias del backend                    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  2. cd client && npm install                                │
│     └─ Instala dependencias del frontend                   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  3. npm run setup  ⭐ REQUERIDO                             │
│     └─ Configura MongoDB URI                               │
│     └─ Genera JWT_SECRET automáticamente                   │
│     └─ Crea archivo .env                                   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  4. npm run create-admin / npm run seed                     │
│     └─ Inicializa base de datos                            │
│     └─ Crea usuario(s) del sistema                         │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  5. npm run dev (backend) + cd client && npm run dev        │
│     └─ Backend: http://localhost:5000                      │
│     └─ Frontend: http://localhost:5173                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Tabla de Contenidos

- [Inicio Rápido](#-inicio-rápido)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Flujo de Trabajo Git](#-flujo-de-trabajo-git)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Despliegue](#-despliegue)

---

## ✨ Características

### 🎨 Diseño Moderno
- **Glassmorphism**: Efectos de vidrio esmerilado con backdrop-blur
- **Modo Oscuro**: Toggle para alternar entre tema claro y oscuro
- **Animaciones Suaves**: Microinteracciones y transiciones fluidas
- **Responsive**: Diseño adaptable a todos los dispositivos
- **Tipografía Inter**: Fuente moderna y legible
- **🕐 Reloj en Tiempo Real**: Muestra hora y fecha actualizada cada segundo
- **🌤️ Widget de Clima**: Temperatura, condiciones climáticas y pronóstico diario

### 🔐 Autenticación y Autorización
- Sistema de login con JWT
- Roles de usuario (Admin y Cajero)
- Rutas protegidas según rol
- Sesión persistente

### 📊 Dashboard Interactivo
- KPIs de ventas en tiempo real
- Gráficos de ventas por día
- Productos más vendidos
- Alertas de bajo stock
- Análisis por método de pago

### 🛒 Módulo de Facturación
- Búsqueda rápida de productos (SKU/Nombre)
- Soporte para lector de código de barras
- Carrito de compras interactivo
- Aplicación de descuentos
- Asociación de clientes
- Generación automática de factura
- Impresión optimizada para impresora térmica

### 📦 Gestión de Inventario
- CRUD completo de productos
- Búsqueda y filtros avanzados
- Control de stock automático
- Alertas de bajo inventario
- Categorías y marcas

### 👥 Gestión de Clientes
- Base de datos de clientes
- Historial de compras por cliente
- Asociación de ventas a clientes
- CRUD completo

### 💰 Cierre de Caja
- Resumen de ventas del cajero
- Totales por método de pago
- Ventas del día actual

### 🔧 Panel de Administración
- Gestión de usuarios del sistema
- Configuración del negocio
- Reportes y exportaciones
- Estadísticas avanzadas

---

## 🛠 Tecnologías

### Backend
- **Node.js** v18+ - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación basada en tokens
- **bcryptjs** - Encriptación de contraseñas

### Frontend
- **React 18** - Librería de UI
- **Vite** - Build tool y dev server
- **Zustand** - Manejo de estado global
- **React Router** - Enrutamiento SPA
- **Tailwind CSS** - Framework de estilos
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos
- **React Hot Toast** - Notificaciones

---

## 📋 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** o **yarn**
- **MongoDB Atlas** (cuenta gratuita) o MongoDB local
- Git (opcional)

---

## 🚀 Instalación

> ⚠️ **IMPORTANTE**: Sigue los pasos en orden. El paso 3 (`npm run setup`) es **obligatorio** antes de iniciar el servidor.

### 1. Clonar el repositorio

```bash
git clone https://github.com/MrXpra/SistemaGestorDeTallerMecanico.git
cd SistemaGestorDeTallerMecanico
```

### 2. Instalar dependencias

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd client
npm install
cd ..
```

> � **Nota**: Necesitas instalar ambos (backend y frontend) para que el sistema funcione completamente.

### 3. Configurar el Sistema (Requerido)

**Ejecuta el asistente de configuración interactivo:**

```bash
npm run setup
```

El asistente te guiará paso a paso en la configuración de:
- ✅ MongoDB URI (conexión a tu base de datos)
- ✅ JWT Secret (se genera automáticamente de forma segura)
- ✅ Puerto del servidor (por defecto: 5000)
- ✅ Variables de entorno necesarias
- ✅ Creación automática del archivo `.env`

> ⚠️ **IMPORTANTE**: Este paso es **obligatorio** antes de iniciar el servidor. Sin el archivo `.env` configurado, el sistema no funcionará.

**Alternativa - Configuración manual:**

Si prefieres configurar manualmente, genera un JWT seguro y crea el `.env`:

```bash
npm run generate-jwt
# Luego crea manualmente el archivo .env con las variables necesarias
```

---

## 4. Inicializar la Base de Datos

#### Opción A: Crear solo usuario administrador (Recomendado para producción)

```bash
npm run create-admin
```

Este comando creará:
- ✅ Usuario administrador con credenciales personalizadas
- ✅ Configuración inicial del negocio

**⚠️ IMPORTANTE:** El script te pedirá crear una contraseña segura.

#### Opción B: Poblar con datos de ejemplo (Para desarrollo/pruebas)

```bash
npm run seed
```

Este comando creará:
- ✅ Usuario administrador (admin@autoparts.com / Admin123!)
- ✅ Usuario cajero (cajero@autoparts.com / Cajero123!)
- ✅ Configuración inicial del negocio
- ✅ Proveedores de ejemplo
- ✅ 10 productos de ejemplo

---

## 🎯 Uso

### Desarrollo

Necesitas ejecutar backend y frontend en terminales separadas:

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

- Backend estará en `http://localhost:5000`
- Frontend estará en `http://localhost:5173` (Vite)
- El frontend se conecta al backend mediante proxy

### Producción

#### 1. Build del frontend

```bash
cd client
npm run build
cd ..
```

#### 2. Servir la aplicación

```bash
NODE_ENV=production npm start
```

La aplicación completa estará disponible en `http://localhost:5000`

---

## 🌿 Flujo de Trabajo Git

Este proyecto utiliza un flujo de trabajo profesional basado en ramas:

### Ramas Principales

- **`main`** 🔒 - Versión de producción (solo código estable y etiquetado)
- **`develop`** 🛠️ - Rama de desarrollo (todo el trabajo nuevo va aquí)

### Trabajo Diario

```bash
# 1. Asegúrate de estar en develop
git checkout develop

# 2. Actualiza tu rama
git pull origin develop

# 3. Haz tus cambios y commitea
git add .
git commit -m "feat: descripción del cambio"

# 4. Sube tus cambios
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

📚 **Documentación completa**: [docs/GIT_WORKFLOW.md](./docs/GIT_WORKFLOW.md)  
📝 **Guía rápida**: [docs/QUICK_GIT_GUIDE.md](./docs/QUICK_GIT_GUIDE.md)

---

## 📁 Estructura del Proyecto

```
autoparts-manager/
├── client/                    # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   └── Layout/       # Layout (Sidebar, TopBar)
│   │   ├── pages/            # Páginas de la aplicación
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Billing.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/         # Servicios API
│   │   │   └── api.js
│   │   ├── store/            # Estado global (Zustand)
│   │   │   ├── authStore.js
│   │   │   ├── themeStore.js
│   │   │   └── cartStore.js
│   │   ├── App.jsx           # Componente principal
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Estilos globales
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── config/                   # Configuraciones
│   └── db.js                # Conexión a MongoDB
│
├── controllers/              # Controladores
│   ├── authController.js
│   ├── productController.js
│   ├── saleController.js
│   ├── customerController.js
│   ├── userController.js
│   ├── settingsController.js
│   └── dashboardController.js
│
├── middleware/               # Middlewares
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── validationMiddleware.js
│
├── models/                   # Modelos de Mongoose
│   ├── User.js
│   ├── Product.js
│   ├── Sale.js
│   ├── Customer.js
│   └── Settings.js
│
├── routes/                   # Rutas de la API
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── saleRoutes.js
│   ├── customerRoutes.js
│   ├── userRoutes.js
│   ├── settingsRoutes.js
│   └── dashboardRoutes.js
│
├── scripts/                  # Scripts de utilidad
│   └── seed.js              # Seeding de la base de datos
│
├── .env                      # Variables de entorno
├── .gitignore
├── server.js                 # Servidor Express
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario
- `PUT /api/auth/profile` - Actualizar perfil

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto por ID
- `GET /api/products/sku/:sku` - Buscar por SKU
- `POST /api/products` - Crear producto (Admin)
- `PUT /api/products/:id` - Actualizar producto (Admin)
- `DELETE /api/products/:id` - Eliminar producto (Admin)
- `GET /api/products/categories/list` - Listar categorías
- `GET /api/products/brands/list` - Listar marcas

### Ventas
- `GET /api/sales` - Listar ventas
- `GET /api/sales/:id` - Obtener venta por ID
- `POST /api/sales` - Crear venta
- `GET /api/sales/user/me` - Ventas del usuario actual
- `PUT /api/sales/:id/cancel` - Cancelar venta (Admin)

### Clientes
- `GET /api/customers` - Listar clientes
- `GET /api/customers/:id` - Obtener cliente
- `POST /api/customers` - Crear cliente
- `PUT /api/customers/:id` - Actualizar cliente
- `DELETE /api/customers/:id` - Eliminar cliente (Admin)
- `GET /api/customers/:id/purchases` - Historial de compras

### Usuarios
- `GET /api/users` - Listar usuarios (Admin)
- `GET /api/users/:id` - Obtener usuario (Admin)
- `POST /api/users` - Crear usuario (Admin)
- `PUT /api/users/:id` - Actualizar usuario (Admin)
- `DELETE /api/users/:id` - Eliminar usuario (Admin)

### Configuración
- `GET /api/settings` - Obtener configuración
- `PUT /api/settings` - Actualizar configuración (Admin)

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/sales-by-day` - Ventas por día
- `GET /api/dashboard/top-products` - Productos más vendidos
- `GET /api/dashboard/sales-by-payment` - Ventas por método de pago

---

## 🌐 Despliegue

### 🚂 Railway + Vercel (Recomendado)

El proyecto está **100% listo** para desplegar en Railway (backend) + Vercel (frontend).

**📖 Guía Completa:** Ver [docs/DEPLOY-RAILWAY.md](./docs/DEPLOY-RAILWAY.md)

**Resumen Rápido:**

1. **Backend en Railway:**
   ```bash
   # Railway detecta automáticamente railway.toml
   - New Project → Deploy from GitHub
   - Configurar variables de entorno
   - Deploy automático
   ```

2. **Frontend en Vercel:**
   ```bash
   # Vercel para el cliente React
   - New Project → Root Directory: client
   - Framework: Vite
   - Deploy
   ```

3. **Base de Datos:**
   - MongoDB Atlas (tier gratuito M0 - 512 MB)

**💰 Costo Total:** ~$0-5/mes (Railway incluye $5 crédito mensual)

---

### 🖥️ Instalación Local para Clientes

Si prefieres que tu cliente ejecute el sistema en su computadora local:

**Ventajas:**
- ✅ Sin costos de hosting
- ✅ Control total del sistema
- ✅ Datos seguros en MongoDB Atlas (nube)
- ✅ No depende de conexión a internet (excepto para BD)

**Cómo hacerlo:**
1. Cliente instala Node.js
2. Descomprime carpeta del proyecto
3. Ejecuta script de configuración inicial
4. Usa scripts `.bat` para iniciar/detener sistema

Ver documentación completa en [docs/INSTALACION-CLIENTE.md](./docs/INSTALACION-CLIENTE.md)

---

### 🔐 Variables de Entorno en Producción

**Railway (Backend):**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=super-secret-min-32-chars
CLIENT_URL=https://tu-frontend.vercel.app
PORT=5000
```

**Vercel (Frontend):**
```env
VITE_API_URL=https://tu-backend.railway.app/api
```

---

### 📊 Opciones de Hosting Comparadas

| Opción | Backend | Frontend | BD | Costo/mes |
|--------|---------|----------|-----|-----------|
| **Railway + Vercel** | Railway | Vercel | Atlas | $0-5 |
| **Render** | Render | Render | Atlas | $0-14 |
| **VPS (DigitalOcean)** | Droplet | Droplet | Atlas | $6+ |
| **Local** | PC Cliente | PC Cliente | Atlas | $0 |

**Recomendación:** Railway + Vercel para 1-5 clientes, VPS para 10+ clientes

---

## 👥 Credenciales de Acceso

Después de ejecutar `npm run seed`:

**Administrador:**
- Email: `admin@autoparts.com`
- Contraseña: `Admin123!`

**Cajero:**
- Email: `cajero@autoparts.com`
- Contraseña: `Cajero123!`

---

## 📝 Scripts Disponibles

```bash
# 🔧 Configuración Inicial (Ejecutar después de npm install)
npm run setup          # ⭐ Asistente interactivo de configuración (.env + JWT)
npm run generate-jwt   # Generar JWT_SECRET seguro (alternativa manual)

# 🚀 Backend
npm start              # Iniciar servidor en producción
npm run dev            # Iniciar servidor en desarrollo con nodemon
npm run create-admin   # Crear usuario administrador (después de setup)
npm run seed           # Poblar base de datos con datos de ejemplo

# 🏢 Configuración para Nuevos Clientes
npm run setup-client   # Configurar para un nuevo cliente (BD limpia)

# Frontend (dentro de /client)
npm run dev            # Iniciar dev server de Vite
npm run build          # Build para producción
npm run preview        # Preview del build

# Proyecto completo
npm run build          # Instalar dependencias y build completo

# Git & Versioning
npm run release:patch  # Publicar versión de corrección (x.x.X)
npm run release:minor  # Publicar versión con nuevas features (x.X.0)
npm run release:major  # Publicar versión con cambios importantes (X.0.0)
```

### 🏢 Configuración para Nuevos Clientes

Si vas a vender/instalar el sistema para un nuevo cliente:

```bash
npm run setup-client
```

Este script:
- ✅ Limpia completamente la base de datos
- ✅ Crea un usuario administrador personalizado
- ✅ Configura datos del negocio
- ✅ Inicializa todas las colecciones vacías
- ✅ Sin datos de prueba (base de datos limpia)

---

## 🎨 Características de Diseño

### Glassmorphism
Los elementos utilizan efectos de vidrio esmerilado con:
- `backdrop-filter: blur(16px)`
- Fondos semi-transparentes
- Bordes sutiles

### Modo Oscuro
Implementado con Tailwind CSS usando la clase `dark:`
- Persistente con localStorage
- Toggle en la TopBar
- Transiciones suaves

### Animaciones
- Fade in / Slide in / Scale in
- Hover effects con elevación
- Active states con scale
- Smooth transitions

---

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Autenticación JWT
- ✅ Rutas protegidas por middleware
- ✅ Validación de datos en backend
- ✅ Sanitización de entradas
- ✅ CORS configurado
- ✅ Variables de entorno para secretos

---

## 🐛 Solución de Problemas

### El servidor no inicia
- Verifica que MongoDB esté conectado
- Comprueba las variables de entorno en `.env`
- Asegúrate de que el puerto 5000 esté libre

### Error de conexión a MongoDB
- Verifica la URL de conexión en `.env`
- Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas
- Comprueba tus credenciales de MongoDB

### El frontend no se conecta al backend
- Verifica que ambos servidores estén corriendo
- Comprueba la configuración del proxy en `vite.config.js`
- Revisa la consola del navegador para errores

### Bucle infinito al cargar / Problemas con caché al reinstalar

Si experimentas un bucle de carga después de reinstalar el sistema o cambiar la base de datos, es porque el navegador mantiene tokens y datos antiguos en localStorage. **Soluciones:**

#### Opción 1: Página de Limpieza Automática (Recomendado)
Accede a la página de limpieza de caché:
```
http://localhost:5173/clear-storage.html
```
Esta página limpiará automáticamente todo el localStorage y te redirigirá al login.

#### Opción 2: Limpieza Manual
1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña "Console"
3. Ejecuta:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

#### Opción 3: Validación Automática
El sistema ahora incluye validación automática de tokens al iniciar. Si detecta un token inválido:
- Limpia automáticamente el localStorage
- Te redirige al login
- Muestra un mensaje de "Verificando sesión..."

**⚠️ Nota para desarrollo:** Si estás reinstalando el sistema frecuentemente, usa siempre la página de limpieza o limpia el localStorage antes de volver a iniciar sesión.

---

## 📧 Contacto y Soporte

Para preguntas, sugerencias o reportes de bugs, puedes crear un issue en el repositorio.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

<div align="center">

**Hecho con ❤️ para talleres mecánicos y tiendas de repuestos**

⭐ Si te gusta este proyecto, considera darle una estrella en GitHub

</div>
