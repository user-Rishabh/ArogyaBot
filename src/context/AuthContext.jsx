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
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore demo session from localStorage first
    const demoActive = localStorage.getItem(DEMO_KEY) === 'true'
    if (demoActive) {
      setUser(DEMO_USER)
      setLoading(false)
      return
    }

    // Get existing Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
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
        .insert({ id: data.user.id, name, email })

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

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
