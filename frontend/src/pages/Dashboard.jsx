import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse, MessageCircle, Plus, LogOut,
  User, Sparkles, Clock, ChevronRight, Sun, Moon,
  Mail, AlertCircle, CheckCircle, Info, Trash2
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import EmergencyNumbers from '../components/EmergencyNumbers'

const WHATSAPP_NUMBER = '14155238886'
const WHATSAPP_DEFAULT_TEXT = 'Hello ArogyaBot! I would like to get some health guidance.'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // Tabs and profile settings state
  const [activeTab, setActiveTab] = useState('home') // 'home', 'chats', 'tips', 'profile'
  const [nameInput, setNameInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(true)

  function getRelativeTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date

    if (isNaN(diffMs)) return ''

    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  useEffect(() => {
    if (!user) return
    if (user.isDemo) {
      setProfile({ name: user.user_metadata?.name || 'Demo User' })
      setNameInput(user.user_metadata?.name || 'Demo User')
      setLoading(false)
      return
    }
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data)
          setNameInput(data.name || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user?.id) return

    const fetchHistory = async () => {
      try {
        setSessionsLoading(true)
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setSessions(data || [])
      } catch (err) {
        console.error('Error fetching chat history:', err)
      } finally {
        setSessionsLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  // Helper to format email prefixes to proper names
  const formatName = (nameOrEmail) => {
    if (!nameOrEmail) return 'User'
    let text = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail
    
    // Remove digits (e.g. 075)
    text = text.replace(/[0-9]/g, '')
    
    // Handle specific mapping for rishabmishra -> Rishabh Mishra
    if (text.toLowerCase() === 'rishabmishra') {
      return 'Rishabh Mishra'
    }
    
    // Split on common delimiters
    const parts = text.split(/[._-]/)
    if (parts.length > 1) {
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    }
    
    // If it's a compound name that didn't get split, capitalize first letters
    const lowercase = text.toLowerCase()
    if (lowercase.startsWith('rishab') && lowercase.endsWith('mishra')) {
      return 'Rishabh Mishra'
    }
    
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const displayName = profile?.name || formatName(user?.email)

  async function handleLogout() { await logout(); navigate('/') }
  function startNewChat() { navigate('/chat') }

  async function handleDeleteSession(sessionId) {
    if (!window.confirm('Delete this chat?')) return

    try {
      if (!user?.isDemo) {
        const { error } = await supabase
          .from('chat_sessions')
          .delete()
          .eq('id', sessionId)
        if (error) throw error
      }
      setSessions(prev => prev.filter(s => (s.id || s.sessionId) !== sessionId))
    } catch (err) {
      console.error('Error deleting session:', err)
      alert('Failed to delete chat: ' + err.message)
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!user?.id) return
    setSavingProfile(true)
    setSaveMessage('')
    setSaveSuccess(true)

    if (user.isDemo) {
      setProfile({ name: nameInput })
      setSaveMessage('Demo profile updated successfully! (Local state only)')
      setSavingProfile(false)
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, name: nameInput })

      if (error) throw error
      setProfile({ name: nameInput })
      setSaveMessage('Profile name updated successfully!')
    } catch (err) {
      console.error('Error saving profile:', err)
      setSaveSuccess(false)
      setSaveMessage('Error updating profile: ' + err.message)
    } finally {
      setSavingProfile(false)
    }
  }

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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg border border-indigo-100 dark:border-indigo-800 max-w-[200px]">
              <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]" title={displayName}>
                {loading ? '…' : displayName}
              </span>
            </div>
            {/* WhatsApp button */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_TEXT)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white shadow-sm transition-all duration-200 hover:scale-105"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-5 h-5 fill-white text-green-500" />
            </a>
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              id="dashboard-logout-btn"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Navigation Tabs */}
        <div className="flex border-b border-indigo-100 dark:border-slate-800 mb-8 overflow-x-auto gap-1">
          {[
            { id: 'home', label: 'Overview', icon: Sparkles },
            { id: 'chats', label: 'Recent Chats', icon: Clock, count: sessions.length },
            { id: 'tips', label: 'Tips & Guidelines', icon: Info },
            { id: 'profile', label: 'Profile Settings', icon: User },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSaveMessage('')
                }}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap -mb-[2px] ${
                  isActive
                    ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ml-1 transition-all ${
                    isActive ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="animate-custom-fade-in space-y-8">
            {/* Welcome */}
            <div className="mb-4">
              <p className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-1">Good day 👋</p>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">
                  {loading ? '…' : displayName}
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">How can ArogyaBot help you today?</p>
            </div>

            {/* Start Chat Card */}
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-indigo-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300 cursor-pointer group shadow-sm"
              onClick={startNewChat}
              id="dashboard-new-chat-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Start New Conversation</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Describe your symptoms in English or हिंदी</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1.5 transition-transform duration-200 hidden sm:block" />
              </div>
            </div>

            <div className="flex justify-start">
              <button
                id="dashboard-quick-start-btn"
                onClick={startNewChat}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-base font-semibold px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 shadow-md hover:scale-102 hover:shadow-lg"
              >
                <MessageCircle className="w-5 h-5" /> New Chat
              </button>
            </div>

            {/* Short Tips Grid */}
            <div className="pt-6 border-t border-indigo-50 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                Tips for better results
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {tips.map((t) => (
                  <div
                    key={t.label}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 shadow-sm"
                  >
                    <t.icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mb-3" />
                    <p className="text-slate-900 dark:text-white font-bold text-sm mb-1">{t.label}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">{t.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Chats Tab */}
        {activeTab === 'chats' && (
          <div className="animate-custom-fade-in space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Medical Conversations</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Access your previous sessions and medical guidance from ArogyaBot.</p>
            </div>

            {sessionsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="animate-pulse bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-50/60 dark:border-slate-700/60 h-24 flex flex-col justify-between shadow-sm">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-indigo-100 dark:border-slate-700 text-center py-12 shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No chats yet</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                  Start your first conversation with ArogyaBot to describe your symptoms and get guidance.
                </p>
                <button
                  onClick={startNewChat}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Start New Chat
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sessions.map((session) => {
                  const sId = session.sessionId || session.id
                  const rawTitle = session.firstMessage || session.title || session.message || "Untitled Chat"
                  const title = rawTitle.length > 60 ? rawTitle.substring(0, 60) + "..." : rawTitle
                  const time = getRelativeTime(session.createdAt || session.created_at)

                  return (
                    <div
                      key={sId}
                      onClick={() => navigate(`/chat/${sId}`)}
                      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 shadow-sm group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-slate-700 dark:text-slate-200 font-semibold text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(sId);
                            }}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                            title="Delete Chat"
                            aria-label="Delete chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </div>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 text-xs mt-2 font-medium">
                        {time}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="pt-6">
              <EmergencyNumbers />
            </div>
          </div>
        )}

        {/* Tips & Guidelines Tab */}
        {activeTab === 'tips' && (
          <div className="animate-custom-fade-in space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Guidance & Tips</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Follow these tips to get the most accurate medical assessments.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {tips.map((t) => (
                <div
                  key={t.label}
                  className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm"
                >
                  <t.icon className="w-6 h-6 text-indigo-500 dark:text-indigo-400 mb-3" />
                  <p className="text-slate-900 dark:text-white font-bold text-base mb-1.5">{t.label}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{t.hint}</p>
                </div>
              ))}
            </div>

            {/* Extended recommendations */}
            <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Detailed Best Practices</h3>
              <ul className="space-y-3.5">
                {[
                  { title: 'Symptom Precision', desc: 'Specify exactly where the symptom is, what it feels like (e.g. sharp, dull ache, burning), and how severe it is on a scale of 1-10.' },
                  { title: 'Timeline Details', desc: 'Mention when it started, whether it is constant or comes and goes, and what makes it feel better or worse.' },
                  { title: 'Clinical Context', desc: 'Providing age, gender, pregnancy status, or active chronic conditions (like diabetes or high blood pressure) helps provide relevant suggestions.' },
                  { title: 'Medications List', desc: 'Provide a list of any current prescriptions, over-the-counter drugs, or natural supplements you are taking.' },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 text-xs mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="text-slate-950 dark:text-white">{item.title}:</strong> {item.desc}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-xl transition-colors duration-300">
              <p className="text-amber-700/80 dark:text-amber-400/80 text-xs leading-relaxed">
                <strong>Disclaimer:</strong> ArogyaBot provides general health information only.
                It is not a substitute for professional medical advice, diagnosis, or treatment.
                Always consult a qualified healthcare professional for medical concerns.
              </p>
            </div>
          </div>
        )}

        {/* Profile Settings Tab */}
        {activeTab === 'profile' && (
          <div className="animate-custom-fade-in space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Customize how ArogyaBot addresses you.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-8 shadow-sm max-w-xl">
              {saveMessage && (
                <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-6 ${
                  saveSuccess 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                }`}>
                  {saveSuccess ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{saveMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rishabh Mishra"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    This name will be used across the app and welcome greetings.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed opacity-80"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Your login email is managed by your authentication provider.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 hover:scale-102"
                >
                  {savingProfile ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving changes…
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
