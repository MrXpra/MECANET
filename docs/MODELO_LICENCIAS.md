# Modelo de Licencias y Cobro para SaaS

## 🎯 Modelo Recomendado: Licencia Todo Incluido

### Concepto
Tú mantienes TODAS las cuentas técnicas (Railway, MongoDB Atlas, Vercel) y cobras una tarifa única mensual/anual al cliente que incluye todo.

### Ventajas
- ✅ Cliente solo paga una factura simple
- ✅ Tú tienes control total de la infraestructura
- ✅ Puedes ofrecer soporte técnico incluido
- ✅ Más fácil de escalar (descuentos por volumen en servicios)
- ✅ Sin riesgos legales de manejar tarjetas
- ✅ Puedes ofrecer diferentes planes

---

## 📊 Estructura de Precios Sugerida

### Plan Básico - $30-50/mes
- 1 usuario administrador + 2 empleados
- 1000 productos
- 500 ventas/mes
- Soporte por email (24-48h)
- Backups semanales

### Plan Profesional - $75-100/mes
- Usuarios ilimitados
- Productos ilimitados
- Ventas ilimitadas
- Soporte prioritario (12h)
- Backups diarios
- Reportes avanzados

### Plan Enterprise - $150-200/mes
- Todo lo anterior +
- Subdominios personalizados
- Soporte 24/7
- Backups en tiempo real
- Personalización de marca
- Integración con contabilidad

---

## 💳 Métodos de Pago Recomendados

### 1. Stripe Billing (Mejor opción)
```
Ventajas:
- Suscripciones automáticas
- Facturación automática
- Portal de cliente integrado
- Soporte para múltiples monedas
- Cumple con PCI DSS
- Fácil integración

Costos:
- 2.9% + $0.30 por transacción exitosa
- Sin costos mensuales base
```

### 2. PayPal Subscriptions
```
Ventajas:
- Muy conocido en LATAM
- Fácil de usar
- Confianza del consumidor

Costos:
- 4.4% + tarifa fija
- Más caro que Stripe
```

### 3. Pagos manuales (Inicio)
```
Ventajas:
- Sin costos de plataforma
- Control total

Desventajas:
- Mucho trabajo manual
- No automático
- Difícil de escalar
```

---

## 🔧 Implementación en el Sistema

### Paso 1: Agregar módulo de licencias

Crear tabla de licencias en MongoDB:

```javascript
// models/License.js
{
  clientId: ObjectId,
  plan: 'basic' | 'professional' | 'enterprise',
  status: 'active' | 'suspended' | 'cancelled' | 'trial',
  startDate: Date,
  endDate: Date,
  autoRenew: Boolean,
  stripeSubscriptionId: String,
  limits: {
    maxUsers: Number,
    maxProducts: Number,
    maxSalesPerMonth: Number,
  },
  usage: {
    currentUsers: Number,
    currentProducts: Number,
    salesThisMonth: Number,
  }
}
```

### Paso 2: Middleware de verificación

```javascript
// middleware/licenseMiddleware.js
const checkLicense = async (req, res, next) => {
  const license = await License.findOne({ 
    clientId: req.user.clientId,
    status: 'active',
    endDate: { $gt: new Date() }
  });

  if (!license) {
    return res.status(403).json({ 
      error: 'Licencia expirada o inactiva',
      message: 'Por favor contacta al administrador'
    });
  }

  // Verificar límites
  if (license.usage.salesThisMonth >= license.limits.maxSalesPerMonth) {
    return res.status(403).json({ 
      error: 'Límite de ventas alcanzado',
      message: 'Actualiza tu plan para continuar'
    });
  }

  req.license = license;
  next();
};
```

### Paso 3: Dashboard de administración para ti

Crear sección administrativa donde puedas:
- Ver todos los clientes
- Estado de sus licencias
- Uso de recursos
- Activar/Desactivar clientes
- Ver pagos pendientes

### Paso 4: Portal del cliente

En el sistema del cliente, agregar sección:
- Ver estado de licencia
- Días restantes
- Uso actual vs límites
- Botón para actualizar plan
- Historial de pagos

---

## 🎨 UI Sugerida en el Sistema

### Banner de Estado de Licencia

```jsx
// Mostrar en el header cuando esté cerca de vencer
{daysRemaining <= 7 && (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
    <p className="text-yellow-700">
      ⚠️ Tu licencia vence en {daysRemaining} días.
      <button onClick={contactAdmin}>Renovar ahora</button>
    </p>
  </div>
)}

{license.status === 'suspended' && (
  <div className="bg-red-100 border-l-4 border-red-500 p-4">
    <p className="text-red-700">
      🚫 Licencia suspendida. Contacta al proveedor.
    </p>
  </div>
)}
```

### Página de Configuración de Licencia

