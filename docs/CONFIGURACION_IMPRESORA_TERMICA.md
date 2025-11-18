# Configuración de Impresora Térmica 2commet 2C-POS80-02

## Problema Común: Error al Imprimir

Si aparece un error al intentar imprimir facturas, sigue estos pasos:

---

## ✅ Paso 1: Verificar Instalación de Drivers

1. **Descargar drivers oficiales:**
   - Busca "2commet 2C-POS80-02 driver" en Google
   - O descarga drivers genéricos de impresoras térmicas POS 80mm
   - Link alternativo: Drivers de Epson TM-T20 (compatibles con la mayoría de térmicas 80mm)

2. **Instalar el driver:**
   - Ejecuta el instalador como Administrador
   - Reinicia la computadora después de la instalación

---

## ✅ Paso 2: Configurar la Impresora en Windows

### Agregar Impresora:

1. **Windows 11/10:**
   ```
   Configuración → Dispositivos → Impresoras y escáneres → Agregar impresora
   ```

2. **Seleccionar puerto:**
   - Si es **USB**: Debería detectarse automáticamente
   - Si es **Serial (COM)**: Seleccionar puerto COM correcto
   - Si es **Red/Ethernet**: Agregar por dirección IP

3. **Establecer como predeterminada:**
   - Click derecho en la impresora → "Establecer como impresora predeterminada"

---

## ✅ Paso 3: Configurar Tamaño de Papel

⚠️ **MUY IMPORTANTE para impresoras térmicas:**

1. **Abrir Propiedades de la Impresora:**
   ```
   Panel de Control → Dispositivos e impresoras → Click derecho en tu impresora → Propiedades de impresora
   ```

2. **Configurar tamaño personalizado:**
   - Ve a la pestaña **"Preferencias"** o **"Opciones avanzadas"**
   - Busca **"Tamaño de papel"** o **"Paper Size"**
   - Selecciona o crea un tamaño personalizado:
     - **Ancho:** 80mm
     - **Alto:** Auto o 297mm (máximo)
     - **Orientación:** Vertical (Portrait)

3. **Márgenes:**
   - Establecer todos los márgenes en **0mm** o mínimo posible

---

## ✅ Paso 4: Configuración en el Navegador

### Google Chrome:
1. Abre Chrome y ve a: `chrome://settings/printing`
2. **Configuración predeterminada:**
   - Impresora: Selecciona tu impresora térmica
   - Tamaño de papel: 80mm x Auto
   - Márgenes: Ninguno
   - Escala: 100%

### Microsoft Edge:
1. Configuración → Impresión
2. Ajustar las mismas opciones que en Chrome

### Firefox:
1. `about:config` en la barra de direcciones
2. Buscar `print.printer_` y configurar tu impresora predeterminada

---

## ✅ Paso 5: Permitir Ventanas Emergentes

El sistema abre una ventana emergente para imprimir. Asegúrate de permitirlas:

1. **En Chrome/Edge:**
   ```
   Configuración → Privacidad y seguridad → Configuración de sitios → 
   Ventanas emergentes y redirecciones → Permitir para tu sitio web
   ```

2. **O cuando aparezca el icono de "pop-up bloqueado":**
   - Click en el icono en la barra de direcciones
   - Seleccionar "Permitir siempre ventanas emergentes de este sitio"

---

## ✅ Paso 6: Probar Impresión

### Prueba Directa desde Windows:
1. Panel de Control → Dispositivos e impresoras
2. Click derecho en tu impresora → "Imprimir página de prueba"
3. Debería imprimir correctamente

### Prueba desde el Sistema:
1. Ve a Facturación
2. Agrega un producto
3. Procesar pago
4. Click en "Imprimir"

---

## 🔧 Solución de Problemas Comunes

### Problema: "No se pudo abrir la ventana de impresión"
**Solución:** Permitir ventanas emergentes (ver Paso 5)

### Problema: La impresora imprime pero está en blanco
**Soluciones:**
- Verificar que el papel térmico esté colocado correctamente (lado térmico hacia arriba)
- El papel térmico puede estar vencido (probar con papel nuevo)
- Limpiar el cabezal térmico con alcohol isopropílico

### Problema: El formato se ve mal o cortado
**Soluciones:**
- Verificar configuración de tamaño de papel en Windows (debe ser 80mm)
- Asegurarse que los márgenes estén en 0mm
- En las preferencias del navegador, seleccionar "Ninguno" en márgenes

### Problema: "Error al enviar a la impresora"
**Soluciones:**
1. **Verificar conexión:**
   - USB: Cambiar puerto USB o cable
   - Red: Verificar conectividad (ping a la IP)
   - Serial: Verificar puerto COM correcto

2. **Reiniciar servicios:**
   - Abrir Servicios de Windows (`services.msc`)
   - Buscar "Cola de impresión" (Print Spooler)
   - Click derecho → Reiniciar

3. **Permisos:**
   - Ejecutar el navegador como Administrador temporalmente

### Problema: La impresora está "Offline" o "Pausada"
**Solución:**
1. Panel de Control → Dispositivos e impresoras
2. Click derecho en tu impresora
3. Desmarcar "Usar impresora sin conexión"
4. Desmarcar "Pausar impresión"

---

## 📋 Configuración Recomendada Final

```
✓ Driver instalado y actualizado
✓ Impresora establecida como predeterminada
✓ Tamaño de papel: 80mm x Auto
✓ Márgenes: 0mm en todos los lados
✓ Ventanas emergentes permitidas en el navegador
✓ Impresora conectada y en estado "Lista"
```

---

## 🆘 Si Nada Funciona

1. **Desinstalar completamente el driver actual:**
   - Panel de Control → Dispositivos e impresoras
   - Eliminar la impresora
   - Panel de Control → Programas → Desinstalar el driver

2. **Instalar driver genérico de Windows:**
   - Agregar impresora → "La impresora que quiero no está en la lista"
   - Seleccionar "Agregar impresora local o de red"
   - Usar driver genérico "Generic / Text Only"
   - Configurar puerto correcto

3. **Contactar soporte:**
   - Verificar manual de usuario de la impresora 2commet 2C-POS80-02
   - Contactar soporte técnico de 2commet
   - Puede ser un problema de hardware

---

## 💡 Notas Adicionales

- **Papel térmico:** Tiene una vida útil de 6-12 meses sin uso
- **Cabezal térmico:** Limpiar cada 1-2 meses para mejor calidad
- **Corte automático:** Algunas impresoras tienen guillotina automática, verifica si está habilitada
- **Velocidad de impresión:** Ajustar en preferencias si imprime demasiado rápido o lento

---

## ✅ Checklist Rápido

Antes de reportar un error, verifica:

- [ ] Driver instalado correctamente
- [ ] Impresora aparece en "Dispositivos e impresoras"
- [ ] Estado de la impresora es "Lista" (no "Sin conexión" ni "Pausada")
- [ ] Tamaño de papel configurado en 80mm
- [ ] Ventanas emergentes permitidas
- [ ] Página de prueba de Windows imprime correctamente
- [ ] Papel térmico colocado correctamente
- [ ] Cable USB conectado firmemente (o conexión de red activa)

Si todos estos puntos están ✓ y aún no funciona, puede ser un problema de hardware o driver específico del modelo.
