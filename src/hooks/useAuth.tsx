
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

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User found, fetching profile...');
          // Timeout verwenden, um Deadlocks zu vermeiden
          setTimeout(async () => {
            try {
              // Versuche zuerst das Profil zu laden
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (error) {
                console.error('Error fetching profile:', error);
                
                // Falls kein Profil existiert, erstelle eines
                if (error.code === 'PGRST116') {
                  console.log('No profile found, creating one...');
                  const userData = session.user.user_metadata;
                  const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      name: userData.name || session.user.email?.split('@')[0] || 'Unbekannt',
                      email: session.user.email || '',
                      role: userData.role || 'student'
                    })
                    .select()
                    .single();
                  
                  if (insertError) {
                    console.error('Error creating profile:', insertError);
                  } else {
                    console.log('Profile created:', newProfile);
                    setProfile(newProfile);
                  }
                }
              } else if (profileData) {
                console.log('Profile loaded:', profileData);
                setProfile(profileData);
              }
            } catch (err) {
              console.error('Error in profile fetch:', err);
            }
          }, 100);
        } else {
          console.log('No user, clearing profile');
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Prüfe initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Initial user found, fetching profile...');
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error && error.code !== 'PGRST116') {
              console.error('Error fetching initial profile:', error);
            } else if (data) {
              console.log('Initial profile loaded:', data);
              setProfile(data);
            } else {
              console.log('No initial profile found');
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
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
