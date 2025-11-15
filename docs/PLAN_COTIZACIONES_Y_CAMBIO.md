# Plan de Implementación: Cotizaciones y Cálculo de Cambio

## 📋 Resumen Ejecutivo

Implementar dos nuevas características para mejorar el flujo de ventas:
1. **Sistema de Cotizaciones**: Crear presupuestos previos a la venta
2. **Cálculo de Cambio**: Mostrar devolución automática en el proceso de pago

---

## 🎯 Feature 1: Sistema de Cotizaciones

### Descripción
Permitir a los usuarios crear cotizaciones (presupuestos) que pueden:
- Enviarse al cliente por email/WhatsApp
- Imprimirse en PDF
- Convertirse en venta con un clic
- Tener fecha de vencimiento
- Incluir términos y condiciones personalizados

### Modelo de Datos

#### `models/Quotation.js`
```javascript
{
  quotationNumber: String (único, ej: COT-000001),
  customer: ObjectId (ref: Customer),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    unitPrice: Number,
    discount: Number (opcional, % o monto fijo),
    subtotal: Number
  }],
  subtotal: Number,
  tax: Number (ITBIS 18%),
  total: Number,
  status: String [Pendiente, Aprobada, Rechazada, Convertida, Vencida],
  validUntil: Date (fecha de vencimiento),
  notes: String (notas internas),
  terms: String (términos y condiciones),
  createdBy: ObjectId (ref: User),
  convertedToSale: ObjectId (ref: Sale, null si no se ha convertido),
  createdAt: Date,
  updatedAt: Date
}
```

### Backend (API)

#### `controllers/quotationController.js`
- `getQuotations` - Listar cotizaciones con filtros (status, fecha, cliente)
- `getQuotationById` - Obtener detalle de cotización
- `createQuotation` - Crear nueva cotización
- `updateQuotation` - Editar cotización (solo si status === Pendiente)
- `deleteQuotation` - Eliminar cotización (solo admin)
- `convertToSale` - Convertir cotización a venta
- `sendQuotationEmail` - Enviar cotización por email
- `generateQuotationPDF` - Generar PDF para imprimir/descargar

#### `routes/quotationRoutes.js`
```javascript
GET    /api/quotations          // Listar
GET    /api/quotations/:id      // Ver detalle
POST   /api/quotations          // Crear
PUT    /api/quotations/:id      // Editar
DELETE /api/quotations/:id      // Eliminar
POST   /api/quotations/:id/convert  // Convertir a venta
POST   /api/quotations/:id/send     // Enviar por email
GET    /api/quotations/:id/pdf      // Generar PDF
```

#### Validaciones y Lógica de Negocio
- Solo se pueden editar cotizaciones con status "Pendiente"
- Al convertir a venta, validar stock disponible
- Marcar como "Vencida" automáticamente si pasa `validUntil`
- Al crear venta desde cotización, copiar todos los datos y marcar como "Convertida"

### Frontend (UI)

#### Nuevas Páginas
1. **`client/src/pages/Quotations.jsx`**
   - Tabla de cotizaciones con filtros
   - Badges de estado con colores
   - Botones: Ver, Editar, Convertir a Venta, Imprimir, Enviar
   - Modal de creación/edición (similar a PurchaseOrders)
   - Vista previa antes de enviar/imprimir

2. **`client/src/pages/QuotationDetail.jsx`** (modal)
   - Ver todos los detalles
   - Historial de cambios (si se implementa audit)
   - Botón "Convertir a Venta"
   - Botón "Enviar por Email"
   - Botón "Imprimir PDF"

#### Integración en Sidebar
```javascript
// En Sidebar.jsx, dentro de "Ventas"
{
  path: '/cotizaciones',
  label: 'Cotizaciones',
  icon: FileText,
  shortcut: ''
}
```

#### Componentes Reutilizables
- `QuotationForm.jsx` - Formulario de creación/edición
- `QuotationStatusBadge.jsx` - Badge de estado
- `QuotationPDFTemplate.jsx` - Template para PDF

### Servicios

#### `services/quotationService.js` (backend)
```javascript
// Generar PDF usando pdfkit
generateQuotationPDF(quotation)

// Enviar email con PDF adjunto
sendQuotationEmail(quotation, recipientEmail)

// Job cron para marcar cotizaciones vencidas
checkExpiredQuotations() // Ejecutar diariamente
```

