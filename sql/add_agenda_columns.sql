-- Añadir columnas para la configuración de la agenda personalizada
-- Ejecutar este script en el Editor SQL de Supabase (dashboard)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'garage_settings' AND column_name = 'agenda_slots') THEN
        ALTER TABLE public.garage_settings ADD COLUMN agenda_slots text[] DEFAULT ARRAY['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'garage_settings' AND column_name = 'agenda_days') THEN
        ALTER TABLE public.garage_settings ADD COLUMN agenda_days integer[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6];
    END IF;
END $$;

-- Comentario para verificar:
-- SELECT agenda_slots, agenda_days FROM garage_settings LIMIT 1;
