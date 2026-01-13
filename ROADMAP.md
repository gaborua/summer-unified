# ROADMAP - Summer Unified

> **Documento vivo** - Actualizar conforme avanza el proyecto

**Proyecto:** Sistema Integral de Gestión de Eventos
**Inicio:** Enero 2026
**Última actualización:** 2026-01-13

---

## Estado Actual

| Módulo | Estado | Progreso | Notas |
|--------|--------|----------|-------|
| Estructura Base | En progreso | 40% | Carpetas y archivos iniciales creados |
| Base de Datos | Listo | 100% | Schema SQL completo en `db/migrations/` |
| API Ventas | Pendiente | 0% | - |
| API Gastos | Pendiente | 0% | - |
| API Calculadora | Pendiente | 0% | - |
| Frontend Ventas | Pendiente | 0% | - |
| Frontend Gastos | Pendiente | 0% | - |
| Frontend Calculadora | Pendiente | 0% | - |
| Dashboard Principal | Pendiente | 0% | - |

---

## Fase 0: Preparación

### Objetivo
Establecer la base del proyecto unificado.

### Checklist

- [x] Crear repositorio `summer-unified`
- [x] Definir estructura de carpetas
- [x] Crear schema SQL unificado (`db/migrations/001_unified_schema.sql`)
- [x] Documentar plan de integración
- [ ] Configurar Supabase (crear proyecto)
- [ ] Ejecutar migraciones SQL en Supabase
- [ ] Configurar variables de entorno
- [ ] Configurar `vercel.json` para deploy
- [ ] Configurar Storage buckets en Supabase

### Archivos Clave
```
db/migrations/001_unified_schema.sql  ← Schema completo
vercel.json                           ← Configuración deploy
.env.example                          ← Variables requeridas
```

### Notas de Implementación
```
- El schema SQL ya incluye todas las tablas, vistas, triggers y funciones
- Las tablas existentes se renombran automáticamente como backup
- 13 categorías de gastos con 40+ subcategorías predefinidas
```

---

## Fase 1: Módulo de Ventas

### Objetivo
Implementar API y frontend para ventas de paquetes e individuales.

### Checklist

**Backend (API)**
- [ ] Crear `api/index.js` - Router principal
- [ ] Crear `api/routes/sales.js` - Endpoints de ventas
- [ ] Implementar `GET /api/sales` - Listar ventas
- [ ] Implementar `GET /api/sales/stats` - Estadísticas
- [ ] Implementar `POST /api/sales/package` - Crear venta paquete
- [ ] Implementar `POST /api/sales/individual` - Crear venta individual
- [ ] Implementar `PATCH /api/sales/:id/deliver` - Marcar entregado
- [ ] Implementar upload de comprobantes a Supabase Storage
- [ ] Testing de endpoints

**Frontend - Formularios**
- [ ] Crear `public/ventas/paquetes/index.html` - Form paquetes
- [ ] Crear `public/ventas/individuales/index.html` - Form individuales
- [ ] Implementar selección múltiple de eventos (individuales)
- [ ] Implementar upload de comprobante con preview
- [ ] Crear formularios por ciudad (Tarija, Santa Cruz, etc.)
- [ ] Validaciones de formulario

**Frontend - Dashboard**
- [ ] Crear `public/ventas/dashboard.html`
- [ ] Implementar tabs (Todas/Paquetes/Individuales)
- [ ] Implementar filtros (ciudad, fecha, estado)
- [ ] Implementar búsqueda
- [ ] Implementar exportación CSV
- [ ] Implementar acciones (marcar entregado)

### Endpoints API

```
GET    /api/sales                    → Listar ventas (filtros: sale_type, city)
GET    /api/sales/stats              → Estadísticas generales
GET    /api/sales/:id                → Detalle de una venta
POST   /api/sales/package            → Crear venta de paquete
POST   /api/sales/individual         → Crear venta individual
PATCH  /api/sales/:id/deliver        → Marcar como entregado
DELETE /api/sales/:id                → Eliminar venta (soft delete)
```

### Notas de Implementación
```
-
```

---

## Fase 2: Módulo de Gastos

### Objetivo
Implementar sistema completo de registro y control de gastos.

### Checklist

**Backend (API)**
- [ ] Crear `api/routes/expenses.js`
- [ ] Implementar `GET /api/expenses` - Listar gastos
- [ ] Implementar `GET /api/expenses/categories` - Categorías
- [ ] Implementar `GET /api/expenses/stats` - Estadísticas
- [ ] Implementar `POST /api/expenses` - Crear gasto
- [ ] Implementar `PATCH /api/expenses/:id/approve` - Aprobar
- [ ] Implementar upload de facturas/recibos
- [ ] Testing de endpoints

