-- Agregar columnas para configuración de agenda y catálogo de servicios
ALTER TABLE garage_settings 
ADD COLUMN IF NOT EXISTS agenda_slots TEXT[] DEFAULT ARRAY['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
ADD COLUMN IF NOT EXISTS agenda_days INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6],
ADD COLUMN IF NOT EXISTS services_catalog JSONB DEFAULT '[]'::jsonb;

-- Comentarios para documentación
COMMENT ON COLUMN garage_settings.agenda_slots IS 'Array de strings con los horarios disponibles para agendar (HH:mm)';
COMMENT ON COLUMN garage_settings.agenda_days IS 'Array de enteros (0-6) con los días operativos (0=Domingo, 1=Lunes, etc)';
COMMENT ON COLUMN garage_settings.services_catalog IS 'Lista de servicios personalizados para el Landing Page';
