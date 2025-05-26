import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { createProfile, fetchProfile } from '@/utils/profileUtils';

// Environment-Variablen einlesen (wiederholen, um sicherzustellen, dass sie hier verfügbar sind)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Sicherstellen, dass die Variablen gesetzt sind (optional, kann auch in client.ts bleiben)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL oder Anon Key ist nicht gesetzt.');
}

// Supabase Client Initialisierung (als Singleton)
const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Definieren des Authentifizierungs-Context-Typs
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null; // Profiltyp beibehalten, wie in Ihrer bestehenden Nutzung
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<any>;
  signOut: () => Promise<{ error: any | null }>; // Angepasster Rückgabetyp
}

// Erstellen des Contexts
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Erstellen des Providers
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null); // Initial null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Profil laden oder erstellen (verwendet Ihre bestehenden Utility-Funktionen)
        let userProfile = await fetchProfile(session.user.id); // Angenommen fetchProfile erwartet nur userId

        // Wenn kein Profil gefunden und Event ist SIGNED_IN, Profil erstellen
        if (!userProfile && _event === 'SIGNED_IN') {
          try {
             // Angenommen createProfile erwartet userId, userMetadata und session
            userProfile = await createProfile(session.user.id, session.user.user_metadata, session);
          } catch (createError) {
            console.error('Error during profile creation:', createError);
          }
        }
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Initialen Zustand setzen
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        // Profil wird durch den onAuthStateChange Listener geladen, falls eine Session existiert
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // onAuthStateChange wird den Zustand aktualisieren
    return { data, error };
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });
     // onAuthStateChange wird den Zustand aktualisieren, einschliesslich Profilerstellung
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    // onAuthStateChange wird den Zustand aktualisieren
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Erstellen des Hooks
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
