import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse, MessageCircle, Plus, LogOut,
  User, Sparkles, Clock, ChevronRight, Sun, Moon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { setProfile(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'

  async function handleLogout() { await logout(); navigate('/') }
  function startNewChat() { navigate('/chat') }

  const tips = [
    { icon: Sparkles,      label: 'Describe your symptoms', hint: 'Be specific — mention duration, severity, and location.' },
    { icon: Clock,         label: 'Share your history',     hint: 'Mention any existing conditions or medications.' },
    { icon: MessageCircle, label: 'Ask follow-ups',         hint: 'ArogyaBot remembers context within your session.' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-indigo-100/60 dark:border-slate-700/60 shadow-sm transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-slate-900 dark:text-white">
              Arogya<span className="text-indigo-600 dark:text-indigo-400">Bot</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {loading ? '…' : displayName}
              </span>
            </div>
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              id="dashboard-logout-btn"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="animate-custom-fade-in mb-12">
          <p className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-1">Good day 👋</p>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">
              {loading ? '…' : displayName}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">How can ArogyaBot help you today?</p>
        </div>

        {/* Start Chat Card */}
        <div className="animate-custom-slide-up">
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-6 border border-indigo-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-300 cursor-pointer group shadow-sm"
            onClick={startNewChat}
            id="dashboard-new-chat-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Start New Conversation</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Describe your symptoms in English or हिंदी</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform duration-200 hidden sm:block" />
            </div>
          </div>

          <button
            id="dashboard-quick-start-btn"
            onClick={startNewChat}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-base font-semibold px-8 py-3.5 mb-12 bg-indigo-600 hover:bg-amber-500 text-white rounded-xl transition-colors duration-200 shadow-sm hover:scale-105 hover:shadow-md"
          >
            <MessageCircle className="w-5 h-5" /> New Chat
          </button>
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
            Tips for better results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tips.map((t) => (
              <div
                key={t.label}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 shadow-sm"
              >
                <t.icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mb-3" />
                <p className="text-slate-900 dark:text-white font-medium text-sm mb-1">{t.label}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">{t.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-xl transition-colors duration-300">
          <p className="text-amber-700/80 dark:text-amber-400/80 text-xs leading-relaxed">
            <strong>Disclaimer:</strong> ArogyaBot provides general health information only.
            It is not a substitute for professional medical advice, diagnosis, or treatment.
            Always consult a qualified healthcare professional for medical concerns.
          </p>
        </div>
      </main>
    </div>
  )
}
