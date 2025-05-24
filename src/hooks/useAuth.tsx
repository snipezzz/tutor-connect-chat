
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

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    } else {
      console.log('Profile created successfully:', newProfile);
      return newProfile;
    }
  };

  const fetchOrCreateProfile = async (userId: string, userData: any = {}) => {
    console.log('Fetching or creating profile for user:', userId);
    
    try {
      // Versuche zuerst das Profil zu laden
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
      
      // Falls kein Profil existiert, erstelle eines
      console.log('No profile found, creating new one...');
      return await createProfile(userId, userData);
      
    } catch (err) {
      console.error('Error in fetchOrCreateProfile:', err);
      return null;
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User found, fetching/creating profile...');
          const userProfile = await fetchOrCreateProfile(
            session.user.id, 
            session.user.user_metadata
          );
          setProfile(userProfile);
        } else {
          console.log('No user, clearing profile');
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Prüfe initial Session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Initial user found, fetching/creating profile...');
        const userProfile = await fetchOrCreateProfile(
          session.user.id, 
          session.user.user_metadata
        );
        setProfile(userProfile);
      }
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth subscription');
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
