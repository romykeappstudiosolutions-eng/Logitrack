
import { createClient, SupabaseClient } from '@supabase/supabase-js';

console.log("Cargando variables de entorno para Supabase...");
console.log("test variable:", import.meta.env.VITE_TEST ? "Encontrada" : "No encontrada");

console.log("SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL ? "Encontrada" : "No encontrada");
console.log("SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Encontrada" : "No encontrada");

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

// Solo inicializamos si ambas claves existen y son válidas
if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn("Error al inicializar Supabase Client:", e);
  }
}

export const supabase = client;
export const isSupabaseConfigured = !!client;
