/**
 * SERVER.JS - Punto de entrada principal del servidor backend
 * 
 * Este archivo configura y arranca el servidor Express que maneja:
 * - Autenticación de usuarios (JWT)
 * - Gestión de inventario de productos
 * - Procesamiento de ventas y facturación
 * - Administración de clientes y proveedores
 * - Configuración del sistema
 * - Retiros de caja y cierres
 * - Reportes y estadísticas del dashboard
 */

import express from 'express';
import cors from 'cors'; // Middleware para permitir peticiones desde otros dominios (frontend)
import dotenv from 'dotenv'; // Carga variables de entorno desde archivo .env
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import open from 'open'; // Para abrir el navegador automáticamente
import connectDB from './config/db.js'; // Función para conectar a MongoDB
import LogService from './services/logService.js'; // Servicio de logs con limpieza automática
import rateLimit from 'express-rate-limit';
// import helmet from 'helmet'; // Comentado temporalmente para compatibilidad con pkg

// ========== MANEJO DE ERRORES GLOBALES ==========
// Capturar errores no manejados para evitar que el ejecutable se cierre sin mostrar información
process.on('uncaughtException', (error) => {
  console.error('\n❌ ERROR CRÍTICO NO CAPTURADO:');
  console.error(error);
  console.error('\nStack trace:', error.stack);
  if (process.env.NODE_ENV === 'production') {
    console.log('\n⏸️  Presiona cualquier tecla para cerrar...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ PROMESA RECHAZADA NO MANEJADA:');
  console.error('Razón:', reason);
  console.error('Promesa:', promise);
  if (process.env.NODE_ENV === 'production') {
    console.log('\n⏸️  Presiona cualquier tecla para cerrar...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => process.exit(1));
  } else {
    process.exit(1);
  }
});

// ========== IMPORTAR TODAS LAS RUTAS ==========
// Cada archivo de rutas maneja un módulo específico de la aplicación
import authRoutes from './routes/authRoutes.js'; // Login, registro, verificación de token
import userRoutes from './routes/userRoutes.js'; // CRUD de usuarios del sistema
import productRoutes from './routes/productRoutes.js'; // CRUD de productos en inventario
import saleRoutes from './routes/saleRoutes.js'; // Crear ventas, historial, estadísticas
import customerRoutes from './routes/customerRoutes.js'; // CRUD de clientes
import settingsRoutes from './routes/settingsRoutes.js'; // Configuración del negocio y sistema
import dashboardRoutes from './routes/dashboardRoutes.js'; // Estadísticas y KPIs del dashboard
import supplierRoutes from './routes/supplierRoutes.js'; // CRUD de proveedores
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js'; // Órdenes de compra a proveedores
import proxyRoutes from './routes/proxyRoutes.js'; // Proxy para APIs externas (clima, etc)
import returnRoutes from './routes/returnRoutes.js'; // Devoluciones de productos
import cashWithdrawalRoutes from './routes/cashWithdrawalRoutes.js'; // Retiros de caja
import logRoutes from './routes/logRoutes.js'; // Sistema de logs técnicos
import auditLogRoutes from './routes/auditLogRoutes.js'; // Sistema de auditoría de usuario
import quotationRoutes from './routes/quotationRoutes.js'; // Cotizaciones
import systemRoutes from './routes/systemRoutes.js'; // Actualizaciones del sistema

// Importar middleware de manejo de errores global
import { errorHandler } from './middleware/errorMiddleware.js';
// Importar middleware de logging
import { requestLogger, errorLogger } from './middleware/logMiddleware.js';
// Importar middleware de monitoreo de rendimiento
import { performanceMonitor } from './middleware/performanceMiddleware.js';

// ========== CONFIGURACIÓN INICIAL ==========
// Configurar __dirname para ES modules (necesario porque usamos "type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== CONTROL DE VERSIONES Y MODO DE APLICACIÓN ==========
// Leer package.json y version.json para asegurar consistencia
let APP_VERSION = '0.0.0';
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const versionJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'version.json'), 'utf8'));
  
  if (packageJson.version !== versionJson.version) {
    console.error('❌ ERROR CRÍTICO DE VERSIÓN:');
    console.error(`   package.json: ${packageJson.version}`);
    console.error(`   version.json: ${versionJson.version}`);
    console.error('   Las versiones deben coincidir para iniciar el sistema.');
    process.exit(1);
  }
  
  APP_VERSION = packageJson.version;
  console.log(`📦 MECANET v${APP_VERSION} iniciando...`);
} catch (error) {
  console.error('⚠️  Error leyendo archivos de versión:', error.message);
  // En desarrollo podría permitirse, pero en producción es crítico
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ No se puede iniciar sin información de versión válida.');
    process.exit(1);
  }
}

