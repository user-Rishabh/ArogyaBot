import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, Mail, Lock, Eye, EyeOff, AlertCircle, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const { login, googleLogin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleGoogleLogin = async () => {
    try {
      await googleLogin()
    } catch (err) {
      setError(err.message || 'Google login failed')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-indigo-100 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-300">
      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 z-10"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-10 -left-10 w-96 h-96 bg-indigo-400 dark:bg-indigo-700 rounded-full blur-3xl opacity-40 z-0 animate-blob-float" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-amber-300 dark:bg-amber-700 rounded-full blur-3xl opacity-40 z-0 animate-blob-float animation-delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-custom-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 mb-4 shadow-sm">
            <HeartPulse className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome to <span className="bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">ArogyaBot</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Sign in to your account</p>
        </div>


        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-indigo-50 dark:border-slate-700 transition-colors duration-300">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-600 dark:text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  id="login-email" type="email" required placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  id="login-password" type={showPwd ? 'text' : 'password'} required placeholder="Your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              id="login-submit-btn" type="submit" disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm hover:scale-105 transition-all duration-300 inline-flex items-center justify-center w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors">Create one free</Link>
        </p>
      </div>
    </div>
  )
}
