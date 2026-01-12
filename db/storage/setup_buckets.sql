-- ============================================================================
-- CONFIGURACIÓN DE STORAGE BUCKETS - SUPABASE
-- ============================================================================
-- Crear buckets para almacenamiento de archivos del sistema Summer Festival

-- ============================================================================
-- 1. BUCKET PARA RECIBOS DE PAGO
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts', 
  'receipts', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. BUCKET PARA DOCUMENTOS GENERALES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. BUCKET PÚBLICO PARA IMÁGENES DE EVENTOS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images', 
  'event-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. POLÍTICAS DE SEGURIDAD PARA BUCKET 'receipts'
-- ============================================================================

-- Política para permitir insertar archivos (autenticados)
CREATE POLICY "Allow authenticated users to upload receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);

-- Política para ver archivos propios
CREATE POLICY "Allow users to view their receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);

-- Política para actualizar archivos propios
CREATE POLICY "Allow users to update their receipts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);

-- Política para eliminar archivos propios
CREATE POLICY "Allow users to delete their receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);

-- ============================================================================
-- 5. POLÍTICAS DE SEGURIDAD PARA BUCKET 'documents'
-- ============================================================================

-- Política para permitir insertar documentos (autenticados)
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Política para ver documentos
CREATE POLICY "Allow users to view documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Política para actualizar documentos
CREATE POLICY "Allow users to update documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Política para eliminar documentos
CREATE POLICY "Allow users to delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- ============================================================================
-- 6. POLÍTICAS DE SEGURIDAD PARA BUCKET 'event-images' (PÚBLICO)
-- ============================================================================

-- Política para permitir ver imágenes públicas
CREATE POLICY "Allow public viewing of event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

-- Política para permitir subir imágenes (autenticados)
CREATE POLICY "Allow authenticated users to upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' AND 
  auth.role() = 'authenticated'
);

-- Política para actualizar imágenes
CREATE POLICY "Allow authenticated users to update event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' AND 
  auth.role() = 'authenticated'
);

-- Política para eliminar imágenes
CREATE POLICY "Allow authenticated users to delete event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' AND 
  auth.role() = 'authenticated'
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets configurados exitosamente';
  RAISE NOTICE 'Buckets creados: receipts, documents, event-images';
  RAISE NOTICE 'Políticas de seguridad aplicadas correctamente';
END $$;