**Frontend - Formulario**
- [ ] Crear `public/gastos/index.html`
- [ ] Implementar selector de categoría → subcategoría (cascada)
- [ ] Implementar cálculo automático (cantidad × precio)
- [ ] Implementar upload de factura/recibo
- [ ] Asociar gasto a evento (opcional)

**Frontend - Dashboard**
- [ ] Crear `public/gastos/dashboard.html`
- [ ] Implementar filtros por categoría/subcategoría
- [ ] Implementar filtros por estado (pendiente/aprobado/pagado)
- [ ] Implementar vista por evento
- [ ] Implementar exportación CSV
- [ ] Implementar sistema de aprobación

### Endpoints API

```
GET    /api/expenses                 → Listar gastos
GET    /api/expenses/categories      → Categorías con subcategorías
GET    /api/expenses/stats           → Estadísticas por categoría
GET    /api/expenses/:id             → Detalle de un gasto
POST   /api/expenses                 → Crear gasto
PATCH  /api/expenses/:id             → Actualizar gasto
PATCH  /api/expenses/:id/approve     → Aprobar gasto
PATCH  /api/expenses/:id/pay         → Marcar como pagado
DELETE /api/expenses/:id             → Eliminar gasto
```

### Notas de Implementación
```
-
```

---

## Fase 3: Módulo de Calculadora

### Objetivo
Implementar calculadora de proyecciones financieras.

### Checklist

**Backend (API)**
- [ ] Crear `api/routes/calculations.js`
- [ ] Implementar `GET /api/calculations` - Listar cálculos
- [ ] Implementar `POST /api/calculations` - Guardar cálculo
- [ ] Implementar lógica de proyección

**Frontend**
- [ ] Crear `public/calculadora/index.html`
- [ ] Formulario de entrada (capacidad, precios, costos)
- [ ] Cálculo en tiempo real
- [ ] Mostrar punto de equilibrio
- [ ] Mostrar márgenes
- [ ] Escenarios (pesimista/realista/optimista)
- [ ] Guardar y comparar cálculos históricos

### Fórmulas

```javascript
// Ingresos proyectados
ingresos = (tickets_general × precio_general) + (tickets_vip × precio_vip)

// Punto de equilibrio
punto_equilibrio = costos_totales / precio_promedio

// Margen de ganancia
margen = ((ingresos - costos) / ingresos) × 100

// Escenarios
pesimista  = capacidad × 0.50  // 50% asistencia
realista   = capacidad × 0.75  // 75% asistencia
optimista  = capacidad × 0.95  // 95% asistencia
```

### Notas de Implementación
```
-
```

---

## Fase 4: Dashboard Principal

### Objetivo
Crear dashboard unificado con navegación entre módulos.

### Checklist

- [ ] Crear `public/index.html` - Dashboard principal
- [ ] Cards de navegación a cada módulo
- [ ] Resumen financiero general (ingresos - gastos = utilidad)
- [ ] Métricas clave (ventas totales, tickets, gastos)
- [ ] Gráficos de resumen (opcional)
- [ ] Responsive design

### Notas de Implementación
```
-
```

---

## Recursos Compartidos

### CSS (`public/shared/css/`)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `variables.css` | Variables CSS (colores, spacing) | Por crear |
| `global.css` | Estilos base | Por crear |
| `components.css` | Botones, cards, forms | Por crear |
| `dashboard.css` | Estilos de dashboard | Por crear |

### JavaScript (`public/shared/js/`)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `api-client.js` | Cliente HTTP para API | Por crear |
| `utils.js` | Funciones utilitarias | Por crear |
| `components.js` | Componentes reutilizables | Por crear |

---

## Variables de Entorno

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Opcional
NODE_ENV=production
```

---

## Comandos Útiles

```bash
# Desarrollo local
npm install
npm run dev

# Deploy
vercel --prod

# Base de datos
# Ejecutar SQL en Supabase Dashboard → SQL Editor
```

---

## Log de Actualizaciones

### 2026-01-13
- Creado repositorio `summer-unified`
- Estructura inicial de carpetas
- Schema SQL completo v2.0
- Documentación inicial

### [Próxima fecha]
- ...

---

## Decisiones Técnicas

| Decisión | Opción Elegida | Razón |
|----------|----------------|-------|
| Framework Backend | Express.js | Consistencia con sistemas existentes |
| Framework Frontend | Vanilla JS + HTML | Simple, sin build step, fácil mantenimiento |
| Base de Datos | Supabase (PostgreSQL) | Ya en uso, Storage incluido |
| Deploy | Vercel | Serverless, integración con Supabase |
| Autenticación | Pendiente | Evaluar si es necesario |

---

## Contacto y Recursos

- **Repositorio:** https://github.com/gaborua/summer-unified
- **Supabase Dashboard:** [Por configurar]
- **Vercel Dashboard:** [Por configurar]
- **Documentación detallada:** `docs/PLAN-MAESTRO-INTEGRACION.md`
