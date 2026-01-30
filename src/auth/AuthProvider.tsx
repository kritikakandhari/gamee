import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type AuthContextValue = {
  session: any
  user: any
  isAdmin: boolean
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const checkAdmin = (user: any) => {
    // For demo purposes, we allow a specific email or metadata role
    // In production, this should be strictly strictly via RLS/Claims
    const isDevAdmin = user?.email === 'admin@fgcmm.com' || user?.email?.includes('admin');
    const isRoleAdmin = user?.user_metadata?.role === 'admin';
    return isDevAdmin || isRoleAdmin;
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setIsAdmin(!!currentUser && checkAdmin(currentUser))
      setIsLoading(false)
    })

    // 2. Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setIsAdmin(!!currentUser && checkAdmin(currentUser))
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user,
    isAdmin,
    isLoading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