// Determinar modo de aplicación (Cloud vs Desktop)
// APP_MODE puede ser 'desktop' (local .exe) o 'cloud' (Railway/Web)
// Si no está definido, asumimos 'cloud' por seguridad
const APP_MODE = process.env.APP_MODE || 'cloud';
const IS_LOCAL_APP = APP_MODE === 'desktop';

console.log(`🚀 Modo de Aplicación: ${APP_MODE.toUpperCase()}`);
if (IS_LOCAL_APP) {
  console.log('💻 Ejecutando en modo ESCRITORIO (Local)');
} else {
  console.log('☁️  Ejecutando en modo NUBE (Server/Railway)');
}

// Cargar variables de entorno (.env) - PORT, MONGO_URI, JWT_SECRET, etc
console.log('📂 Cargando variables de entorno...');
console.log('📍 Directorio de trabajo:', __dirname);
console.log('📍 Buscando archivo .env en:', path.join(__dirname, '.env'));

const envResult = dotenv.config();

if (envResult.error) {
  console.error('⚠️  No se pudo cargar el archivo .env:', envResult.error.message);
  console.log('ℹ️  Continuando con variables de entorno del sistema...');
} else {
  console.log('✅ Archivo .env cargado correctamente');
  console.log('✅ Variables cargadas:', Object.keys(envResult.parsed || {}).length);
}

console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'no definido');
console.log('🌐 PORT:', process.env.PORT || '5000 (por defecto)');
console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? '✓ Definido' : '✗ NO DEFINIDO');
console.log('🗄️  MONGODB_URI:', process.env.MONGODB_URI ? '✓ Definido' : '✗ NO DEFINIDO');

// ===== Validación temprana de JWT_SECRET =====
// Aseguramos que exista un secreto para JWT y tenga longitud mínima razonable.
const MIN_JWT_LENGTH = 32; // mínimo recomendado (en hex esto sería 32+), ajustar según necesidades
const jwtSecret = process.env.JWT_SECRET;

// Función auxiliar para mantener la ventana abierta en caso de error fatal
const waitAndExit = async (exitCode = 1) => {
  if (process.env.NODE_ENV === 'production') {
    console.log('\nPresiona cualquier tecla para salir...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, exitCode));
    // Mantener el proceso vivo hasta que el usuario interactúe
    await new Promise(resolve => { });
  } else {
    process.exit(exitCode);
  }
};

if (!jwtSecret || String(jwtSecret).length < MIN_JWT_LENGTH) {
  console.error('\n❌ FATAL: La variable de entorno JWT_SECRET no está definida o es demasiado corta.');
  console.error('   Longitud actual:', jwtSecret ? jwtSecret.length : 0, '| Mínimo requerido:', MIN_JWT_LENGTH);
  console.error('\n📝 Soluciones:');
  console.error('   1. Asegúrate de que el archivo .env exista en la misma carpeta que el ejecutable');
  console.error('   2. Genera un secreto seguro ejecutando: node ./scripts/generateJwtSecret.js');
  console.error('   3. Copia el secreto generado al archivo .env');
  console.error('\n📂 Ubicación esperada del .env:', path.join(__dirname, '.env'));
  // Cortamos el arranque del servidor para evitar correr sin secreto válido
  await waitAndExit(1);
}

// Conectar a MongoDB usando la URI en variables de entorno
console.log('\n📡 Conectando a MongoDB...');
try {
  await connectDB();
  console.log('✅ Conexión a MongoDB establecida exitosamente');
} catch (error) {
  console.error('\n❌ FATAL: No se pudo conectar a la base de datos.');
  console.error('   Error:', error.message);
  console.error('\n📝 Verifica:');
  console.error('   1. Tu conexión a internet está activa');
  console.error('   2. La variable MONGODB_URI en el archivo .env es correcta');
  console.error('   3. Tu IP está permitida en MongoDB Atlas (Network Access)');
  console.error('\n🗄️  MONGODB_URI actual:', process.env.MONGODB_URI ? 'Definida (oculta por seguridad)' : 'NO DEFINIDA');
  await waitAndExit(1);
}

// Iniciar limpieza automática de logs (cada 24 horas)
LogService.startAutoCleaning();

// Inicializar la aplicación Express
const app = express();

// Habilitar 'trust proxy' es necesario para despliegues en Railway/Vercel/AWS
// Esto permite que express-rate-limit identifique correctamente la IP real del usuario
app.set('trust proxy', 1);

// ========== SEGURIDAD ==========
// 1. HELMET: Desactivado temporalmente para compatibilidad con pkg
// app.use(helmet({
//   contentSecurityPolicy: false,
//   crossOriginEmbedderPolicy: false
// }));

// 2. RATE LIMITING: Proteger contra fuerza bruta y DDoS
// Límite general: 100 peticiones por IP cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite por IP
  standardHeaders: true, // Retorna info de límite en las cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita las cabeceras `X-RateLimit-*`
  message: {
    status: 429,
    message: 'Demasiadas peticiones desde esta IP, por favor intente nuevamente en 15 minutos'
  }
});

