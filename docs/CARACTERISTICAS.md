# 🚀 MECANET - Características del Sistema

## 📋 Descripción General

**MECANET** es un sistema completo de Punto de Venta (POS) diseñado específicamente para tiendas de repuestos automotrices y talleres mecánicos. El sistema ofrece una solución integral para gestionar inventario, ventas, clientes, proveedores y operaciones de caja.

---

## ✨ Características Principales

### 🎨 **Interfaz de Usuario**

#### Diseño Moderno
- **Glassmorphism**: Efectos de vidrio esmerilado con backdrop-blur
- **Modo Oscuro**: Toggle para alternar entre tema claro y oscuro con persistencia
- **Animaciones Suaves**: Microinteracciones y transiciones fluidas
- **Responsive**: Diseño adaptable a todos los dispositivos (móvil, tablet, desktop)
- **Tipografía Inter**: Fuente moderna y legible
- **Iconos Lucide React**: Más de 1000 iconos SVG optimizados

#### Widgets Inteligentes
- **🕐 Reloj en Tiempo Real**: Muestra hora y fecha actualizada cada segundo
- **🌤️ Widget de Clima**: Temperatura, condiciones climáticas y pronóstico diario (integración con WeatherAPI)
- **📊 Dashboard Interactivo**: Gráficos en tiempo real de ventas y estadísticas

#### Accesibilidad
- **⌨️ Atajos de Teclado**: Sistema completo de shortcuts (ver con Ctrl+K o Cmd+K)
- **🔍 Búsqueda Rápida**: Búsqueda instantánea en productos, clientes y proveedores
- **💬 Notificaciones Toast**: Feedback visual para todas las acciones del usuario

---

### 🔐 **Autenticación y Seguridad**

#### Sistema de Autenticación
- **JWT (JSON Web Tokens)**: Autenticación segura con tokens de 30 días
- **Roles de Usuario**: Admin y Cajero con permisos diferenciados
- **Sesión Persistente**: Login automático con localStorage
- **Logout Seguro**: Limpieza completa de credenciales

#### Seguridad
- **Contraseñas Encriptadas**: Hashing con bcryptjs (10 salt rounds)
- **Rutas Protegidas**: Middleware de autorización por rol
- **Validación de Datos**: express-validator en todas las entradas
- **Headers de Seguridad**: Helmet.js configurado
- **CORS Configurado**: Protección contra peticiones no autorizadas

---

### 📊 **Dashboard y Reportes**

#### KPIs en Tiempo Real
- **Ventas del Día**: Total de ventas con comparativa
- **Ventas del Mes**: Acumulado mensual
- **Productos Vendidos**: Cantidad total de items
- **Ticket Promedio**: Valor promedio por venta
- **Inventario Total**: Valor del inventario
- **Productos con Bajo Stock**: Alertas automáticas

#### Gráficos Interactivos
- **Ventas por Día**: Gráfico de barras de últimos 7 días
- **Productos Más Vendidos**: Top 5 con cantidades
- **Tendencias de Ventas**: Análisis de periodos
- **Exportación**: Datos exportables a Excel/PDF

#### Reportes Avanzados
- **Reportes de Ventas**: Por periodo, vendedor, producto
- **Reportes de Inventario**: Stock actual, movimientos, valorización
- **Reportes Financieros**: Ingresos, egresos, utilidades
- **Reportes de Clientes**: Historial de compras, frecuencia
- **Reportes de Proveedores**: Órdenes de compra, pagos

---

### 💰 **Módulo de Ventas (POS)**

#### Facturación
- **Búsqueda Rápida de Productos**: Por código o nombre
- **Cálculo Automático**: Subtotal, impuestos, total
- **Descuentos**: Por producto o total de venta
- **Múltiples Formas de Pago**: Efectivo, tarjeta, transferencia, mixto
- **Cálculo de Cambio**: Automático al ingresar efectivo recibido
- **Impresión de Ticket**: Generación de recibo imprimible
- **Guardar y Continuar**: Pausar venta para atender otra

