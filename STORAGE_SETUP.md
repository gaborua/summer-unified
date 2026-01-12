# Configuración de Storage - Supabase

## 1. Ejecutar Script de Configuración

En el SQL Editor de Supabase, ejecuta el archivo:
```sql
-- Contenido del archivo: db/storage/setup_buckets.sql
```

## 2. Buckets Creados

### 📁 **receipts** (Privado)
- **Propósito**: Almacenar recibos de pago y documentos de transacciones
- **Límite**: 5MB por archivo
- **Tipos permitidos**: JPEG, PNG, GIF, PDF
- **Acceso**: Solo usuarios autenticados

### 📁 **documents** (Privado) 
- **Propósito**: Documentos generales del sistema
- **Límite**: 10MB por archivo
- **Tipos permitidos**: JPEG, PNG, GIF, PDF, DOC, DOCX
- **Acceso**: Solo usuarios autenticados

### 📁 **event-images** (Público)
- **Propósito**: Imágenes de eventos y contenido público
- **Límite**: 5MB por archivo
- **Tipos permitidos**: JPEG, PNG, GIF, WebP
- **Acceso**: Público para lectura, autenticados para escritura

## 3. Estructura de Archivos

```
Storage/
├── receipts/
│   ├── 1673123456789-recibo-venta-001.pdf
│   ├── 1673123456790-comprobante-pago.jpg
│   └── ...
├── documents/
│   ├── 1673123456791-contrato-venue.pdf
│   ├── 1673123456792-presupuesto.docx
│   └── ...
└── event-images/
    ├── 1673123456793-evento-ano-nuevo.jpg
    ├── 1673123456794-carnaval-2026.png
    └── ...
```

## 4. Políticas de Seguridad

### Receipts y Documents (Privados)
- ✅ **INSERT**: Solo usuarios autenticados pueden subir archivos
- ✅ **SELECT**: Solo usuarios autenticados pueden ver archivos
- ✅ **UPDATE**: Solo usuarios autenticados pueden modificar archivos
- ✅ **DELETE**: Solo usuarios autenticados pueden eliminar archivos

### Event Images (Público)
- ✅ **SELECT**: Cualquiera puede ver las imágenes (público)
- ✅ **INSERT/UPDATE/DELETE**: Solo usuarios autenticados

## 5. Verificación

Después de ejecutar el script, verifica:

1. **Buckets creados**: Ve a Storage en Supabase Dashboard
2. **Políticas aplicadas**: Revisa las políticas en cada bucket
3. **Test de upload**: Usa el sistema para subir un archivo de prueba

## 6. Variables de Entorno Necesarias

Asegúrate de tener configuradas estas variables en Vercel:

```env
SUPABASE_URL=tu_proyecto_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 7. Uso en el Código

```javascript
const { STORAGE_BUCKETS } = require('./utils/supabase');

// Subir recibo de pago
await uploadFile(STORAGE_BUCKETS.RECEIPTS, filename, buffer, mimetype);

// Subir imagen de evento
await uploadFile(STORAGE_BUCKETS.EVENT_IMAGES, filename, buffer, mimetype);
```

## ⚠️ Importante

- Los buckets deben crearse antes de usar las funciones de upload
- Asegúrate de que las políticas estén correctamente aplicadas
- Los nombres de archivos incluyen timestamp para evitar conflictos
- Verifica los límites de tamaño antes de subir archivos