// Aplicar limitador a todas las rutas
app.use(limiter);

// Limitador estricto para rutas de autenticación (login)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 intentos de login por hora por IP
  message: {
    status: 429,
    message: 'Demasiados intentos de inicio de sesión, por favor intente nuevamente en una hora'
  }
});
app.use('/api/auth/login', authLimiter);

// ========== MIDDLEWARE GLOBAL ==========
// CORS: Configurado según el modo de aplicación (Camaleón)
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, curl, localhost)
    if (!origin) return callback(null, true);
    
    // MODO ESCRITORIO (LOCAL): Permisivo con localhost
    if (IS_LOCAL_APP) {
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      // Opcional: Permitir acceso desde red local si se desea
      // if (origin.startsWith('http://192.168.')) return callback(null, true);
    } 
    // MODO NUBE (RAILWAY/WEB): Estricto
    else {
      const allowedOrigins = [
        'https://mecanet.site',
        'https://www.mecanet.site',
        // Agregar aquí dominios de producción reales
      ];
      
      // En desarrollo (NODE_ENV !== production) permitimos localhost también
      if (process.env.NODE_ENV !== 'production') {
        allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000');
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        return callback(new Error('Acceso denegado por CORS'));
      }
    }
    
    // Fallback para desarrollo local si no cayó en los anteriores
    if (process.env.NODE_ENV !== 'production') {
       return callback(null, true);
    }

    return callback(new Error('Acceso denegado por CORS (Default)'));
  },
  credentials: true // Permitir cookies/headers autorizados
};

app.use(cors(corsOptions));

// Configuración de Proxy para modo Nube
if (!IS_LOCAL_APP) {
  app.set('trust proxy', 1); // Confiar en el primer proxy (Railway/Nginx/Cloudflare)
}

// Parseo de JSON y URL-encoded
app.use(express.json({ limit: '50mb' })); // Aumentado para imágenes base64 si es necesario
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ========== MIDDLEWARE DE LOGGING Y MONITOREO ==========
// Monitoreo de rendimiento (debe ir primero para medir todo)
app.use(performanceMonitor);

// Registrar todas las peticiones HTTP
app.use(requestLogger);

