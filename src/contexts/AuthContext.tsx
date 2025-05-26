import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

// Dein Profil-Interface
export interface UserProfile {
  id: string
  name: string
  role: 'admin' | 'teacher' | 'student'
}

// Context-Shape
interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

// Context anlegen
export const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

// Provider-Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Profil laden
  const loadProfile = async (userId: string) => {
    const { data, error }: { data: UserProfile | null, error: any } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error loading profile:', error.message)
      setProfile(null)
      return
    }

    if (data) {
      setProfile(data)
    } else {
      setProfile(null)
    }
  }

  // signOut function to expose via context
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      // Clear local state after successful sign out
      setUser(null);
      setProfile(null);
      setLoading(false); // Ensure loading is false after sign out
      console.log('User signed out successfully.');
    }
  };

  useEffect(() => {
    setLoading(true)

    // Initialer Session-Check
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) return loadProfile(currentUser.id)
        setProfile(null)
      })
      .catch((err) => {
        console.error('Error getting session:', err.message)
        setUser(null)
        setProfile(null)
      })
      .finally(() => {
        setLoading(false)
      })

    // Auth Events (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) loadProfile(currentUser.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook zum Zugriff auf den Context
export const useAuth = () => {
  return useContext(AuthContext)
}
