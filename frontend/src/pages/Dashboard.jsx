import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse, MessageCircle, Plus, LogOut,
  User, Sparkles, Clock, ChevronRight, Sun, Moon,
  Mail, AlertCircle, CheckCircle, Info, Trash2,
  Activity, MapPin, Search, Loader2
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import EmergencyNumbers from '../components/EmergencyNumbers'
import BMICalculator from '../components/BMICalculator'

const WHATSAPP_NUMBER = '14155238886'
const WHATSAPP_DEFAULT_TEXT = 'Hello ArogyaBot! I would like to get some health guidance.'

function AnimationOverlay({ isLocDetecting }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm select-none animate-overlay-fade">
      <div className="relative flex items-center justify-center h-48 w-48">
        {/* Siren Red Glow */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-red-600/30 blur-2xl animate-siren-red pointer-events-none" />
        {/* Siren Blue Glow */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-blue-600/30 blur-2xl animate-siren-blue pointer-events-none" />

        {/* Ambulance Emoji */}
        <div className="text-8xl animate-ambulance-drive select-none z-10">
          🚑
        </div>
      </div>
      <p
        className="text-white text-lg font-extrabold tracking-wide mt-4 animate-text-fade-in opacity-0 flex items-center gap-2.5 justify-center"
        style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
      >
        {isLocDetecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Detecting your location...</span>
          </>
        ) : (
          <span>Finding care near you...</span>
        )}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [showAmbuAnimation, setShowAmbuAnimation] = useState(false)

  // Tabs and profile settings state
  const [activeTab, setActiveTab] = useState('home') // 'home', 'chats', 'tips', 'profile'
  const [nameInput, setNameInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(true)

  // Geolocation and Care Finder states
  const [locCoords, setLocCoords] = useState({ lat: null, lng: null })
  const [locAllowed, setLocAllowed] = useState(null)
  const [isLocDetecting, setIsLocDetecting] = useState(false)
  const [manualCity, setManualCity] = useState('')
  const [searchCity, setSearchCity] = useState('')

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

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this chat?')) return

    console.log('Attempting to delete session:', sessionId, 'for user:', user?.id)
    // Delete from Supabase first
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      console.error('Delete error:', error)
      alert('Failed to delete. Try again.')
      return
    }

    // Only remove from local state if Supabase delete succeeded
    setSessions(prev => prev.filter(s => s.id !== sessionId))
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
    { icon: Sparkles, label: 'Describe your symptoms', hint: 'Be specific — mention duration, severity, and location.', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-550/10 dark:bg-indigo-950/50' },
    { icon: Clock, label: 'Share your history', hint: 'Mention any existing conditions or medications.', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-550/10 dark:bg-amber-950/50' },
    { icon: MessageCircle, label: 'Ask follow-ups', hint: 'ArogyaBot remembers context within your session.', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-550/10 dark:bg-violet-950/50' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-indigo-100 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 transition-colors duration-300 relative">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-10 -left-10 w-96 h-96 bg-indigo-400 dark:bg-indigo-700 rounded-full blur-3xl opacity-40 z-0 animate-blob-float" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-amber-300 dark:bg-amber-700 rounded-full blur-3xl opacity-40 z-0 animate-blob-float animation-delay-2000" />
      </div>
      {showAmbuAnimation && <AnimationOverlay isLocDetecting={isLocDetecting} />}
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-indigo-100/50 dark:border-slate-700/50 shadow-sm transition-colors duration-300">
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
            {/* WhatsApp Link - subtle inline text link */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_TEXT)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline transition-all duration-200"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-green-600 dark:fill-green-400 text-green-600 dark:text-green-400" />
              <span className="hidden sm:inline">WhatsApp</span>
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
        {/* Horizontal Navigation Tabs */}
        <div className="flex flex-nowrap justify-start md:justify-center items-center border-b border-indigo-100 dark:border-slate-800/80 pb-4 mb-8 overflow-x-auto scrollbar-hide gap-1.5 md:gap-2 w-full">
          {[
            { id: 'home', label: 'Overview', icon: Sparkles },
            { id: 'chats', label: 'Recent Chats', icon: Clock, count: sessions.length },
            { id: 'tips', label: 'Tips & Guidelines', icon: Info },
            { id: 'tools', label: 'Health Tools', icon: Activity },
            { id: 'care', label: 'Care Finder', icon: MapPin },
            { id: 'profile', label: 'Profile Settings', icon: User },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'care' && activeTab !== 'care') {
                    setIsLocDetecting(true)
                    setLocAllowed(null)
                    setLocCoords({ lat: null, lng: null })
                    setSearchCity('')
                    setManualCity('')

                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setLocCoords({
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        })
                        setLocAllowed(true)
                        setIsLocDetecting(false)
                      },
                      (err) => {
                        console.error('Geolocation error:', err)
                        setLocAllowed(false)
                        setIsLocDetecting(false)
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    )

                    setShowAmbuAnimation(true)
                    setTimeout(() => setShowAmbuAnimation(false), 2000)
                  }
                  setActiveTab(tab.id)
                  setSaveMessage('')
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-200 whitespace-nowrap ${isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800/60'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 transition-all ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Active Tab Content Wrapper */}
        <div className="space-y-6">

          {/* Home Tab */}
          {activeTab === 'home' && (
            <div className="animate-tab-fade-in space-y-8">
              {/* Hero Welcome Banner with animated gradient */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-amber-500 bg-[length:200%_auto] animate-gradient p-8 md:p-12 text-white shadow-xl shadow-indigo-500/20 animate-card-fade-in opacity-0" style={{ animationDelay: '0ms' }}>
                {/* Background decorative glows */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <p className="text-indigo-100 text-sm font-semibold mb-1.5 tracking-wider uppercase">Good day 👋</p>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
                      Welcome back,<br />
                      <span className="text-white drop-shadow-sm">{loading ? '…' : displayName}</span>
                    </h1>
                    <p className="text-indigo-50 text-sm md:text-base max-w-md leading-relaxed">
                      ArogyaBot is here to provide support and information regarding symptoms, diseases, vaccines, and local care finder tools.
                    </p>
                  </div>
                  <button
                    onClick={startNewChat}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-indigo-50 active:bg-white text-indigo-600 font-extrabold rounded-2xl shadow-lg hover:scale-102 active:scale-98 transition-all duration-200 self-start md:self-auto"
                  >
                    <MessageCircle className="w-5 h-5 fill-indigo-600" />
                    Start Chat
                  </button>
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-3 gap-4 animate-card-fade-in opacity-0" style={{ animationDelay: '25ms' }}>
                {[
                  { label: 'Total Chats', value: sessions.length, bg: 'from-blue-50 to-indigo-50 dark:from-slate-800/40 dark:to-slate-800/60 text-indigo-600 dark:text-indigo-400' },
                  { label: 'Last Active', value: sessions.length > 0 ? getRelativeTime(sessions[0]?.created_at || sessions[0]?.createdAt) : 'No chats', bg: 'from-amber-50 to-orange-50 dark:from-slate-800/40 dark:to-slate-800/60 text-amber-600 dark:text-amber-400' },
                  { label: 'Language', value: 'English (EN)', bg: 'from-emerald-50 to-teal-50 dark:from-slate-800/40 dark:to-slate-800/60 text-emerald-600 dark:text-emerald-400' }
                ].map((stat) => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} border border-indigo-100/30 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-center`}>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">{stat.label}</span>
                    <span className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Short Tips Grid */}
              <div className="pt-6 border-t border-indigo-50 dark:border-slate-800/80 animate-card-fade-in opacity-0" style={{ animationDelay: '50ms' }}>
                <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                  Tips for better results
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {tips.map((t, idx) => (
                    <div
                      key={t.label}
                     className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-5 hover:shadow-md transition-all duration-200 shadow-sm animate-card-fade-in opacity-0"
                      style={{ animationDelay: `${100 + idx * 50}ms` }}
                    >
                      <div className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center mb-3`}>
                        <t.icon className={`w-5 h-5 ${t.color}`} />
                      </div>
                      <p className="text-slate-900 dark:text-white font-bold text-sm mb-1">{t.label}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">{t.hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency numbers moved here */}
              <div className="pt-6 border-t border-indigo-50 dark:border-slate-800/80 animate-card-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
                <EmergencyNumbers />
              </div>
            </div>
          )}

          {/* Recent Chats Tab */}
          {activeTab === 'chats' && (
            <div className="animate-tab-fade-in space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Medical Conversations</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Access your previous sessions and medical guidance from ArogyaBot.</p>
              </div>

              {sessionsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="animate-pulse bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-5 h-24 flex flex-col justify-between shadow-sm">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-8 text-center py-12 shadow-sm animate-card-fade-in opacity-0" style={{ animationDelay: '0ms' }}>
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
                  {sessions.map((session, idx) => {
                    console.log('Session object:', session)
                    const sId = session.id
                    const rawTitle = session.firstMessage || session.title || session.message || "Untitled Chat"
                    const title = rawTitle.length > 60 ? rawTitle.substring(0, 60) + "..." : rawTitle
                    const time = getRelativeTime(session.createdAt || session.created_at)

                    return (
                      <div
                        key={sId}
                        onClick={() => navigate(`/chat/${sId}`)}
                        className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-5 border-l-4 border-l-indigo-500 dark:border-l-indigo-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] shadow-sm group hover:-translate-y-0.5 animate-card-fade-in opacity-0"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-800 dark:text-slate-100 font-bold text-sm leading-snug line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {title}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                              {session.firstMessage || session.title || "No preview available"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(sId);
                              }}
                              className="p-1 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                              title="Delete Chat"
                              aria-label="Delete chat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform duration-200" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-50 dark:border-slate-800/40">
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold">
                            {time}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
                    className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-6 shadow-sm"
                  >
                    <t.icon className="w-6 h-6 text-indigo-500 dark:text-indigo-400 mb-3" />
                    <p className="text-slate-900 dark:text-white font-bold text-base mb-1.5">{t.label}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{t.hint}</p>
                  </div>
                ))}
              </div>

              {/* Extended recommendations */}
              <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-6 shadow-sm">
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

          {/* Health Tools Tab */}
          {activeTab === 'tools' && (
            <div className="animate-tab-fade-in space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Health Tools</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Calculate your health metrics and get general suggestions.</p>
              </div>

              <div className="animate-card-fade-in opacity-0" style={{ animationDelay: '0ms' }}>
                <BMICalculator />
              </div>
            </div>
          )}

          {/* Care Finder Tab */}
          {activeTab === 'care' && (
            <div className="animate-tab-fade-in space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Care Finder</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Locate nearby medical centers using your device location or search by city.</p>
              </div>

              {/* Loading state: if still detecting and animation is not showing anymore */}
              {!showAmbuAnimation && isLocDetecting && (
                <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm animate-card-fade-in opacity-0">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">Detecting your location...</p>
                </div>
              )}

              {/* Results shown after animation ends and detection finishes */}
              {!showAmbuAnimation && !isLocDetecting && (
                <div className="animate-card-fade-in opacity-0" style={{ animationDelay: '0ms' }}>
                  {locAllowed ? (
                    /* Location Allowed: Map with nearby hospitals */
                    <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-amber-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Nearby Hospitals</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-bold">📍 Detected Location: {locCoords.lat?.toFixed(6)}, {locCoords.lng?.toFixed(6)}</p>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 h-96 w-full bg-slate-50">
                        <iframe
                          title="Nearby Hospitals Map"
                          src={`https://maps.google.com/maps?q=hospitals+near+${locCoords.lat},${locCoords.lng}&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                        />
                      </div>

                      <div className="flex justify-start">
                        <a
                          href={`https://www.google.com/maps/search/hospitals+near+me/@${locCoords.lat},${locCoords.lng},14z`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 active:scale-98 text-sm"
                        >
                          <MapPin className="w-4 h-4" />
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  ) : (
                    /* Location Denied: Manual Search Fallback */
                    <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md shadow-rose-500/20">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hospital Finder</h3>
                          <p className="text-red-500 dark:text-red-400 text-xs mt-0.5 font-bold">⚠️ Location access denied — search manually</p>
                        </div>
                      </div>

                      <div className="p-6 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col justify-center max-w-xl">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                          <Search className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          Manual City Search
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                          Enter your city or region name below to find hospitals manually on the map.
                        </p>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            if (manualCity.trim()) {
                              setSearchCity(manualCity.trim())
                            }
                          }}
                          className="flex gap-3"
                        >
                          <input
                            type="text"
                            placeholder="e.g. New Delhi, Mumbai, Lucknow"
                            value={manualCity}
                            onChange={(e) => setManualCity(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                            required
                          />
                          <button
                            type="submit"
                            disabled={!manualCity.trim()}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 active:scale-98 text-sm"
                          >
                            Search
                          </button>
                        </form>
                      </div>

                      {searchCity && (
                        <div className="space-y-4 animate-card-fade-in opacity-0" style={{ animationDelay: '50ms' }}>
                          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 h-96 w-full bg-slate-50">
                            <iframe
                              title={`Hospitals in ${searchCity} Map`}
                              src={`https://maps.google.com/maps?q=hospitals+in+${encodeURIComponent(searchCity)}&output=embed`}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen=""
                              loading="lazy"
                            />
                          </div>
                          <div className="flex justify-start">
                            <a
                              href={`https://www.google.com/maps/search/hospitals+in+${encodeURIComponent(searchCity)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 active:scale-98 text-sm"
                            >
                              <MapPin className="w-4 h-4" />
                              Open in Google Maps
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="animate-tab-fade-in space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Customize how ArogyaBot addresses you.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 rounded-2xl p-8 shadow-sm max-w-2xl animate-card-fade-in opacity-0" style={{ animationDelay: '0ms' }}>
                {/* Avatar circle with user initials */}
                <div className="flex flex-col items-center mb-8 pb-6 border-b border-slate-100 dark:border-slate-700/50">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-slate-900">
                    {(() => {
                      const name = displayName || 'User'
                      const parts = name.split(' ')
                      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
                      return name.substring(0, 2).toUpperCase()
                    })()}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-3">{displayName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
                </div>

                {saveMessage && (
                  <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-6 ${saveSuccess
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
        </div>
      </main>
    </div>
  )
}