#### Gestión de Ventas
- **Historial Completo**: Todas las ventas con filtros avanzados
- **Búsqueda**: Por número de factura, cliente, fecha, vendedor
- **Detalles de Venta**: Ver items, cantidades, precios
- **Reimpresión**: Reimprimir tickets de ventas pasadas
- **Anulación**: Cancelar ventas con autorización

#### Devoluciones
- **Registro de Devoluciones**: Por producto o venta completa
- **Motivos**: Defectuoso, cambio, garantía, etc.
- **Reembolso**: Automático al inventario y caja
- **Historial**: Todas las devoluciones registradas

---

### 📦 **Gestión de Inventario**

#### Productos
- **CRUD Completo**: Crear, leer, actualizar, eliminar productos
- **Información Detallada**:
  - Código único autogenerado
  - Nombre y descripción
  - Categorías personalizables
  - Precio de costo y venta
  - Margen de ganancia (cálculo automático)
  - Stock actual y mínimo
  - Proveedor asociado
  - Imagen del producto

#### Control de Stock
- **Alertas de Stock Bajo**: Notificaciones cuando stock < mínimo
- **Ajuste de Inventario**: Manual por mermas, daños, etc.
- **Historial de Movimientos**: Entradas, salidas, ajustes
- **Valorización**: Cálculo automático del valor del inventario
- **Stock por Ubicación**: Gestión de múltiples ubicaciones (opcional)

#### Categorías
- **Categorías Personalizadas**: Crear categorías propias
- **Filtrado por Categoría**: Búsqueda rápida por tipo
- **Estadísticas**: Ventas por categoría

---

### 🛒 **Órdenes de Compra**

#### Gestión de Compras
- **Crear Órdenes**: A proveedores específicos
- **Múltiples Productos**: Agregar varios items por orden
- **Cálculo Automático**: Subtotal, impuestos, total
- **Estados**: Pendiente, Recibida, Cancelada
- **Recepción de Mercancía**: Actualización automática de inventario
- **Historial**: Todas las órdenes con filtros

#### Relación con Proveedores
- **Asociación Automática**: Productos vinculados a proveedores
- **Tracking**: Seguimiento de órdenes pendientes
- **Análisis**: Compras por proveedor, frecuencia

---

### 👥 **Gestión de Contactos**

#### Clientes
- **Registro Completo**:
  - Nombre completo
  - Email y teléfono
  - Dirección
  - RFC/NIT
  - Notas adicionales
- **Historial de Compras**: Todas las ventas del cliente
- **Estadísticas**: Total gastado, frecuencia, ticket promedio
- **Búsqueda Rápida**: Por nombre, email, teléfono
- **Exportación**: Lista de clientes a Excel

#### Proveedores
- **Registro Completo**:
  - Nombre comercial
  - Contacto principal
  - Email y teléfono
  - Dirección
  - RFC/NIT
  - Productos que suministra
- **Historial de Órdenes**: Todas las compras al proveedor
- **Productos Asociados**: Ver todos los productos del proveedor
- **Búsqueda y Filtrado**: Por nombre, categoría

---

### 💵 **Gestión de Caja**

#### Apertura y Cierre
- **Apertura de Caja**: Registro de efectivo inicial
- **Cierre de Caja**: Cuadre automático al final del turno
- **Múltiples Cajeros**: Cada cajero con su sesión
- **Historial de Sesiones**: Todas las aperturas/cierres

#### Retiros de Caja
- **Registro de Retiros**: Efectivo extraído de caja
- **Motivos**: Gastos, pagos, banco, etc.
- **Autorización**: Requiere password de admin
- **Historial**: Todos los retiros con detalles
- **Validación**: No permite retiros mayores al efectivo disponible

#### Cuadre de Caja
- **Cálculo Automático**:
  - Efectivo inicial
  - + Ventas en efectivo
  - - Retiros
  - = Efectivo esperado
- **Diferencias**: Alerta si hay faltante o sobrante
- **Reporte de Cierre**: Resumen completo imprimible

---

### 👤 **Gestión de Usuarios**

