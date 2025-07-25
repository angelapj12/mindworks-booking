import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile, getUserProfile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, fullName: string) => Promise<any>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount (one-time check)
  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const userProfile = await getUserProfile(user.id)
          setProfile(userProfile)
        }
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    // Set up auth listener - KEEP SIMPLE, avoid any async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // NEVER use any async operations in callback - use setTimeout with 0 delay
        setTimeout(async () => {
          setUser(session?.user || null)
          
          if (session?.user) {
            const userProfile = await getUserProfile(session.user.id)
            setProfile(userProfile)
          } else {
            setProfile(null)
          }
        }, 0)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.id)
      setProfile(userProfile)
    }
  }

  // Auth methods
  async function handleSignIn(email: string, password: string) {
    console.log('Attempting sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    
    if (error) {
      console.error('Sign in error:', error);
      throw error
    }
    
    console.log('Sign in successful:', data);
    return data
  }

  async function handleSignUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
      }
    })

    if (error) {
      throw error
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase.functions.invoke('handle-user-signup', {
        body: {
          user_id: data.user.id,
          email: email,
          full_name: fullName,
          role: 'student'
        }
      })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }

    return data
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    profile,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
