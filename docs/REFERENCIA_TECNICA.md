# 🔧 MECANET - Referencia Técnica

## 📚 Guía Completa de Arquitectura, API y Código

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#-arquitectura-del-sistema)
2. [Estructura de Carpetas](#-estructura-de-carpetas)
3. [Backend - Modelos](#-backend---modelos)
4. [Backend - API Endpoints](#-backend---api-endpoints)
5. [Backend - Controladores](#-backend---controladores)
6. [Backend - Middleware](#-backend---middleware)
7. [Frontend - Estructura](#-frontend---estructura)
8. [Frontend - State Management](#-frontend---state-management)
9. [Flujos de Datos Importantes](#-flujos-de-datos-importantes)
10. [Convenciones de Código](#-convenciones-de-código)

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React 18 + Vite + Tailwind CSS + Zustand       │
│              Port: 3000 / 3001                   │
└───────────────────┬─────────────────────────────┘
                    │ HTTP/REST API
                    │ Authorization: Bearer <JWT>
┌───────────────────▼─────────────────────────────┐
│                   BACKEND                        │
│     Node.js + Express + JWT + bcryptjs          │
│              Port: 5000                          │
└───────────────────┬─────────────────────────────┘
                    │ Mongoose ODM
┌───────────────────▼─────────────────────────────┐
│                  DATABASE                        │
│            MongoDB Atlas (Cloud)                 │
│         12 Collections + Indexes                 │
└─────────────────────────────────────────────────┘
```

### Flujo de Autenticación

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │─────▶│  Server  │─────▶│    DB    │
│          │ POST │  /auth/  │ Find │  users   │
│          │◀─────│  login   │◀─────│          │
└──────────┘ JWT  └──────────┘ User └──────────┘
     │
     │ Store token in localStorage
     ▼
┌──────────┐
│  Zustand │
│ authStore│
└──────────┘
```

### Flujo de Peticiones Protegidas

```
Request
  │
  ├─ Header: Authorization: Bearer <token>
  │
  ▼
authMiddleware.protect()
  │
  ├─ Verifica JWT token
  ├─ Decodifica payload
  ├─ Busca usuario en DB
  │
  ▼
req.user = { id, name, email, role }
  │
  ▼
Controller
  │
  ▼
Response
```

---

## 📁 Estructura de Carpetas

### Backend (Root)

```
proyecto/
│
├── config/
│   └── db.js                    # Conexión MongoDB
│
├── controllers/                 # Lógica de negocio
│   ├── authController.js        # Login, perfil
│   ├── productController.js     # CRUD productos
│   ├── saleController.js        # Ventas, cierre caja
│   ├── customerController.js    # CRUD clientes
│   ├── supplierController.js    # CRUD proveedores
│   ├── userController.js        # CRUD usuarios
│   ├── settingsController.js    # Configuración
│   ├── dashboardController.js   # Estadísticas
│   ├── purchaseOrderController.js # Órdenes compra
│   ├── returnController.js      # Devoluciones
│   └── cashWithdrawalController.js # Retiros
│
├── middleware/
│   ├── authMiddleware.js        # protect, admin, generateToken
│   ├── errorMiddleware.js       # Error handling
│   ├── validationMiddleware.js  # Express-validator
│   ├── logMiddleware.js         # Logging requests
│   └── performanceMiddleware.js # Métricas
│
├── models/                      # Schemas Mongoose
│   ├── User.js
│   ├── Product.js
│   ├── Sale.js
│   ├── Customer.js
│   ├── Supplier.js
│   ├── Settings.js
│   ├── PurchaseOrder.js
│   ├── Return.js
│   ├── CashWithdrawal.js
│   ├── CashierSession.js
│   ├── AuditLog.js
│   └── Log.js
│
├── routes/                      # Definición de endpoints
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── saleRoutes.js
│   ├── customerRoutes.js
│   ├── supplierRoutes.js
│   ├── userRoutes.js
│   ├── settingsRoutes.js
│   ├── dashboardRoutes.js
│   ├── purchaseOrderRoutes.js
│   ├── returnRoutes.js
│   ├── cashWithdrawalRoutes.js
│   ├── auditLogRoutes.js
│   └── logRoutes.js
│
├── scripts/                     # Utilidades
│   ├── seed.js                  # Datos de prueba
│   ├── setupNewClient.js        # Setup multi-cliente
│   └── createAdmin.js           # Crear admin
│
├── services/                    # Servicios externos
│   ├── emailService.js          # Nodemailer
│   ├── auditLogService.js       # Logging auditoría
│   └── logService.js            # Sistema de logs
│
├── .env                         # Variables de entorno
├── server.js                    # Entry point
└── package.json
```

### Frontend (client/)

```
client/
│
├── src/
│   ├── components/
│   │   ├── Common/              # Componentes reutilizables
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Card.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   │
│   │   ├── Layout/              # Layout principal
│   │   │   ├── Sidebar.jsx      # Menú lateral
│   │   │   ├── Header.jsx       # Top bar
│   │   │   └── Layout.jsx       # Wrapper
│   │   │
│   │   └── Dashboard/           # Widgets
│   │       ├── SalesChart.jsx
│   │       ├── StatsCard.jsx
│   │       └── TopProducts.jsx
│   │
│   ├── pages/                   # Vistas principales
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Billing.jsx          # POS - Facturación
│   │   ├── Inventory.jsx        # Gestión inventario
│   │   ├── SalesHistory.jsx     # Historial ventas
│   │   ├── Customers.jsx        # CRUD clientes
│   │   ├── Suppliers.jsx        # CRUD proveedores
│   │   ├── Users.jsx            # CRUD usuarios (admin)
│   │   ├── Settings.jsx         # Configuración
│   │   ├── CashierSession.jsx   # Cierre de caja
│   │   ├── PurchaseOrders.jsx   # Órdenes de compra
│   │   ├── Returns.jsx          # Devoluciones
│   │   ├── AuditLog.jsx         # Auditoría
│   │   └── Logs.jsx             # Sistema logs
│   │
│   ├── services/
│   │   └── api.js               # Axios instance + helpers
│   │
│   ├── store/                   # Zustand stores
│   │   ├── authStore.js         # Estado auth + user
│   │   ├── cartStore.js         # Carrito POS
│   │   └── settingsStore.js     # Configuración global
│   │
│   ├── utils/
│   │   ├── formatters.js        # Formateo moneda, fecha
│   │   └── validators.js        # Validaciones frontend
│   │
│   ├── App.jsx                  # Router + Routes
│   ├── main.jsx                 # Entry point
│   └── index.css                # Tailwind + custom
│
├── public/
│   └── logo.png
│
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🗄️ Backend - Modelos

### 1. User.js

**Propósito:** Usuarios del sistema (admin/cajero)

```javascript
{
  name: String,           // Nombre completo
  email: String,          // Email único, lowercase
  password: String,       // Hasheado con bcrypt (10 rounds)
  role: String,           // 'admin' | 'cashier'
  isActive: Boolean,      // Soft delete
  lastLogin: Date,
  createdBy: ObjectId,    // Ref: User
  timestamps: true
}
```

**Hooks:**
- `pre('save')`: Hashea password si fue modificado

**Métodos:**
- `comparePassword(candidatePassword)`: Compara con bcrypt

**Indexes:**
- email: unique

---

### 2. Product.js

**Propósito:** Productos del inventario

```javascript
{
  sku: String,              // Código único, uppercase
  name: String,             // Nombre del producto
  description: String,
  category: String,         // Categoría (aceites, filtros, etc.)
  brand: String,            // Marca
  costPrice: Number,        // Precio de costo
  salePrice: Number,        // Precio de venta
  stock: Number,            // Stock actual (>= 0)
  minStock: Number,         // Stock mínimo para alerta
  supplier: ObjectId,       // Ref: Supplier
  location: String,         // Ubicación física
  imageUrl: String,         // URL de imagen
  soldCount: Number,        // Contador de ventas
  isActive: Boolean,        // Soft delete
  timestamps: true
}
```

**Virtuals:**
- `profitMargin`: Calcula `((salePrice - costPrice) / costPrice) * 100`
- `isLowStock`: Boolean, true si `stock <= minStock`

**Indexes:**
- sku: unique
- name: text index (búsqueda)
- soldCount: descending (top products)

---

### 3. Sale.js

**Propósito:** Ventas realizadas

```javascript
{
  invoiceNumber: String,    // Auto: INV-YYMMDD-0001
  user: ObjectId,           // Ref: User (cajero)
  customer: ObjectId,       // Ref: Customer (opcional)
  items: [{
    product: ObjectId,      // Ref: Product
    quantity: Number,
    priceAtSale: Number,    // Precio al momento de venta
    subtotal: Number        // quantity * priceAtSale
  }],
  subtotal: Number,         // Suma de items
  tax: Number,              // Impuesto calculado
  discount: Number,         // Descuento aplicado
  total: Number,            // subtotal + tax - discount
  paymentMethod: String,    // 'cash' | 'card' | 'transfer'
  amountPaid: Number,       // Monto recibido
  change: Number,           // Cambio (si cash)
  status: String,           // 'completed' | 'cancelled'
  notes: String,
  timestamps: true
}
```

**Hooks:**
- `pre('save')`: Auto-genera `invoiceNumber` si no existe

**Indexes:**
- invoiceNumber: unique
- user, customer, createdAt: queries comunes

---

### 4. Customer.js

**Propósito:** Clientes del negocio

```javascript
{
  name: String,             // Nombre completo
  email: String,            // Email (sparse unique)
  phone: String,
  address: String,
  rnc: String,              // RNC/RFC (sparse unique)
  cedula: String,           // Cédula/DNI (sparse unique)
  totalSpent: Number,       // Total histórico gastado
  lastPurchase: Date,       // Última compra
  purchaseCount: Number,    // Número de compras
  isActive: Boolean,
  timestamps: true
}
```

**Indexes:**
- email: sparse unique (puede ser null)
- rnc: sparse unique
- cedula: sparse unique
- name: text index

---

### 5. Supplier.js

**Propósito:** Proveedores de productos

```javascript
{
  name: String,             // Nombre comercial
  contactName: String,      // Nombre contacto
  email: String,
  phone: String,
  address: String,
  paymentTerms: String,     // 'immediate' | '15days' | '30days' | '60days'
  notes: String,
  isActive: Boolean,
  timestamps: true
}
```

---

### 6. Settings.js

**Propósito:** Configuración global del sistema (Singleton)

```javascript
{
  business: {
    name: String,           // Nombre del negocio
    logo: String,           // URL logo
    phone: String,
    email: String,
    address: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  fiscal: {
    taxRate: Number,        // % de impuesto (default: 16)
    currency: String,       // Código moneda (USD, MXN, etc.)
    invoicePrefix: String,  // Prefijo facturas
    timezone: String        // America/Mexico_City
  },
  alerts: {
    lowStockEnabled: Boolean,
    lowStockThreshold: Number
  },
  timestamps: true
}
```

**Métodos Estáticos:**
- `getInstance()`: Retorna o crea el único documento de Settings

---

### 7. PurchaseOrder.js

**Propósito:** Órdenes de compra a proveedores

```javascript
{
  orderNumber: String,      // Auto: PO-000001
  supplier: ObjectId,       // Ref: Supplier
  items: [{
    product: ObjectId,
    quantity: Number,
    unitCost: Number,
    subtotal: Number
  }],
  total: Number,
  status: String,           // 'pending' | 'confirmed' | 'received' | 'cancelled'
  expectedDate: Date,
  receivedDate: Date,
  notes: String,
  createdBy: ObjectId,      // Ref: User
  timestamps: true
}
```

---

### 8. CashWithdrawal.js

**Propósito:** Retiros de efectivo de caja

```javascript
{
  withdrawalNumber: String, // Auto: RET-YYYYMMDD-001
  amount: Number,
  reason: String,
  requestedBy: ObjectId,    // Ref: User (cajero)
  approvedBy: ObjectId,     // Ref: User (admin)
  status: String,           // 'pending' | 'approved' | 'rejected'
  notes: String,
  timestamps: true
}
```

---

### 9. Return.js

**Propósito:** Devoluciones de productos

```javascript
{
  returnNumber: String,     // Auto: DEV-000001
  originalSale: ObjectId,   // Ref: Sale
  items: [{
    product: ObjectId,
    quantity: Number,
    reason: String
  }],
  totalRefund: Number,
  status: String,           // 'pending' | 'approved' | 'rejected'
  processedBy: ObjectId,    // Ref: User
  notes: String,
  timestamps: true
}
```

---

### 10. CashierSession.js

**Propósito:** Cierre de caja diario

```javascript
{
  user: ObjectId,           // Ref: User (cajero)
  openingTime: Date,
  closingTime: Date,
  initialCash: Number,
  systemTotals: {
    cash: Number,
    card: Number,
    transfer: Number,
    total: Number
  },
  countedTotals: {
    cash: Number,
    card: Number,
    transfer: Number,
    total: Number
  },
  difference: Number,       // countedTotals.total - systemTotals.total
  withdrawals: Number,      // Total retiros
  notes: String,
  timestamps: true
}
```

---

### 11. AuditLog.js

**Propósito:** Auditoría de acciones de usuarios

```javascript
{
  user: ObjectId,           // Ref: User
  action: String,           // 'create' | 'update' | 'delete'
  module: String,           // 'products' | 'sales' | 'users', etc.
  entityId: ObjectId,       // ID del documento afectado
  entityType: String,       // Nombre del modelo
  changes: Mixed,           // Objeto con cambios (before/after)
  ipAddress: String,
  userAgent: String,
  timestamps: true
}
```

---

### 12. Log.js

**Propósito:** Logs del sistema (errores, info, warnings)

```javascript
{
  level: String,            // 'info' | 'warning' | 'error'
  message: String,
  module: String,
  userId: ObjectId,         // Ref: User (opcional)
  metadata: Mixed,          // Datos adicionales
  stack: String,            // Stack trace (si error)
  timestamps: true
}
```

---

## 🛣️ Backend - API Endpoints

### Base URL
```
Development: http://localhost:5000/api
Production:  https://tu-dominio.com/api
```

### Autenticación

Todas las rutas (excepto `/auth/login`) requieren header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### 1. Authentication (`/api/auth`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| POST | `/login` | ❌ | - | Iniciar sesión |
| GET | `/profile` | ✅ | - | Obtener perfil actual |
| PUT | `/profile` | ✅ | - | Actualizar perfil |

**Ejemplo - Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@autoparts.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Admin User",
  "email": "admin@autoparts.com",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Products (`/api/products`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | - | Listar productos |
| POST | `/` | ✅ | admin | Crear producto |
| GET | `/categories/list` | ✅ | - | Listar categorías |
| GET | `/brands/list` | ✅ | - | Listar marcas |
| GET | `/sku/:sku` | ✅ | - | Buscar por SKU |
| GET | `/:id` | ✅ | - | Obtener por ID |
| PUT | `/:id` | ✅ | admin | Actualizar producto |
| DELETE | `/:id` | ✅ | admin | Eliminar producto |

**Query Params (GET /):**
- `search`: Busca en SKU y nombre
- `category`: Filtra por categoría
- `brand`: Filtra por marca
- `lowStock`: true/false - Solo productos con stock bajo

**Ejemplo - Crear Producto:**
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "OIL-5W30-001",
  "name": "Aceite Motor 5W-30",
  "description": "Aceite sintético premium",
  "category": "Aceites",
  "brand": "Castrol",
  "costPrice": 150,
  "salePrice": 250,
  "stock": 50,
  "minStock": 10,
  "supplier": "507f1f77bcf86cd799439011"
}
```

---

### 3. Sales (`/api/sales`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | - | Listar ventas |
| POST | `/` | ✅ | - | Crear venta |
| GET | `/user/me` | ✅ | - | Mis ventas (cajero) |
| POST | `/close-register` | ✅ | - | Cerrar caja |
| GET | `/:id` | ✅ | - | Obtener venta |
| PUT | `/:id/cancel` | ✅ | admin | Cancelar venta |

**Ejemplo - Crear Venta:**
```http
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer": "507f1f77bcf86cd799439011",  // Opcional
  "items": [
    {
      "product": "507f191e810c19729de860ea",
      "quantity": 2
    },
    {
      "product": "507f191e810c19729de860eb",
      "quantity": 1
    }
  ],
  "paymentMethod": "cash",
  "amountPaid": 600,
  "discount": 0,
  "notes": ""
}
```

**Response:**
```json
{
  "_id": "...",
  "invoiceNumber": "INV-241007-0001",
  "items": [...],
  "subtotal": 500,
  "tax": 80,
  "discount": 0,
  "total": 580,
  "paymentMethod": "cash",
  "amountPaid": 600,
  "change": 20,
  "status": "completed"
}
```

---

### 4. Customers (`/api/customers`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | - | Listar clientes |
| POST | `/` | ✅ | - | Crear cliente |
| GET | `/:id` | ✅ | - | Obtener cliente |
| GET | `/:id/purchases` | ✅ | - | Historial compras |
| PUT | `/:id` | ✅ | - | Actualizar cliente |
| DELETE | `/:id` | ✅ | admin | Eliminar cliente |

---

### 5. Suppliers (`/api/suppliers`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | - | Listar proveedores |
| POST | `/` | ✅ | admin | Crear proveedor |
| GET | `/:id` | ✅ | - | Obtener proveedor |
| PUT | `/:id` | ✅ | admin | Actualizar proveedor |
| DELETE | `/:id` | ✅ | admin | Eliminar proveedor |

---

### 6. Users (`/api/users`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | admin | Listar usuarios |
| POST | `/` | ✅ | admin | Crear usuario |
| GET | `/:id` | ✅ | admin | Obtener usuario |
| PUT | `/:id` | ✅ | admin | Actualizar usuario |
| DELETE | `/:id` | ✅ | admin | Eliminar usuario |

---

### 7. Settings (`/api/settings`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | - | Obtener configuración |
| PUT | `/` | ✅ | admin | Actualizar configuración |

---

### 8. Dashboard (`/api/dashboard`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/stats` | ✅ | - | Estadísticas generales |
| GET | `/sales-by-day` | ✅ | - | Ventas por día (7 días) |
| GET | `/top-products` | ✅ | - | Top 5 productos vendidos |
| GET | `/sales-by-payment` | ✅ | - | Ventas por método de pago |

**Ejemplo Response - Stats:**
```json
{
  "todaySales": 1250.50,
  "monthSales": 45000.00,
  "todayTransactions": 15,
  "monthTransactions": 320,
  "averageTicket": 83.37,
  "lowStockProducts": 8,
  "totalProducts": 150,
  "activeCustomers": 45
}
```

---

### 9. Purchase Orders (`/api/purchase-orders`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | - | Listar órdenes |
| POST | `/` | ✅ | admin | Crear orden |
| GET | `/:id` | ✅ | - | Obtener orden |
| PUT | `/:id` | ✅ | admin | Actualizar orden |
| PUT | `/:id/receive` | ✅ | admin | Recibir mercancía |
| DELETE | `/:id` | ✅ | admin | Cancelar orden |

---

### 10. Returns (`/api/returns`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | - | Listar devoluciones |
| POST | `/` | ✅ | - | Crear devolución |
| GET | `/:id` | ✅ | - | Obtener devolución |
| PUT | `/:id/approve` | ✅ | admin | Aprobar devolución |
| PUT | `/:id/reject` | ✅ | admin | Rechazar devolución |

---

### 11. Cash Withdrawals (`/api/cash-withdrawals`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | - | Listar retiros |
| POST | `/` | ✅ | - | Solicitar retiro |
| PUT | `/:id/approve` | ✅ | admin | Aprobar retiro |
| PUT | `/:id/reject` | ✅ | admin | Rechazar retiro |

---

### 12. Audit Logs (`/api/audit-logs`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | admin | Listar logs de auditoría |
| GET | `/:id` | ✅ | admin | Obtener log específico |

**Query Params:**
- `user`: Filtrar por usuario
- `module`: Filtrar por módulo
- `action`: Filtrar por acción
- `startDate`, `endDate`: Filtrar por rango

---

### 13. Logs (`/api/logs`)

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|------|-----|-------------|
| GET | `/` | ✅ | admin | Listar logs del sistema |
| GET | `/stats` | ✅ | admin | Estadísticas de logs |

---

## 🎛️ Backend - Controladores

### Estructura Común

Todos los controladores siguen esta estructura:

```javascript
// @desc    Descripción de la función
// @route   Método /api/ruta
// @access  Public/Private/Admin
const nombreFuncion = async (req, res) => {
  try {
    // 1. Validar entrada
    // 2. Consultar/modificar base de datos
    // 3. Procesar lógica de negocio
    // 4. Retornar respuesta
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ 
      message: error.message 
    });
  }
};
```

### Controladores Principales

1. **authController.js** - Autenticación
   - `login()`: Valida credenciales y genera JWT
   - `getProfile()`: Retorna datos del usuario actual
   - `updateProfile()`: Actualiza perfil y password

2. **productController.js** - Gestión de Inventario
   - `getProducts()`: Lista con filtros y búsqueda
   - `createProduct()`: Valida SKU único
   - `updateProduct()`: Actualiza con validaciones
   - `deleteProduct()`: Soft delete
   - `getCategories()`: Distinct de categorías
   - `getBrands()`: Distinct de marcas

3. **saleController.js** - Ventas
   - `createSale()`: 
     * Genera invoice number
     * Valida stock
     * Actualiza stock y soldCount
     * Actualiza historial del cliente
   - `getSales()`: Lista con filtros de fecha
   - `closeCashRegister()`: Crea CashierSession

4. **dashboardController.js** - Estadísticas
   - `getDashboardStats()`: KPIs principales
   - `getSalesByDay()`: Agregación por día
   - `getTopProducts()`: Productos más vendidos

---

## 🛡️ Backend - Middleware

### 1. authMiddleware.js

**protect**
```javascript
// Verifica token JWT en Authorization header
// Decodifica y busca usuario en DB
// Inyecta req.user para uso en controladores
```

**admin**
```javascript
// Verifica que req.user.role === 'admin'
// Usar DESPUÉS de protect
```

**generateToken(id)**
```javascript
// Genera JWT con payload: { id }
// Expiración: 30 días
// Secret: process.env.JWT_SECRET
```

### 2. errorMiddleware.js

**notFound**
```javascript
// Maneja rutas no encontradas (404)
```

**errorHandler**
```javascript
// Manejo centralizado de errores
// Retorna JSON con message y stack (dev)
```

### 3. validationMiddleware.js

**validate(req, res, next)**
```javascript
// Verifica errores de express-validator
// Retorna 400 con array de errores
```

**Validaciones disponibles:**
- `productValidation`: SKU, name, prices, stock
- `userValidation`: email, password, role
- `customerValidation`: name, email, phone
- `saleValidation`: items, paymentMethod

---

## 🎨 Frontend - Estructura

### Componentes Reutilizables

**Button.jsx**
```jsx
// Variantes: primary, secondary, danger, success
// Props: onClick, disabled, loading, children
```

**Input.jsx**
```jsx
// Input con label y validación visual
// Props: label, type, value, onChange, error
```

**Modal.jsx**
```jsx
// Modal con backdrop y animaciones
// Props: isOpen, onClose, title, children
```

**Card.jsx**
```jsx
// Card con glassmorphism effect
// Clases: card-glass, glass-strong
```

### Layout

**Sidebar.jsx**
```jsx
// Menú lateral con:
// - Logo
// - Items de navegación (según rol)
// - Estado activo visual
// - Logout button
```

**Header.jsx**
```jsx
// Top bar con:
// - Título de página
// - Usuario actual
// - Notificaciones (futuro)
```

---

## 📦 Frontend - State Management

### Zustand Stores

#### authStore.js
```javascript
{
  user: null,           // Usuario actual
  token: null,          // JWT token
  isAuthenticated: false,
  
  // Actions
  login(userData),      // Guarda user + token
  logout(),             // Limpia estado y localStorage
  updateUser(data)      // Actualiza datos del usuario
}
```

**Persistencia:** localStorage (`autoparts-auth`)

#### cartStore.js
```javascript
{
  items: [],            // Items en carrito POS
  customer: null,       // Cliente seleccionado
  discount: 0,
  
  // Actions
  addItem(product, quantity),
  removeItem(productId),
  updateQuantity(productId, quantity),
  setCustomer(customer),
  setDiscount(amount),
  clearCart(),
  
  // Computed
  getSubtotal(),
  getTax(),
  getTotal()
}
```

**Persistencia:** localStorage (`autoparts-cart`)

#### settingsStore.js
```javascript
{
  settings: null,       // Configuración global
  
  // Actions
  setSettings(data),
  updateSettings(data)
}
```

---

## 🔄 Flujos de Datos Importantes

### Flujo de Venta (createSale)

```
1. Frontend (Billing.jsx)
   └─> cartStore: items, customer, paymentMethod
   
2. Envía POST /api/sales
   └─> Body: { items, customer, paymentMethod, ... }

3. Backend (saleController.createSale)
   a. Genera invoiceNumber automático
   b. Valida stock de cada producto
   c. Crea documento Sale
   d. Actualiza Product.stock (resta quantity)
   e. Actualiza Product.soldCount (+quantity)
   f. Si hay customer, actualiza:
      - Customer.totalSpent
      - Customer.lastPurchase
      - Customer.purchaseCount

4. Response: Sale completo con productos populated

5. Frontend:
   - Muestra confirmación
   - Limpia carrito
   - Genera ticket (print)
```

### Flujo de Cierre de Caja

```
1. Cajero va a CashierSession page

2. Ingresa montos reales contados:
   - Efectivo
   - Tarjeta
   - Transferencia

3. Frontend calcula:
   - Totales del sistema (desde ventas del día)
   - Totales contados (ingresados por usuario)
   - Diferencia

4. Envía POST /api/sales/close-register
   └─> Body: { countedTotals, notes }

5. Backend:
   a. Busca todas las ventas del día del usuario
   b. Calcula systemTotals
   c. Resta withdrawals del día
   d. Crea CashierSession con ambos totales
   e. Calcula difference

6. Response: CashierSession completo

7. Frontend:
   - Muestra reporte de cierre
   - Print reporte
   - Logout automático
```

### Flujo de Auditoría

```
Cada acción importante se registra automáticamente:

1. Usuario ejecuta acción (create, update, delete)

2. Controller llama a auditLogService.log()
   └─> Params: {
         user: req.user._id,
         action: 'update',
         module: 'products',
         entityId: product._id,
         changes: { before, after }
       }

3. Service crea documento AuditLog

4. Admin puede consultar:
   GET /api/audit-logs
   └─> Filtros: user, module, action, dateRange

5. Frontend muestra:
   - Timeline de acciones
   - Usuario responsable
   - Cambios específicos (diff)
```

---

## 📝 Convenciones de Código

### Nombres de Variables

```javascript
// Camel case para variables y funciones
const userName = 'John';
const getTotalSales = () => {};

// Pascal case para componentes React y clases
const Dashboard = () => {};
class ProductService {}

// UPPER_SNAKE_CASE para constantes
const API_URL = 'http://localhost:5000';
const MAX_ITEMS = 100;

// Prefijos comunes
const isActive = true;      // Boolean
const hasPermission = false;
const shouldUpdate = true;

const userList = [];        // Arrays
const productItems = [];

const handleClick = () => {}; // Event handlers
const onSubmit = () => {};
```

### Estructura de Archivos

**Controladores:**
```javascript
// 1. Imports
const Model = require('../models/Model');

// 2. Funciones (exportadas individualmente)
// @desc    Descripción
// @route   GET /api/ruta
// @access  Private/Admin
const getFuncion = async (req, res) => {
  try {
    // Código
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Exports al final
module.exports = {
  getFuncion,
  // ...
};
```

**Componentes React:**
```javascript
// 1. Imports
import { useState, useEffect } from 'react';
import api from '../services/api';

// 2. Component
const ComponentName = () => {
  // States
  const [data, setData] = useState(null);
  
  // Effects
  useEffect(() => {
    fetchData();
  }, []);
  
  // Functions
  const fetchData = async () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 3. Export
export default ComponentName;
```

### Comentarios

```javascript
// Comentarios de línea para explicaciones breves

/**
 * Comentarios de bloque para funciones importantes
 * @param {string} id - ID del documento
 * @returns {Promise<Object>} - Documento encontrado
 */
const findById = async (id) => {
  // ...
};

// TODO: Implementar funcionalidad futura
// FIXME: Arreglar bug conocido
// NOTE: Información importante
```

### Manejo de Errores

```javascript
// Backend - Always use try/catch
const controller = async (req, res) => {
  try {
    const data = await Model.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      message: error.message 
    });
  }
};

// Frontend - Use toast notifications
import toast from 'react-hot-toast';

try {
  await api.post('/endpoint', data);
  toast.success('Operación exitosa');
} catch (error) {
  toast.error(error.response?.data?.message || 'Error');
}
```

### Validaciones

```javascript
// Backend - express-validator
const { body } = require('express-validator');

const productValidation = [
  body('sku').notEmpty().withMessage('SKU requerido'),
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('salePrice').isNumeric().withMessage('Precio debe ser número'),
];

// Frontend - Inline validation
const validateForm = () => {
  if (!name) {
    setError('Nombre requerido');
    return false;
  }
  if (price <= 0) {
    setError('Precio debe ser mayor a 0');
    return false;
  }
  return true;
};
```

---

## 🔍 Debugging y Logs

### Backend Logs

```javascript
// Development
console.log('Info:', data);
console.error('Error:', error);

// Production - usar logService
const logService = require('../services/logService');

logService.info('Usuario creado', { userId: user._id });
logService.error('Error en venta', { error: error.message });
```

### Frontend Debugging

```javascript
// React DevTools para inspeccionar estado
// Redux DevTools para Zustand (con middleware)

// Console logs
console.log('State:', state);
console.table(products); // Para arrays
console.dir(user);       // Para objetos profundos
```

---

## 🧪 Testing (Futuro)

### Backend Tests (Mocha + Chai)

```javascript
describe('Product API', () => {
  it('should create a product', async () => {
    const res = await chai.request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productData);
    
    expect(res).to.have.status(201);
    expect(res.body).to.have.property('sku');
  });
});
```

### Frontend Tests (Vitest + React Testing Library)

```javascript
import { render, screen } from '@testing-library/react';
import Button from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Node.js](https://nodejs.org/docs)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)
- [Mongoose](https://mongoosejs.com/docs/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://docs.pmnd.rs/zustand)

### Herramientas de Desarrollo

- **Postman**: Probar API endpoints
- **MongoDB Compass**: Cliente GUI para MongoDB
- **VS Code Extensions**:
  - ES7+ React/Redux snippets
  - Tailwind CSS IntelliSense
  - MongoDB for VS Code
  - GitLens

---

## 📊 Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Modelos** | 12 |
| **Controladores** | 11 |
| **Rutas** | 13 archivos, 60+ endpoints |
| **Middleware** | 5 |
| **Páginas Frontend** | 15 |
| **Componentes** | 30+ |
| **Stores Zustand** | 3 |
| **Líneas de Código** | ~15,000 |

---

**Versión:** 1.0.0  
**Última Actualización:** Octubre 2025  
**Completitud:** 100%  
**Estado:** Producción Ready
