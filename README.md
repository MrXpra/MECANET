# 🚀 MECANET

Sistema completo de Punto de Venta (POS) para talleres mecánicos y tiendas de autopartes. Fácil de instalar y usar, funciona tanto en local como en la nube.

## ✨ Características

- 💰 **Punto de Venta** rápido e intuitivo
- 📦 **Control de Inventario** en tiempo real
- 👥 **Gestión de Clientes** y proveedores
- 📊 **Reportes** y estadísticas
- 🔐 **Sistema de usuarios** con roles
- 💳 **Múltiples métodos de pago**
- 🧾 **Impresión de tickets**
- 🔄 **Actualizaciones automáticas** (instalación local)

## 🛠️ Tecnologías

**Backend:** Node.js + Express + MongoDB  
**Frontend:** React + Vite + Tailwind CSS

---

## 📥 Instalación Local (Windows)

### Opción A: Instalación Rápida (Recomendada)

1. **Descarga** el ZIP más reciente desde [Releases](https://github.com/MrXpra/MECANET/releases)
2. **Extrae** el contenido en tu carpeta preferida
3. **Ejecuta** `CONFIGURAR-INICIAL.bat`
4. Sigue las instrucciones en pantalla
5. ¡Listo! El sistema se abrirá automáticamente

### Opción B: Desde el código fuente

```bash
# 1. Clonar repositorio
git clone https://github.com/MrXpra/MECANET.git
cd MECANET

# 2. Instalar dependencias
npm install
cd client && npm install && cd ..

# 3. Configurar base de datos
# Crea un archivo .env en la raíz con:
MONGODB_URI=tu_conexion_mongodb
JWT_SECRET=tu_secreto_jwt
PORT=5000
NODE_ENV=development

# 4. Iniciar
npm run dev  # Backend
cd client && npm run dev  # Frontend (otra terminal)
```

**Acceso:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## ☁️ Instalación en la Nube

### Railway + Vercel (Recomendado)

#### 1. Backend en Railway

1. Ve a [Railway](https://railway.app)
2. Haz clic en "New Project" → "Deploy from GitHub"
3. Selecciona este repositorio
4. Agrega las variables de entorno:
   ```
   MONGODB_URI=tu_mongodb_atlas_uri
   JWT_SECRET=cualquier_secreto_seguro
   PORT=5000
   NODE_ENV=production
   ```
5. Railway desplegará automáticamente
6. Copia la URL del backend (ej: `https://mecanet.up.railway.app`)

#### 2. Frontend en Vercel

1. Ve a [Vercel](https://vercel.com)
2. "Import Project" → Selecciona este repositorio
3. Configuración:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Agrega variable de entorno:
   ```
   VITE_API_URL=https://tu-backend-railway.up.railway.app
   ```
5. Deploy

### Render (Backend + Frontend en un solo lugar)

1. Ve a [Render](https://render.com)
2. "New" → "Web Service"
3. Conecta tu repositorio
4. Configuración:
   - **Build Command:** `npm run build:cloud`
   - **Start Command:** `npm start`
5. Variables de entorno:
   ```
   MONGODB_URI=tu_mongodb_atlas_uri
   JWT_SECRET=cualquier_secreto_seguro
   NODE_ENV=production
   ```
6. Deploy

---

## 🗄️ Configurar MongoDB Atlas (Gratis)

1. Crea cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. "Create a New Cluster" → Elige el plan **FREE (M0)**
3. "Database Access" → Crea un usuario
4. "Network Access" → "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
5. "Connect" → "Connect your application" → Copia la cadena de conexión
6. Reemplaza `<password>` con tu contraseña

**Ejemplo:**
```
mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/mecanet?retryWrites=true&w=majority
```

---

## 👤 Usuario por Defecto

Después de la primera instalación:

```
Usuario: admin
Contraseña: admin123
```

**⚠️ Cambia la contraseña inmediatamente desde el panel de configuración.**

---

## 📜 Scripts Útiles

```bash
npm start              # Inicia servidor producción
npm run dev            # Desarrollo (backend)
npm run seed           # Carga datos de ejemplo
npm run release        # Genera nuevo release (automático)
```

---

## 📁 Estructura del Proyecto

```
MECANET/
├── client/              # Frontend (React)
│   ├── src/
│   │   ├── pages/      # Vistas principales
│   │   ├── components/ # Componentes reutilizables
│   │   └── services/   # API calls
├── controllers/        # Lógica de negocio
├── models/            # Esquemas MongoDB
├── routes/            # Endpoints API
├── services/          # Servicios (actualizaciones, etc)
└── scripts/           # Automatizaciones
```

---

## 🔄 Sistema de Actualizaciones (Solo local)

El sistema verifica automáticamente actualizaciones en GitHub al iniciar:

1. Ejecuta `INICIAR-MECANET.bat`
2. Si hay actualización disponible, te preguntará si deseas instalarla
3. Descarga, instala y reinicia automáticamente

**Desactivar actualizaciones:** Ve a Configuración → Sistema → Actualizaciones Automáticas

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

ISC License

---

## 💬 Soporte

¿Problemas o preguntas? Abre un [issue](https://github.com/MrXpra/MECANET/issues)

---

⭐ **Si te resulta útil, dale una estrella al proyecto**
