-- ============================================================
-- EJECUTAR EN: Dashboard Supabase > SQL Editor
-- Proyecto: qtzpzgwyjptbnipvyjdu
-- ============================================================

-- PASO 1: Rellenar los datos básicos de Lubrivespucio
-- (los settings estaban vacíos porque nunca se guardaron)
UPDATE client_lubrivespucio.garage_settings
SET
  workshop_name     = 'Lubricentro Vespucio',
  phone             = '+56 9 9069 9021',
  address           = 'Av. Américo Vespucio 310, Maipú',
  company_slug      = 'lubrivespucio',
  whatsapp_template = 'Hola {{cliente}}, tu vehículo {{vehiculo}} está ahora en estado: *{{estado}}*. Gracias por confiar en {{nombre_taller}}.'
WHERE company_id = '59dabd2e-9dfc-466a-94c1-f83aee59fd4d'
  AND (workshop_name IS NULL OR workshop_name = '');

-- PASO 2: Verificar el resultado
SELECT 
  workshop_name, 
  phone, 
  logo_url, 
  company_slug,
  favicon_url
FROM client_lubrivespucio.garage_settings
WHERE company_id = '59dabd2e-9dfc-466a-94c1-f83aee59fd4d';
