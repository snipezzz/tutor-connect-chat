import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/contexts/AuthContext';
import { AuthContextType } from '@/types/auth';
import { createProfile, fetchProfile } from '@/utils/profileUtils';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    let mounted = true;
    
    const handleAuthChange = async (event: any, session: Session | null) => {
      console.log('Auth state changed:', event, session?.user?.id ? `User ID: ${session.user.id}` : 'No user');
      
      if (!mounted) {
        console.log('Component unmounted, skipping auth change');
        return;
      }
      
      try {
        console.log('Updating session and user state...');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User is logged in, attempting to fetch or create profile...');
          
          // Zuerst versuchen, das Profil zu laden
          console.log('Calling fetchProfile for user ID:', session.user.id);
          let userProfile = await fetchProfile(session.user.id);
          console.log('Result of fetchProfile:', userProfile ? 'Profile found' : 'No profile found', userProfile);
          
          // Wenn kein Profil gefunden und Event ist SIGNED_IN, Profil erstellen
          if (!userProfile && event === 'SIGNED_IN') {
            console.log('No profile found and event is SIGNED_IN, calling createProfile...');
            try {
              userProfile = await createProfile(session.user.id, session.user.user_metadata, session);
              console.log('Result of createProfile:', userProfile ? 'Profile created' : 'Profile creation failed', userProfile);
            } catch (createError) {
              console.error('Error during createProfile:', createError);
              // Optional: set profile to null or handle creation error
            }
          }
          
          if (mounted) {
            console.log('Setting profile state:', userProfile);
            setProfile(userProfile);
          }
        } else {
          console.log('User is not logged in, clearing profile state.');
          setProfile(null);
        }
        
        // Setze Loading immer auf false, nachdem die Verarbeitung abgeschlossen ist
        if (mounted) {
          console.log('Setting loading to false.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Caught error in handleAuthChange:', error);
        if (mounted) {
          console.log('Setting loading to false due to error.');
          setLoading(false);
        }
      }
    };

    // Setze den Auth-Listener und verarbeite die initiale Session
    console.log('Setting up supabase.auth.onAuthStateChange listener.');
    const { data: { subscription } } = supabase().auth.onAuthStateChange(handleAuthChange);

    // Initial check for session is handled by onAuthStateChange firing immediately for current session

    return () => {
      console.log('Cleaning up auth subscription.');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: string) => {
    console.log('Signing up user:', email, role);
    const { data, error } = await supabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });
    if (error) {
      console.error('Sign up error:', error);
    } else {
      console.log('Sign up successful:', data);
    }
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email);
    const { data, error } = await supabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Sign in error:', error);
    } else {
      console.log('Sign in successful:', data);
    }
    return { data, error };
  };

  const signOut = async () => {
    console.log('Signing out user');
    await supabase().auth.signOut();
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
