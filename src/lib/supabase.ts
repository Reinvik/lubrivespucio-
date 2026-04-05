import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Client principal — schema público (auth: profiles, companies)
// Se usa el esquema de negocio configurado en supabaseGarage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: { eventsPerSecond: 0 }
    }
});

// Configuración de Esquema para Multi-tenancy
// El esquema por defecto es client_lubrivespucio, pero puede cambiarse aquí o inyectarse dinámicamente
export const GARAGE_SCHEMA = 'client_lubrivespucio';

// supabaseGarage — Cliente para datos de negocio (garage_ prefix)
export const supabaseGarage = supabase.schema(GARAGE_SCHEMA);
