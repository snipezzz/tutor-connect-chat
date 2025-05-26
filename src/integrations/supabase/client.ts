// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Environment-Variablen einlesen
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL oder Anon Key ist nicht gesetzt.')
}

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const supabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          // Session-Token im localStorage/cookie behalten
          persistSession: true,
          // Verhindert, dass Supabase URL-Parameter anpasst (optional)
          detectSessionInUrl: false
        }
      }
    );
  }
  return supabaseInstance;
};