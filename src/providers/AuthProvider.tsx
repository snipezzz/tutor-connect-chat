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
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted) {
        console.log('Component unmounted, skipping auth change');
        return;
      }
      
      try {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && mounted) {
          console.log('User found, fetching profile...');
          
          // Versuche zuerst das existierende Profil zu laden
          let userProfile = await fetchProfile(session.user.id);
          
          // Falls kein Profil existiert, erstelle eins nur beim ersten Login
          if (!userProfile && event === 'SIGNED_IN' && mounted) {
            console.log('No profile found and user just signed in, creating profile...');
            userProfile = await createProfile(session.user.id, session.user.user_metadata, session);
          }
          
          if (mounted) {
            setProfile(userProfile);
            setLoading(false);
          }
        } else {
          console.log('No user, clearing profile');
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Prüfe initial Session
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Initial session check:', session?.user?.id);
        
        if (session?.user) {
          // Bei initialem Load immer nur das existierende Profil laden
          let userProfile = await fetchProfile(session.user.id);

          // Wenn kein Profil gefunden wurde, versuche eins zu erstellen (kann bei bestehenden Nutzern ohne Profil passieren)
          if (!userProfile && mounted) {
            console.log('User exists but no profile found during initial check, attempting to create profile...');
            userProfile = await createProfile(session.user.id, session.user.user_metadata, session);
          }
          
          if (mounted) {
            setSession(session);
            setUser(session.user);
            setProfile(userProfile); // Profile auf das gefundene oder neu erstellte Profil setzen
            // WICHTIG: Loading-State IMMER zurücksetzen, auch wenn kein Profil gefunden wurde
            setLoading(false);
          }
        } else {
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in initial auth check:', error);
        if (mounted) {
          setLoading(false);
        }
      } finally {
        // Ensure loading is always false after the initial check
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log('Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: string) => {
    console.log('Signing up user:', email, role);
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
    if (error) {
      console.error('Sign up error:', error);
    } else {
      console.log('Sign up successful:', data);
    }
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
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
    await supabase.auth.signOut();
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
