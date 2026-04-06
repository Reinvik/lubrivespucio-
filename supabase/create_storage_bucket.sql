-- ================================================================
-- SCRIPT: Crear bucket garage-logos y sus políticas de Storage
-- Ejecutar en: supabase.co > qtzpzgwyjptbnipvyjdu > SQL Editor
-- ================================================================

-- 1. Crear el bucket como público (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'garage-logos',
  'garage-logos',
  true,          -- público para lectura
  5242880,       -- 5MB máximo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- 2. Política: Cualquier usuario autenticado puede SUBIR archivos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'garage-logos');

-- 3. Política: Cualquier usuario autenticado puede ACTUALIZAR sus archivos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'garage-logos');

-- 4. Política: Cualquier usuario puede LEER/VER logos (público)
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'garage-logos');

-- 5. Política: Usuarios autenticados pueden BORRAR logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'garage-logos');