### Prioridad de Implementación
1. ✅ Crear modelo `Quotation.js`
2. ✅ Crear rutas y controlador básico (CRUD)
3. ✅ Crear página de listado en frontend
4. ✅ Crear modal de creación/edición
5. ✅ Implementar conversión a venta
6. ✅ Implementar generación de PDF
7. ✅ Implementar envío por email
8. ✅ Agregar job cron para vencimientos

**Tiempo Estimado:** 8-12 horas

---

## 💰 Feature 2: Cálculo Automático de Cambio

### Descripción
Agregar un campo "Monto Recibido" en el proceso de pago que:
- Calcule automáticamente el cambio: `Recibido - Total`
- Muestre el cambio en grande y visible
- Valide que el monto recibido sea >= total
- Solo aplique para pagos en Efectivo

### Ubicación
**Página:** `client/src/pages/Billing.jsx` (modal de confirmar venta)

### Cambios en el Frontend

#### Modificar Modal de Confirmación
```jsx
// En Billing.jsx, dentro del modal de confirmar venta

const [amountReceived, setAmountReceived] = useState('');
const [change, setChange] = useState(0);

// Calcular cambio automáticamente
useEffect(() => {
  if (paymentMethod === 'Efectivo' && amountReceived) {
    const received = parseFloat(amountReceived) || 0;
    const totalAmount = parseFloat(total) || 0;
    setChange(received - totalAmount);
  } else {
    setChange(0);
  }
}, [amountReceived, total, paymentMethod]);

// En el JSX del modal:
{paymentMethod === 'Efectivo' && (
  <>
    <div>
      <label className="block text-sm font-medium mb-2">
        Monto Recibido *
      </label>
      <input
        type="number"
        step="0.01"
        min={total}
        value={amountReceived}
        onChange={(e) => setAmountReceived(e.target.value)}
        className="input"
        placeholder={`Mínimo: $${total.toFixed(2)}`}
        required
      />
    </div>

    {amountReceived && (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-green-700 dark:text-green-300">
            Cambio a Devolver:
          </span>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            ${change >= 0 ? change.toFixed(2) : '0.00'}
          </span>
        </div>
        {change < 0 && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            ⚠️ El monto recibido es menor al total
          </p>
        )}
      </div>
    )}
  </>
)}
```

#### Validación antes de Completar Venta
```javascript
const handleCompleteSale = async () => {
  // Validar monto recibido para efectivo
  if (paymentMethod === 'Efectivo') {
    const received = parseFloat(amountReceived) || 0;
    if (received < total) {
      toast.error('El monto recibido debe ser mayor o igual al total');
      return;
    }
  }

  // ... resto de la lógica de venta
};
```

#### Mostrar Cambio en Ticket Impreso
```javascript
// En el template de impresión (Billing.jsx, función handlePrint)
{paymentMethod === 'Efectivo' && amountReceived && (
  <>
    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
      <span>Recibido:</span>
      <strong>${parseFloat(amountReceived).toFixed(2)}</strong>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 5px; padding: 10px; background: #f0f0f0; font-size: 16px;">
      <span><strong>Cambio:</strong></span>
      <strong>${(parseFloat(amountReceived) - total).toFixed(2)}</strong>
    </div>
  </>
)}
```

### Cambios en el Backend (Opcional)
Si quieres guardar el historial de cambio:

#### Modificar `models/Sale.js`
```javascript
// Agregar campos opcionales
amountReceived: {
  type: Number,
  required: false
},
changeGiven: {
  type: Number,
  required: false
}
```

#### Modificar `controllers/saleController.js`
```javascript
// En createSale, guardar los campos si vienen
if (req.body.amountReceived) {
  saleData.amountReceived = req.body.amountReceived;
  saleData.changeGiven = req.body.amountReceived - total;
}
```

### Prioridad de Implementación
1. ✅ Agregar estado `amountReceived` y `change` en Billing.jsx
2. ✅ Agregar campo input "Monto Recibido" (solo para Efectivo)
3. ✅ Implementar cálculo automático con useEffect
4. ✅ Agregar sección visual del cambio (destacada)
5. ✅ Agregar validación antes de completar venta
6. ✅ Mostrar cambio en ticket impreso
7. ⚪ (Opcional) Guardar en BD para auditoría

