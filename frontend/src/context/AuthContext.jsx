/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEMO_USER = {
  id:    'demo-user-001',
  email: 'demo@arogyabot.app',
  user_metadata: { name: 'Demo User' },
  isDemo: true,
}

const DEMO_KEY = 'arogyabot_demo_session'

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null)
  const [profile,         setProfile]         = useState(null)
  const [profileComplete, setProfileComplete] = useState(false)
  const [loading,         setLoading]         = useState(true)

  const updateProfileComplete = (updatedProfile) => {
    setProfile(updatedProfile)
    setProfileComplete(Boolean(updatedProfile?.onboarding_complete))
  }

  useEffect(() => {
    // Restore demo session from localStorage first
    const demoActive = localStorage.getItem(DEMO_KEY) === 'true'
    if (demoActive) {
      const demoProfile = JSON.parse(localStorage.getItem('arogyabot_demo_profile') || '{}')
      setUser(DEMO_USER)
      setProfile(demoProfile)
      setProfileComplete(Boolean(demoProfile.onboarding_complete))
      setLoading(false)
      return
    }

    const checkSessionAndProfile = async (sessionUser) => {
      if (!sessionUser) {
        setUser(null)
        setProfile(null)
        setProfileComplete(false)
        setLoading(false)
        return
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle()

        setUser(sessionUser)
        if (profileData) {
          const meta = sessionUser.user_metadata || {}
          const mergedProfile = {
            ...profileData,
            name: profileData.name || meta.name || '',
            age: profileData.age !== undefined && profileData.age !== null ? profileData.age : (meta.age || ''),
            weight: profileData.weight !== undefined && profileData.weight !== null ? profileData.weight : (meta.weight || ''),
            height: profileData.height !== undefined && profileData.height !== null ? profileData.height : (meta.height || ''),
            gender: profileData.gender || meta.gender || '',
            conditions: profileData.conditions || meta.conditions || '',
            onboarding_complete: Boolean(profileData.onboarding_complete)
          }
          setProfile(mergedProfile)
          setProfileComplete(Boolean(profileData.onboarding_complete))
        } else {
          setProfile(null)
          setProfileComplete(false)
        }
      } catch (err) {
        console.error('Session/profile load error:', err)
        setUser(sessionUser)
        setProfileComplete(false)
      } finally {
        setLoading(false)
      }
    }

    // Get existing Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkSessionAndProfile(session?.user ?? null)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkSessionAndProfile(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Demo login ─────────────────────────────────────────────
  function loginAsDemo() {
    localStorage.setItem(DEMO_KEY, 'true')
    setUser(DEMO_USER)
  }

  // ── Real Supabase auth ─────────────────────────────────────
  async function signup({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, name })

      if (profileError) {
        console.warn('Could not insert profile:', profileError.message)
      }
    }

    return data
  }

  async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function logout() {
    if (user?.isDemo) {
      localStorage.removeItem(DEMO_KEY)
      setUser(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function googleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      profileComplete, 
      updateProfileComplete, 
      loading, 
      signup, 
      login, 
      logout, 
      loginAsDemo, 
      googleLogin 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