// ========== REGISTRO DE RUTAS API ==========
// Cada ruta tiene su prefijo y se delega a su archivo de rutas correspondiente
app.use('/api/auth', authRoutes); // /api/auth/login, /api/auth/register, etc
app.use('/api/users', userRoutes); // /api/users (CRUD usuarios)
app.use('/api/products', productRoutes); // /api/products (CRUD productos)
app.use('/api/sales', saleRoutes); // /api/sales (crear ventas, historial)
app.use('/api/customers', customerRoutes); // /api/customers (CRUD clientes)
app.use('/api/settings', settingsRoutes); // /api/settings (configuración)
app.use('/api/dashboard', dashboardRoutes); // /api/dashboard/stats
app.use('/api/suppliers', supplierRoutes); // /api/suppliers (CRUD proveedores)
app.use('/api/purchase-orders', purchaseOrderRoutes); // /api/purchase-orders
app.use('/api/proxy', proxyRoutes); // /api/proxy/weather (proxy APIs externas)
app.use('/api/returns', returnRoutes); // /api/returns (devoluciones)
app.use('/api/cash-withdrawals', cashWithdrawalRoutes); // /api/cash-withdrawals
app.use('/api/logs', logRoutes); // /api/logs (logs técnicos del sistema)
app.use('/api/audit-logs', auditLogRoutes); // /api/audit-logs (auditoría de usuario)
app.use('/api/quotations', quotationRoutes); // /api/quotations (cotizaciones)
app.use('/api/system', systemRoutes); // /api/system (actualizaciones del sistema)
app.use('/api/system', systemRoutes); // /api/system (actualizaciones del sistema)

// Endpoint para obtener versión del sistema
app.get('/api/version', (req, res) => {
  try {
    const versionPath = path.join(__dirname, 'version.json');
    if (fs.existsSync(versionPath)) {
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      res.json(versionData);
    } else {
      res.status(404).json({ message: 'Archivo de versión no encontrado' });
    }
  } catch (error) {
    console.error('Error al leer versión:', error);
    res.status(500).json({ message: 'Error al obtener versión' });
  }
});

// ========== SERVIR FRONTEND EN PRODUCCIÓN ==========
// En producción, Express sirve los archivos estáticos del build de React
if (process.env.NODE_ENV === 'production') {
  // Servir archivos estáticos del frontend compilado
  const clientDistPath = path.join(__dirname, 'client', 'dist');
  app.use(express.static(clientDistPath));

  // Ruta catch-all: cualquier petición que no sea API debe devolver el index.html
  // Esto permite que React Router maneje el enrutamiento del lado del cliente
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // En desarrollo, solo API
  app.get('/', (req, res) => {
    res.json({
      message: 'MECANET API está funcionando correctamente',
      status: 'online',
      timestamp: new Date().toISOString()
    });
  });
}

// ========== MIDDLEWARE DE ERRORES ==========
// Logger de errores (debe ir ANTES del errorHandler)
app.use(errorLogger);

// Este middleware captura cualquier error que ocurra en las rutas
// Debe estar DESPUÉS de todas las rutas para que pueda interceptar sus errores
app.use(errorHandler);

// ========== ARRANCAR SERVIDOR ==========
// Usa el puerto de la variable de entorno o 5000 por defecto
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log('\n✅ ═══════════════════════════════════════════════');
  console.log('   🚀 MECANET INICIADO CORRECTAMENTE');
  console.log('   ═══════════════════════════════════════════════');
  console.log(`   🌐 Servidor: http://localhost:${PORT}`);
  console.log(`   🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('   ═══════════════════════════════════════════════\n');

  // En modo ESCRITORIO (Local), abrir automáticamente el navegador
  if (IS_LOCAL_APP && process.env.NODE_ENV === 'production') {
    const url = `http://localhost:${PORT}`;
    console.log(`🌐 Abriendo navegador en ${url}...`);
    try {
      await open(url);
      console.log('✅ Navegador abierto exitosamente\n');
    } catch (error) {
      console.error('⚠️  No se pudo abrir el navegador automáticamente:', error.message);
      console.log(`📌 Por favor, abre manualmente: ${url}\n`);
    }
    console.log('ℹ️  Para detener el servidor, presiona Ctrl+C\n');
  }
}).on('error', (error) => {
  console.error('\n❌ ERROR AL INICIAR EL SERVIDOR:');
  console.error('   Error:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`\n   El puerto ${PORT} ya está en uso.`);
    console.error('\n📝 Soluciones:');
    console.error('   1. Cierra cualquier otra instancia de MECANET');
    console.error('   2. Cambia el puerto en el archivo .env (ejemplo: PORT=5001)');
    console.error('   3. Reinicia tu computadora si el problema persiste');
  }
  if (process.env.NODE_ENV === 'production') {
    console.log('\n⏸️  Presiona cualquier tecla para cerrar...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => process.exit(1));
  } else {
    process.exit(1);
  }
});