```jsx
<div className="card">
  <h2>Estado de tu Licencia</h2>
  
  <div className="plan-info">
    <h3>Plan: {license.plan}</h3>
    <p>Estado: {license.status}</p>
    <p>Vence: {license.endDate}</p>
  </div>

  <div className="usage-meters">
    <ProgressBar 
      label="Usuarios"
      current={license.usage.currentUsers}
      max={license.limits.maxUsers}
    />
    <ProgressBar 
      label="Productos"
      current={license.usage.currentProducts}
      max={license.limits.maxProducts}
    />
    <ProgressBar 
      label="Ventas este mes"
      current={license.usage.salesThisMonth}
      max={license.limits.maxSalesPerMonth}
    />
  </div>

  <button onClick={upgradeOrContact}>
    Actualizar Plan
  </button>
</div>
```

---

## 💰 Cálculo de Costos Real

### Costos por Cliente (mensual)

```
Railway (Hobby):              $5/mes
MongoDB Atlas (M0 Free):      $0/mes (hasta 512MB)
Vercel (Hobby):               $0/mes
Total costos directos:        $5/mes por cliente

Con 10 clientes:
- Costos: $50/mes
- Ingresos (Plan Básico $40/mes): $400/mes
- Ganancia: $350/mes (88% margen)

Con 50 clientes:
- Costos: $250/mes (puede negociar descuentos)
- Ingresos: $2,000/mes
- Ganancia: $1,750/mes
```

### Escalabilidad

```
1-10 clientes:   Modelo individual (1 instancia por cliente)
10-50 clientes:  Multi-tenancy (múltiples clientes en 1 BD)
50+ clientes:    Infraestructura dedicada + CDN
```

---

## 🔒 Seguridad Multi-tenant

Si decides usar multi-tenancy (varios clientes en la misma BD):

```javascript
// Agregar clientId a TODAS las queries
const sales = await Sale.find({ 
  clientId: req.user.clientId,
  date: { $gte: startDate }
});

// Middleware automático
schema.pre('find', function() {
  if (this.options.clientId) {
    this.where({ clientId: this.options.clientId });
  }
});
```

---

## 📧 Comunicación con Clientes

### Email automático: 7 días antes de vencer
```
Asunto: Tu licencia de MECANET vence pronto

Hola [Cliente],

Tu licencia del Plan [PLAN] vence el [FECHA].

Para renovar automáticamente, haz clic aquí: [LINK]

O contáctanos: soporte@tuempresa.com
WhatsApp: +1-XXX-XXX-XXXX
```

### Email: Licencia expirada
```
Asunto: Tu licencia ha expirado

Tu acceso ha sido suspendido temporalmente.

Tus datos están seguros y serán conservados por 30 días.

Renueva ahora: [LINK]
```

---

## 🚀 Plan de Implementación

### Fase 1: Setup Inicial (Semana 1-2)
- [ ] Crear cuenta de Stripe
- [ ] Configurar productos y precios en Stripe
- [ ] Crear modelo de License en MongoDB
- [ ] Implementar middleware de verificación

### Fase 2: UI Cliente (Semana 3)
- [ ] Página de estado de licencia
- [ ] Banner de advertencia
- [ ] Bloqueo de acceso si expirado

### Fase 3: Panel Admin (Semana 4)
- [ ] Dashboard de todos los clientes
- [ ] Gestión de licencias
- [ ] Activar/desactivar clientes
- [ ] Reportes de uso

### Fase 4: Automatización (Semana 5-6)
- [ ] Webhooks de Stripe
- [ ] Emails automáticos
- [ ] Renovación automática
- [ ] Testing completo

---

## 🎁 Extras para Aumentar Valor

1. **Trial gratuito:** 14-30 días sin tarjeta
2. **Descuento anual:** 2 meses gratis si paga anual
3. **Referidos:** 10% descuento por cada cliente referido
4. **Soporte incluido:** Hace que valga más la pena
5. **Capacitación inicial:** 2 horas de onboarding
6. **Actualizaciones gratuitas:** Nuevas features sin costo
7. **Backups garantizados:** Tranquilidad para el cliente

---

## ❌ Lo que NO debes hacer

- ❌ Dar acceso directo a cuentas de Railway/Vercel/MongoDB
- ❌ Enseñarles a administrar infraestructura
- ❌ Cobrar "costo directo" (sin margen)
- ❌ Manejar tarjetas directamente en tu app
- ❌ Permitir customización de código sin control
- ❌ Prometer uptime 100% sin SLA definido

---

## 📞 Siguiente Paso Recomendado

1. **Ahora:** Implementar sistema de licencias básico
2. **Corto plazo:** Integrar Stripe Billing
3. **Mediano plazo:** Automatizar todo el flujo
4. **Largo plazo:** Considerar multi-tenancy para escalar

¿Quieres que implemente el sistema de licencias en el código?