#### Administración (Solo Admin)
- **CRUD de Usuarios**: Crear, editar, eliminar usuarios
- **Roles**: Admin (acceso total), Cajero (acceso limitado)
- **Estado**: Activo/Inactivo
- **Información**:
  - Nombre completo
  - Email (username)
  - Contraseña encriptada
  - Rol

#### Permisos por Rol
**Admin:**
- ✅ Acceso completo a todo el sistema
- ✅ Gestionar usuarios
- ✅ Ver reportes financieros
- ✅ Configurar sistema
- ✅ Aprobar retiros de caja
- ✅ Gestionar inventario
- ✅ Ver todos los módulos

**Cajero:**
- ✅ Facturación (POS)
- ✅ Ver productos
- ✅ Buscar clientes
- ✅ Registrar ventas
- ✅ Abrir/cerrar caja
- ❌ No puede ver reportes financieros
- ❌ No puede gestionar usuarios
- ❌ No puede configurar sistema
- ❌ No puede aprobar retiros

---

### 🛡️ **Sistema de Auditoría**

#### Logs de Usuario
- **Registro Automático** de todas las acciones:
  - Inicios de sesión (exitosos y fallidos)
  - Creación/modificación/eliminación de registros
  - Cambios en inventario
  - Operaciones financieras
  - Configuración del sistema

#### Información Capturada
- **Usuario**: Quién realizó la acción
- **Acción**: Qué se hizo (crear, editar, eliminar)
- **Módulo**: En qué parte del sistema (ventas, productos, etc.)
- **Fecha y Hora**: Timestamp exacto
- **Detalles**: Datos antes y después del cambio
- **IP**: Dirección IP del usuario (opcional)

#### Visualización
- **Dashboard de Auditoría**: Vista completa de logs
- **Filtros Avanzados**: Por usuario, módulo, acción, fecha
- **Búsqueda**: Por cualquier campo
- **Exportación**: Logs a Excel para análisis
- **Estadísticas**: Acciones por usuario, módulo más usado

---

### 📝 **Sistema de Logs Técnicos**

#### Clasificación de Logs
- **info**: Información general del sistema
- **warning**: Advertencias (no bloquean operación)
- **error**: Errores recuperables
- **critical**: Errores críticos que requieren atención inmediata

#### Módulos Monitoreados
- `auth` - Autenticación
- `products` - Gestión de productos
- `sales` - Ventas
- `inventory` - Inventario
- `cashier` - Operaciones de caja
- `users` - Gestión de usuarios
- `system` - Sistema general

#### Funcionalidades
- **Registro Automático**: De todas las operaciones importantes
- **Búsqueda**: Por módulo, severidad, fecha
- **Estadísticas**: Logs por tipo, módulo, periodo
- **Limpieza**: Eliminación automática de logs antiguos (configurable)
- **Alertas**: Notificaciones en errores críticos

---

### 📈 **Monitoreo en Tiempo Real**

#### Métricas del Sistema
- **Rendimiento de API**: Tiempo de respuesta de endpoints
- **Estado de Base de Datos**: Conexión, latencia
- **Uso de Memoria**: RAM del servidor
- **Usuarios Activos**: Sesiones actuales
- **Peticiones por Minuto**: Carga del sistema

#### Actualización Automática
- **Refresh cada 30 segundos**: Datos en tiempo real
- **Gráficos**: Visualización de métricas
- **Alertas**: Notificaciones si hay problemas
- **Historial**: Métricas de las últimas 24 horas

---

### ⚙️ **Configuración del Sistema**

#### Datos del Negocio
- Nombre del negocio
- Logo (upload de imagen)
- Teléfono, email, dirección
- Redes sociales
- Horario de atención

#### Configuración Regional
- **Moneda**: USD, MXN, EUR, etc.
- **Zona Horaria**: Ajuste automático de fechas
- **Idioma**: Español (inglés en desarrollo)
- **Formato de Fecha**: DD/MM/YYYY, MM/DD/YYYY, etc.

