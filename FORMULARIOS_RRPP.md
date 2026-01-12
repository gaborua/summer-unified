# 🔒 Formularios para RRPPs - Summer Festival

## 📋 **Formularios Aislados de Ventas**

Estos formularios están diseñados específicamente para ser compartidos con RRPPs externos **sin acceso** al sistema principal.

### 🎫 **Formulario de Ventas Individuales**
**URL**: `https://tu-dominio.vercel.app/ventas/individuales/index.html`

**Características**:
- ✅ Registro de ventas para eventos específicos
- ✅ Selección múltiple de eventos con cantidades
- ✅ Cálculo automático del total
- ✅ Upload de comprobantes de pago
- ❌ Sin acceso a dashboard o estadísticas
- ❌ Sin navegación a otras páginas del sistema

### 🎁 **Formulario de Ventas de Paquetes**
**URL**: `https://tu-dominio.vercel.app/ventas/paquetes/index.html`

**Características**:
- ✅ Registro de ventas de paquetes predefinidos
- ✅ Selección de paquetes con descuentos automáticos
- ✅ Upload de comprobantes de pago
- ✅ Reseteo automático para múltiples ventas
- ❌ Sin acceso a dashboard o estadísticas
- ❌ Sin navegación a otras páginas del sistema

## 🔐 **Medidas de Seguridad Implementadas**

### **1. Aislamiento Total**
- **Sin navegación**: No hay links al dashboard, reportes o estadísticas
- **Sin datos sensibles**: No muestran ingresos, gastos o métricas del negocio
- **Sin redirecciones**: Después de registrar una venta, permanecen en el formulario

### **2. Solo Funcionalidad Necesaria**
- **Registro únicamente**: Solo pueden crear ventas, no ver, editar o eliminar
- **Validaciones locales**: Verifican datos antes de enviar
- **Feedback mínimo**: Solo confirman si la venta se registró o no

### **3. Control de Acceso**
- **URLs directas**: Se pueden compartir links específicos
- **Sin autenticación**: No requieren login (simplicidad para RRPPs)
- **API protegida**: El backend valida y filtra todas las operaciones

## 📤 **Cómo Compartir con RRPPs**

### **Opción 1: Links Directos**
```
Ventas Individuales: https://tu-dominio.vercel.app/ventas/individuales/index.html
Ventas Paquetes: https://tu-dominio.vercel.app/ventas/paquetes/index.html
```

### **Opción 2: QR Codes**
Genera códigos QR de estos links para fácil acceso desde móviles.

### **Opción 3: Iframe (Opcional)**
```html
<iframe src="https://tu-dominio.vercel.app/ventas/individuales/index.html" 
        width="100%" height="800px" frameborder="0">
</iframe>
```

## 📋 **Instrucciones para RRPPs**

### **Ventas Individuales**
1. **Completar datos del cliente** (nombre, teléfono requeridos)
2. **Seleccionar eventos** y especificar cantidades
3. **Verificar el total** calculado automáticamente
4. **Subir comprobante** de pago (JPG, PNG, PDF)
5. **Enviar formulario** - aparecerá confirmación
6. **Formulario se resetea** automáticamente para la próxima venta

### **Ventas de Paquetes**
1. **Seleccionar paquete** disponible
2. **Completar datos del cliente**
3. **Verificar precio** con descuento aplicado
4. **Subir comprobante** de pago
5. **Enviar formulario** - aparecerá confirmación
6. **Formulario se resetea** para continuar

## ⚠️ **Restricciones Importantes**

### **Lo que NO pueden hacer los RRPPs**:
- ❌ Ver estadísticas de ventas totales
- ❌ Acceder al dashboard administrativo
- ❌ Ver información de gastos o finanzas
- ❌ Modificar o eliminar ventas existentes
- ❌ Acceder a datos de otros RRPPs
- ❌ Ver reportes o análisis financieros

### **Lo que SÍ pueden hacer**:
- ✅ Registrar nuevas ventas únicamente
- ✅ Subir comprobantes de pago
- ✅ Ver confirmación de registro exitoso
- ✅ Usar el formulario tantas veces como necesiten

## 🔄 **Flujo de Trabajo Recomendado**

1. **Administrador** comparte links específicos con RRPPs
2. **RRPPs** registran ventas directamente en los formularios
3. **Datos** se almacenan automáticamente en Supabase
4. **Administrador** ve todas las ventas en el dashboard principal
5. **Validación** y seguimiento desde el sistema administrativo

## 📊 **Beneficios de Este Enfoque**

- **Seguridad**: Información financiera protegida
- **Simplicidad**: RRPPs solo ven lo que necesitan
- **Eficiencia**: Registro rápido sin capacitación compleja
- **Control**: Administrador mantiene visibilidad total
- **Escalabilidad**: Se pueden agregar más RRPPs fácilmente

## 🚀 **Próximos Pasos**

1. **Probar formularios** con datos reales
2. **Capacitar RRPPs** con instrucciones simples
3. **Monitorear registros** desde dashboard administrativo
4. **Ajustar validaciones** según feedback inicial