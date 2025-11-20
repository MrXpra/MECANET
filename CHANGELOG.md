# 📝 Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere al [Versionado Semántico](https://semver.org/lang/es/).

---

## [1.1.6] - 2025-11-20

Corrección error 500 al iniciar

## [1.1.3] - 2025-11-19

### 🐛 Corregido
- **Core:** Corregido un error crítico en `performanceMiddleware.js` que podía causar un desbordamiento de pila (Stack Overflow) y errores 500 al interceptar consultas de base de datos repetidamente.
- **Instalación:** El script `CONFIGURAR-INICIAL.ps1` ahora instala automáticamente las dependencias (`npm install`) si no existen, antes de intentar verificar la conexión a la base de datos. Esto soluciona el error `ERR_MODULE_NOT_FOUND` en instalaciones limpias.
- **Instalación:** El script `CONFIGURAR-INICIAL.ps1` ahora crea automáticamente `.env.example` si falta, evitando errores en instalaciones nuevas.
- **Instalación:** Mejorada la verificación de conexión a MongoDB. Ahora muestra errores detallados (IP no permitida, credenciales, etc.) en lugar de un error genérico.
- **Release:** Corregido el script `automated-release.js` para detectar automáticamente la rama actual y hacer push correctamente.
- **Distribución:** Agregadas validaciones en scripts de empaquetado para asegurar que `.env.example` se incluya en el ZIP.

## [1.0.0] - 2025-10-07

### 🎉 Primera Versión Estable

Esta es la primera versión estable del sistema MECANET, con todas las funcionalidades principales implementadas.

### ✨ Agregado

#### Sistema Principal
- Sistema de Punto de Venta (POS) completo
- Dashboard interactivo con KPIs en tiempo real
- Módulo de facturación con cálculo automático de impuestos
- Historial de ventas con filtros avanzados
- Sistema de devoluciones

#### Gestión de Inventario
- CRUD completo de productos
- Categorías y clasificación de productos
- Alertas de stock bajo
- Órdenes de compra a proveedores
- Cálculo automático de precios (costo + margen)

#### Gestión de Contactos
- CRUD de clientes con historial de compras
- CRUD de proveedores con historial de órdenes
- Búsqueda y filtrado avanzado

#### Caja y Finanzas
- Apertura y cierre de caja por turno
- Registro de retiros de caja con autorización
- Cuadre automático de caja
- Reportes financieros

#### Sistema de Auditoría (NUEVO)
- 📋 Registro automático de todas las acciones de usuarios
- 🔍 Visualización detallada de logs de auditoría
- 👤 Seguimiento por usuario, módulo y acción
- 📊 Estadísticas de auditoría
- 🔒 Protección de integridad de logs

#### Sistema de Logs Técnicos (NUEVO)
- 📝 Clasificación de logs por módulo y severidad
- 🚨 Niveles: info, warning, error, critical
- 📈 Estadísticas de logs por periodo
- 🔍 Búsqueda y filtrado avanzado
- 🧹 Limpieza automática de logs antiguos

#### Monitoreo en Tiempo Real (NUEVO)
- 📊 Monitoreo de rendimiento del sistema
- 🔄 Actualización automática cada 30 segundos
- 📈 Métricas de API, base de datos y memoria
- 📊 Historial de métricas de rendimiento

#### Interfaz de Usuario
- Diseño moderno con efectos glassmorphism
- Modo oscuro con toggle
- Sidebar con secciones expandibles
- Animaciones suaves y microinteracciones
- 🕐 Widget de reloj en tiempo real
- 🌤️ Widget de clima integrado
- ⌨️ Atajos de teclado (ver Ctrl+K)
- Responsive design para todos los dispositivos

#### Administración
- Gestión de usuarios y roles (Admin/Cajero)
- Configuración del negocio (nombre, logo, impuestos)
- Configuración de sistema (idioma, moneda, zona horaria)
- Configuración de notificaciones
- Reportes avanzados

#### Autenticación y Seguridad
- Sistema de login con JWT
- Protección de rutas según rol
- Sesión persistente
- Middleware de autorización

#### Flujo de Trabajo Git (NUEVO)
- 🌿 Estrategia de ramas: main (producción) y develop (desarrollo)
- 📦 Sistema de versionado semántico automático
- 🚀 Scripts de release automatizados
- 📚 Documentación completa del flujo de trabajo
- 🏷️ Etiquetado automático de versiones

### 🛠️ Tecnologías

#### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT para autenticación
- Express Validator
- Sistema de logs centralizado

#### Frontend
- React 18.2
- Vite para build rápido
- React Router para navegación
- Zustand para state management
- Tailwind CSS para estilos
- Lucide React para iconos
- Chart.js para gráficos

### 📚 Documentación

- README completo con instrucciones
- Documentación de API endpoints
- Guía de instalación y configuración
- Documentación del flujo de trabajo Git
- Documentación del sistema de auditoría
- Documentación del sistema de logs

### 🔧 Scripts NPM

```json
{
  "start": "Iniciar servidor en producción",
  "dev": "Iniciar servidor con nodemon",
  "seed": "Poblar base de datos con datos de ejemplo",
  "create-admin": "Crear usuario administrador",
  "release:patch": "Publicar versión de corrección (x.x.X)",
  "release:minor": "Publicar versión con nuevas funcionalidades (x.X.0)",
  "release:major": "Publicar versión con cambios importantes (X.0.0)"
}
```

### 📋 Notas de la Versión

Esta versión marca el lanzamiento oficial del sistema MECANET como una solución completa y profesional para la gestión de tiendas de repuestos automotrices. Todas las funcionalidades principales han sido implementadas y probadas.

El sistema incluye ahora un robusto sistema de auditoría y monitoreo que permite rastrear todas las acciones de los usuarios y supervisar el rendimiento del sistema en tiempo real.

### 🎯 Próximas Funcionalidades

- Sistema de notificaciones en tiempo real
- Integración con servicios de terceros (pasarelas de pago)
- Generación de reportes PDF
- Sistema de backup automático
- App móvil

---

## Leyenda de Cambios

- ✨ `Agregado` - Nuevas funcionalidades
- 🔧 `Modificado` - Cambios en funcionalidades existentes
- 🐛 `Corregido` - Corrección de errores
- 🗑️ `Eliminado` - Funcionalidades removidas
- 🔒 `Seguridad` - Correcciones de seguridad
- 📚 `Documentación` - Cambios en documentación
- 🎨 `Estilo` - Cambios que no afectan funcionalidad
- ⚡ `Rendimiento` - Mejoras de rendimiento
- ♻️ `Refactor` - Reestructuración de código

---

## Formato de Versiones

Este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/):

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Nuevas funcionalidades compatibles
- **PATCH** (0.0.X): Correcciones de errores compatibles

---

**Nota**: Las versiones no liberadas se marcarán como `[Unreleased]` en la parte superior del changelog.