#### Configuración de Facturación
- **Tasa de Impuesto**: Porcentaje de IVA/Tax
- **Prefijo de Factura**: Ej: INV, FAC, etc.
- **Numeración**: Automática secuencial
- **Mensaje en Ticket**: Personalizable

#### Configuración de Inventario
- **Umbral de Stock Bajo**: Cantidad mínima para alertas
- **Método de Valorización**: FIFO, LIFO, Promedio
- **Ajustes Automáticos**: Por ventas/compras

#### Notificaciones
- **Email**: Activar/desactivar notificaciones por email
- **Alertas de Stock**: Notificar cuando stock < mínimo
- **Reportes Automáticos**: Envío programado de reportes
- **Configuración SMTP**: Para envío de emails

---

## 🔧 Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18+ | Runtime de JavaScript |
| **Express** | 4.18+ | Framework web |
| **MongoDB** | 6.0+ | Base de datos NoSQL |
| **Mongoose** | 7.0+ | ODM para MongoDB |
| **JWT** | 9.0+ | Autenticación |
| **bcryptjs** | 2.4+ | Encriptación de contraseñas |
| **express-validator** | 7.0+ | Validación de datos |
| **cors** | 2.8+ | Control de CORS |
| **dotenv** | 16.0+ | Variables de entorno |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.2+ | Librería de UI |
| **Vite** | 4.4+ | Build tool |
| **React Router** | 6.15+ | Navegación SPA |
| **Zustand** | 4.4+ | State management |
| **Axios** | 1.5+ | Cliente HTTP |
| **Tailwind CSS** | 3.3+ | Framework CSS |
| **Lucide React** | Latest | Iconos SVG |
| **React Hot Toast** | 2.4+ | Notificaciones |
| **Recharts** | 2.8+ | Gráficos |
| **XLSX** | 0.18+ | Exportación Excel |
| **jsPDF** | 2.5+ | Generación PDF |

---

## 🌐 Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────────────────────────────────────┐
│                   CLIENTE                        │
│            (Navegador Web)                       │
└────────────────┬────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────┐
│              FRONTEND (React)                    │
│  • React Router (SPA)                            │
│  • Zustand (State Management)                    │
│  • Axios (HTTP Client)                           │
│  • Tailwind CSS (Styling)                        │
└────────────────┬────────────────────────────────┘
                 │ REST API
                 ▼
┌─────────────────────────────────────────────────┐
│            BACKEND (Node.js + Express)           │
│  • JWT Authentication                            │
│  • Role-based Authorization                      │
│  • Express Validator                             │
│  • Error Handling                                │
└────────────────┬────────────────────────────────┘
                 │ Mongoose ODM
                 ▼
┌─────────────────────────────────────────────────┐
│           BASE DE DATOS (MongoDB)                │
│  • Users, Products, Sales                        │
│  • Customers, Suppliers                          │
│  • Settings, Logs, Audit                         │
└─────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Usuario** interactúa con la UI (React)
2. **Frontend** hace petición HTTP (Axios)
3. **Backend** valida JWT y permisos
4. **Controller** procesa la lógica de negocio
5. **Model** interactúa con MongoDB (Mongoose)
6. **Respuesta** regresa al frontend
7. **UI** se actualiza (Zustand + React)

---

## 📱 Módulos del Sistema

| Módulo | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| **Dashboard** | `/` | Resumen y KPIs | Todos |
| **Facturación** | `/facturacion` | POS y ventas | Todos |
| **Historial Ventas** | `/historial-ventas` | Consulta de ventas | Todos |
| **Devoluciones** | `/devoluciones` | Gestión de returns | Todos |
| **Inventario** | `/inventario` | Gestión de productos | Admin |
| **Órdenes de Compra** | `/ordenes-compra` | Compras a proveedores | Admin |
| **Clientes** | `/clientes` | Gestión de clientes | Todos |
| **Proveedores** | `/proveedores` | Gestión de proveedores | Admin |
| **Cierre de Caja** | `/cierre-caja` | Apertura/cierre | Todos |
| **Retiros de Caja** | `/retiros-caja` | Retiros de efectivo | Admin |
| **Usuarios** | `/usuarios` | Gestión de usuarios | Admin |
| **Reportes** | `/reportes` | Reportes avanzados | Admin |
| **Auditoría** | `/auditoria` | Logs de usuarios | Admin |
| **Logs** | `/logs` | Logs técnicos | Admin |
| **Monitoreo** | `/monitoreo` | Métricas en tiempo real | Admin |
| **Configuración** | `/configuracion/*` | Ajustes del sistema | Admin |

