import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, Mail, Lock, User, Eye, EyeOff, AlertCircle, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Signup() {
  const { signup } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await signup({ email, password, name })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-300">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 z-10"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Background blobs */}
      <div className="absolute top-[-60px] right-[-40px] w-80 h-80 bg-indigo-300 dark:bg-indigo-700 rounded-full blur-3xl opacity-30 z-0 animate-blob-float" />
      <div className="absolute bottom-[-40px] left-[-60px] w-72 h-72 bg-amber-200 dark:bg-amber-700 rounded-full blur-3xl opacity-30 z-0 animate-blob-float animation-delay-2000" />

      <div className="relative z-10 w-full max-w-md animate-custom-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 mb-4 shadow-sm">
            <HeartPulse className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Join ArogyaBot — free forever</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-indigo-50 dark:border-slate-700 transition-colors duration-300">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-600 dark:text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <form id="signup-form" onSubmit={handleSubmit} className="space-y-5">
            {[
              { id: 'signup-name',    label: 'Full name',        type: 'text',     Icon: User, placeholder: 'Priya Sharma',        val: name,     set: setName },
              { id: 'signup-email',   label: 'Email address',    type: 'email',    Icon: Mail, placeholder: 'you@example.com',     val: email,    set: setEmail },
            ].map(({ id, label, type, Icon, placeholder, val, set }) => (
              <div key={id}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    id={id} type={type} required placeholder={placeholder}
                    value={val} onChange={e => set(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  id="signup-password" type={showPwd ? 'text' : 'password'} required placeholder="At least 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  id="signup-confirm" type={showPwd ? 'text' : 'password'} required placeholder="Re-enter password"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <button
              id="signup-submit-btn" type="submit" disabled={loading}
              className="inline-flex items-center justify-center w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