**Tiempo Estimado:** 2-3 horas

---

## 🗓️ Cronograma de Implementación

### Fase 1: Cálculo de Cambio (Prioritario)
**Duración:** 1 día
- ✅ Fácil de implementar
- ✅ Alto impacto inmediato
- ✅ No requiere nuevos modelos

**Orden:**
1. Frontend: Agregar campo y lógica en `Billing.jsx`
2. Validación y UI del cambio
3. Integración en ticket impreso
4. Testing con diferentes escenarios

### Fase 2: Sistema de Cotizaciones
**Duración:** 3-4 días

**Día 1: Backend**
- Crear modelo `Quotation.js`
- Crear rutas y controlador básico
- Testing con Postman

**Día 2: Frontend Básico**
- Crear página de listado
- Crear modal de creación/edición
- Integrar con API

**Día 3: Conversión y PDF**
- Implementar conversión a venta
- Generar PDF con pdfkit
- Vista previa de cotización

**Día 4: Email y Pulido**
- Implementar envío por email
- Job cron para vencimientos
- Testing end-to-end
- Ajustes de UI/UX

---

## 📦 Dependencias Necesarias

### Para Cotizaciones
```json
{
  "pdfkit": "^0.15.0",           // Generación de PDFs
  "node-cron": "^3.0.3",         // Jobs programados
  "qrcode": "^1.5.4"             // QR codes en PDF (opcional)
}
```

### Para Cálculo de Cambio
No requiere dependencias adicionales ✅

---

## ✅ Checklist de Completitud

### Cálculo de Cambio
- [ ] Campo "Monto Recibido" en modal
- [ ] Cálculo automático del cambio
- [ ] Validación de monto suficiente
- [ ] UI destacada para mostrar cambio
- [ ] Integración en ticket impreso
- [ ] Testing con diferentes montos
- [ ] Documentación de uso

### Sistema de Cotizaciones
- [ ] Modelo Quotation creado
- [ ] API endpoints funcionando
- [ ] Página de listado
- [ ] Modal de creación/edición
- [ ] Conversión a venta
- [ ] Generación de PDF
- [ ] Envío por email
- [ ] Job cron para vencimientos
- [ ] Integración en sidebar
- [ ] Testing end-to-end
- [ ] Documentación técnica

---

## 🎨 Mockups / Referencias Visuales

### Cálculo de Cambio
```
┌─────────────────────────────────┐
│  Total a Pagar:    $350.00     │
│                                 │
│  Monto Recibido:  [500.00____] │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 💵 Cambio a Devolver:     │ │
│  │     $150.00               │ │
│  └───────────────────────────┘ │
│                                 │
│     [Completar Venta]          │
└─────────────────────────────────┘
```

### Listado de Cotizaciones
```
┌────────────────────────────────────────────────────┐
│ 🧾 Cotizaciones                    [+ Nueva]       │
├────────────────────────────────────────────────────┤
│ COT-000001  Juan Pérez    $1,250  [Pendiente]     │
│ COT-000002  María López   $840    [Convertida]    │
│ COT-000003  Carlos Ruiz   $3,200  [Vencida]       │
└────────────────────────────────────────────────────┘
```

---

## 🚀 Orden Recomendado de Ejecución

1. **Implementar Cálculo de Cambio** (rápido, alto valor)
2. **Crear modelo y API de Cotizaciones** (base sólida)
3. **Desarrollar UI de Cotizaciones** (experiencia visual)
4. **Agregar conversión a venta** (conectar workflows)
5. **Implementar PDF y Email** (funcionalidad completa)
6. **Testing y refinamiento** (calidad final)

---

## 📝 Notas Adicionales

### Consideraciones
- Las cotizaciones NO afectan el inventario hasta convertirse en venta
- El cambio solo aplica para método "Efectivo"
- Considerar agregar descuentos por item en cotizaciones
- Evaluar si se necesita historial de cotizaciones en el dashboard

### Mejoras Futuras
- [ ] Plantillas de cotización personalizables
- [ ] Recordatorios automáticos de cotizaciones próximas a vencer
- [ ] Estadísticas de tasa de conversión (cotización → venta)
- [ ] Firma digital del cliente en cotización
- [ ] Integración con WhatsApp Business API
