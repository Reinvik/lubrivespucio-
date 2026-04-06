-- ================================================================
-- SCRIPT: Completar y sincronizar datos de Lubrivespucio
-- Ejecutar en: SQL Editor de Supabase > proyecto qtzpzgwyjptbnipvyjdu
-- ================================================================

-- 1. Actualizar garage_settings de Lubrivespucio con datos completos
UPDATE client_lubrivespucio.garage_settings
SET
  workshop_name       = 'Lubricentro Vespucio',
  phone               = '+56 9 9069 9021',
  address             = 'Av. Américo Vespucio 310, Maipú',
  whatsapp_template   = 'Hola {{cliente}}, tu vehículo {{vehiculo}} está ahora en estado: *{{estado}}*. Gracias por confiar en {{nombre_taller}}.',
  company_slug        = 'lubrivespucio',
  theme_menu_highlight = '#f97316',
  theme_menu_text     = '#a1a1aa',
  theme_button_color  = '#ea580c',
  theme_sidebar_bg    = '#18181b',
  theme_sidebar_active_bg = '#27272a',
  theme_sidebar_text  = '#a1a1aa',
  theme_sidebar_active_text = '#ffffff',
  theme_main_bg       = '#f4f4f5',
  theme_card_bg       = '#ffffff',
  theme_accent_color  = '#f97316',
  theme_header_bg     = '#ffffff',
  theme_header_text   = '#1f2937'
WHERE company_id = '59dabd2e-9dfc-466a-94c1-f83aee59fd4d';

-- 2. Asegurarse que el slug en la tabla companies también esté correcto
UPDATE public.companies
SET slug = 'lubrivespucio'
WHERE id = '59dabd2e-9dfc-466a-94c1-f83aee59fd4d';

-- 3. Verificar resultado
SELECT 
  gs.workshop_name, 
  gs.phone, 
  gs.logo_url, 
  gs.company_slug,
  gs.theme_menu_highlight,
  c.slug as companies_slug
FROM client_lubrivespucio.garage_settings gs
JOIN public.companies c ON c.id = gs.company_id
WHERE gs.company_id = '59dabd2e-9dfc-466a-94c1-f83aee59fd4d';
