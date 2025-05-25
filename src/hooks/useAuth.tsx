import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const createProfile = async (userId: string, userData: any) => {
    console.log('Creating profile for user:', userId, userData);
    
    const profileData = {
      id: userId,
      name: userData.name || userData.full_name || session?.user?.email?.split('@')[0] || 'Unbekannt',
      email: session?.user?.email || '',
      role: userData.role || 'student'
    };

    try {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return null;
      }
      
      console.log('Profile created successfully:', newProfile);
      return newProfile;
    } catch (err) {
      console.error('Error in createProfile:', err);
      return null;
    }
  };

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for user:', userId);
    
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return null;
      }
      
      if (existingProfile) {
        console.log('Existing profile found:', existingProfile);
        return existingProfile;
      }
      
      return null;
      
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

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
            userProfile = await createProfile(session.user.id, session.user.user_metadata);
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
          const userProfile = await fetchProfile(session.user.id);
          
          if (mounted) {
            setSession(session);
            setUser(session.user);
            setProfile(userProfile);
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

  const value = {
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