---

## 🎯 Casos de Uso Principales

### 1. Venta Rápida (Cajero)
1. Login como cajero
2. Ir a Facturación
3. Buscar productos (por código o nombre)
4. Agregar al carrito
5. Seleccionar cliente (opcional)
6. Calcular total
7. Procesar pago
8. Imprimir ticket

### 2. Control de Inventario (Admin)
1. Login como admin
2. Ir a Inventario
3. Ver productos con stock bajo
4. Crear orden de compra a proveedor
5. Recibir mercancía
6. Inventario se actualiza automáticamente

### 3. Cierre de Turno (Cajero)
1. Al inicio del día: Apertura de caja (registrar efectivo inicial)
2. Realizar ventas durante el turno
3. Registrar retiros si es necesario (con aprobación admin)
4. Al final del día: Cierre de caja
5. Sistema calcula efectivo esperado
6. Ingresar efectivo real
7. Ver diferencias (faltante/sobrante)
8. Imprimir reporte de cierre

### 4. Análisis de Negocio (Admin)
1. Login como admin
2. Ir a Dashboard
3. Ver KPIs del día/mes
4. Analizar productos más vendidos
5. Ir a Reportes
6. Generar reporte de ventas por periodo
7. Exportar a Excel/PDF
8. Tomar decisiones basadas en datos

---

## 🔌 API RESTful

El sistema cuenta con una API REST completa documentada con los siguientes endpoints principales:

- `POST /api/auth/login` - Autenticación
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `POST /api/sales` - Registrar venta
- `GET /api/customers` - Listar clientes
- `GET /api/dashboard/stats` - Estadísticas del dashboard
- `POST /api/cashier-sessions` - Apertura de caja
- `PUT /api/cashier-sessions/:id/close` - Cierre de caja

**Total de endpoints:** ~60+ rutas documentadas

---

## 📈 Beneficios del Sistema

### Para el Negocio
✅ **Control Total**: Gestión completa de inventario, ventas y finanzas  
✅ **Decisiones Informadas**: Reportes y estadísticas en tiempo real  
✅ **Reducción de Errores**: Cálculos automáticos y validaciones  
✅ **Ahorro de Tiempo**: Procesos automatizados  
✅ **Seguridad**: Auditoría completa de todas las operaciones  
✅ **Escalabilidad**: Preparado para crecimiento  

### Para los Usuarios
✅ **Interfaz Intuitiva**: Fácil de usar, no requiere capacitación extensa  
✅ **Rápido**: Operaciones optimizadas para velocidad  
✅ **Accesible**: Funciona en cualquier dispositivo  
✅ **Confiable**: Sistema robusto con manejo de errores  
✅ **Notificaciones**: Feedback constante de las acciones  

---

## 🚀 Ventajas Competitivas

1. **Sistema Completo Todo-en-Uno**: No necesitas múltiples aplicaciones
2. **Diseño Moderno**: Interfaz atractiva que facilita la adopción
3. **Personalizable**: Adaptable a diferentes tipos de negocios
4. **Open Source**: Código accesible para modificaciones
5. **Sin Mensualidades**: Una sola compra, sin costos recurrentes
6. **Multi-Cliente**: Reutilizable para varios negocios
7. **Auditoría Completa**: Trazabilidad de todas las operaciones
8. **Soporte Multimoneda**: Funciona en cualquier país

---

**Versión del Sistema:** 1.0.0  
**Última Actualización:** Octubre 2025  
**Documentación:** Completa y actualizada
