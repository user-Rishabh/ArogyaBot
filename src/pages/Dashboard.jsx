import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse, MessageCircle, Plus, LogOut,
  User, Sparkles, Clock, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function startNewChat() {
    navigate('/chat')
  }

  const tips = [
    { icon: Sparkles, label: 'Describe your symptoms', hint: 'Be specific — mention duration, severity, and location.' },
    { icon: Clock,    label: 'Share your history',     hint: 'Mention any existing conditions or medications.' },
    { icon: MessageCircle, label: 'Ask follow-ups',   hint: 'ArogyaBot remembers context within your session.' },
  ]

  return (
    <div className="min-h-screen hero-gradient">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-surface-900/60 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-white">Arogya<span className="text-teal-400">Bot</span></span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-sm text-slate-300">
                {loading ? '…' : displayName}
              </span>
            </div>
            <button
              id="dashboard-logout-btn"
              onClick={handleLogout}
              className="btn-ghost text-sm gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="animate-fade-in mb-12">
          <p className="text-teal-400 text-sm font-medium mb-1">Good day 👋</p>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back,{' '}
            <span className="gradient-text">
              {loading ? '…' : displayName}
            </span>
          </h1>
          <p className="text-slate-400">
            How can ArogyaBot help you today?
          </p>
        </div>

        {/* Start Chat Card */}
        <div className="animate-slide-up">
          <div
            className="card p-8 mb-8 border-teal-500/20 bg-gradient-to-br from-teal-900/20 to-surface-800/40 hover:border-teal-500/40 transition-all duration-300 cursor-pointer group"
            onClick={startNewChat}
            id="dashboard-new-chat-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Start New Conversation</h2>
                  <p className="text-slate-400 text-sm">
                    Describe your symptoms in English or हिंदी
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-teal-400 group-hover:translate-x-1 transition-transform hidden sm:block" />
            </div>
          </div>

          {/* Quick Start Button */}
          <button
            id="dashboard-quick-start-btn"
            onClick={startNewChat}
            className="btn-primary w-full sm:w-auto text-base px-8 py-3.5 mb-12"
          >
            <MessageCircle className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Tips for better results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tips.map((t) => (
              <div key={t.label} className="glass-card p-5">
                <t.icon className="w-5 h-5 text-teal-400 mb-3" />
                <p className="text-white font-medium text-sm mb-1">{t.label}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{t.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 px-5 py-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <p className="text-amber-400/80 text-xs leading-relaxed">
            <strong>Disclaimer:</strong> ArogyaBot provides general health information only. 
            It is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always consult a qualified healthcare professional for medical concerns.
          </p>
        </div>
      </main>
    </div>
  )
}
