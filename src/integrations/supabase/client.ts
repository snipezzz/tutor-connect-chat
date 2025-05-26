// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Environment-Variablen einlesen
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL oder Anon Key ist nicht gesetzt.')
}

// Supabase Client Initialisierung (als direkt exportierte Instanz)
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: false,
    }
  }
);