import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeartPulse, MessageCircle, Plus, LogOut,
  User, Sparkles, Clock, ChevronRight, Sun, Moon,
  Mail, AlertCircle, CheckCircle, Info, Trash2,
  Activity, MapPin, Search, Loader2, Pill, FlaskConical,
  AlertTriangle, ShieldAlert
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import EmergencyNumbers from '../components/EmergencyNumbers'
import BMICalculator from '../components/BMICalculator'

const WHATSAPP_NUMBER = '14155238886'
const WHATSAPP_DEFAULT_TEXT = 'Hello ArogyaBot! I would like to get some health guidance.'

const getNearbyHospitals = (city = '') => {
  const prefix = city ? `${city} ` : ''
  return [
    {
      name: `${prefix}Community Health Centre (CHC)`,
      type: 'Government',
      specialty: '24/7 Emergency, General Medicine, Pediatrics, Vaccination',
      address: 'Main Bazar Road, near Panchayat Bhawan',
      distance: '1.2 km',
      query: `${prefix}Community Health Centre`
    },
    {
      name: `${prefix}District Civil Hospital`,
      type: 'Government',
      specialty: 'Trauma Care, Surgery, Maternity, ICU, Blood Bank',
      address: 'Station Road, near Civil Lines',
      distance: '2.8 km',
      query: `${prefix}District Civil Hospital`
    },
    {
      name: `${prefix}Primary Health Centre (PHC)`,
      type: 'Government',
      specialty: 'Outpatient (OPD), Immunization, Basic Diagnostics',
      address: 'Rural Link Road, Sector 3',
      distance: '4.5 km',
      query: `${prefix}Primary Health Centre`
    },
    {
      name: 'Arogya Wellness Clinic',
      type: 'Private',
      specialty: 'General Consultation, Pharmacy, Preventive Care',
      address: 'High Street, near Gandhi Statue',
      distance: '5.1 km',
      query: 'Arogya Wellness Clinic'
    },
    {
      name: `${prefix}Lifeline Multi-Specialty Hospital`,
      type: 'Private',
      specialty: 'Emergency Medicine, Cardiology, Orthopedics, Pharmacy',
      address: 'National Highway Bypass, near Toll Plaza',
      distance: '7.3 km',
      query: `${prefix}Lifeline Multi-Specialty Hospital`
    }
  ]
}

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
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'chats', 'tips', 'profile'
  const [nameInput, setNameInput] = useState('')
  const [ageInput, setAgeInput] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [heightInput, setHeightInput] = useState('')
  const [genderInput, setGenderInput] = useState('')
  const [conditionsInput, setConditionsInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(true)
  const [dietData, setDietData] = useState({
  age: '',
  weight: '',
  height: '',
  goal: 'Weight Loss',
  dietType: 'Vegetarian'
})

const [dietPlan, setDietPlan] = useState(null)
const [dietLoading, setDietLoading] = useState(false)

  // Geolocation and Care Finder states
  const [locCoords, setLocCoords] = useState({ lat: null, lng: null })
  const [locAllowed, setLocAllowed] = useState(null)
  const [isLocDetecting, setIsLocDetecting] = useState(false)
  const [manualCity, setManualCity] = useState('')
  const [searchCity, setSearchCity] = useState('')

  // Medicine Suggester states
  const [symptoms, setSymptoms] = useState('')
  const [medSystem, setMedSystem] = useState('Allopathy')
  const [userAge, setUserAge] = useState('')
  const [suggestionsResult, setSuggestionsResult] = useState(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsProgress, setSuggestionsProgress] = useState('')
  const [suggestionsError, setSuggestionsError] = useState('')
  const [suggesterLang, setSuggesterLang] = useState('EN') // 'EN' or 'HI'
  const [suggestionsLoadingText, setSuggestionsLoadingText] = useState('Analyzing your symptoms...')

  useEffect(() => {
    let timeoutId
    if (suggestionsLoading) {
      setSuggestionsLoadingText('Analyzing your symptoms...')
      timeoutId = setTimeout(() => {
        setSuggestionsLoadingText('Generating personalized remedies...')
      }, 1000)
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [suggestionsLoading])

  const handleChipClick = (chip) => {
    const chipLower = chip.toLowerCase()
    const currentSymptoms = symptoms.trim()
    
    if (currentSymptoms.toLowerCase().includes(chipLower)) {
      let newSymptoms = currentSymptoms
        .replace(new RegExp(`\\b${chip}\\b`, 'gi'), '')
        .replace(/,\s*,/g, ',')
        .replace(/^,\s*/, '')
        .replace(/,\s*$/, '')
        .trim()
      setSymptoms(newSymptoms)
    } else {
      if (currentSymptoms === '') {
        setSymptoms(chip)
      } else {
        const delimiter = currentSymptoms.endsWith(',') ? ' ' : ', '
        setSymptoms(currentSymptoms + delimiter + chip)
      }
    }
  }

  const handleShareWhatsApp = () => {
    if (!suggestionsResult) return

    const remedyDetails = (suggestionsResult.suggestions || [])
      .map(s => `${s.medicine} - ${s.dosage}`)
      .join('\n')

    const summaryText = `ArogyaBot Remedy Report\nSymptoms: ${symptoms}\nSystem: ${medSystem}\n${remedyDetails}`

    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank')
  }

  const handleGetSuggestions = async () => {
    if (!symptoms.trim()) {
      setSuggestionsError('Please enter your symptoms.')
      return
    }
    if (!userAge || isNaN(userAge) || parseInt(userAge) <= 0) {
      setSuggestionsError('Please enter a valid age.')
      return
    }

    setSuggestionsLoading(true)
    setSuggestionsError('')
    setSuggestionsResult(null)

    const finalSymptoms = suggesterLang === 'HI' ? `${symptoms} (Please respond in Hindi language)` : symptoms

    const steps = [
      '🧪 Analyzing symptoms and age profile...',
      '🔍 Accessing selected medical system knowledge...',
      '⚠️ Reviewing contraindications and safety guidelines...',
      '🍽️ Formulating dietary advice & dosage levels...',
      '✨ Compiling personal medicine suggestions...'
    ]
    
    let stepIndex = 0
    setSuggestionsProgress(steps[0])
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++
        setSuggestionsProgress(steps[stepIndex])
      }
    }, 1500)

    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const response = await axios.post(`${apiURL}/suggest-medicines`, {
        symptoms: finalSymptoms,
        system: medSystem,
        age: parseInt(userAge)
      })
      setSuggestionsResult(response.data)
    } catch (backendError) {
      console.warn('Backend suggestions failed or unavailable, falling back to frontend direct call:', backendError)
      
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
        if (!apiKey) {
          throw new Error('API keys are not configured. Please start backend server or configure VITE_GOOGLE_API_KEY.', { cause: backendError })
        }

        const systemPrompt = `You are an expert medical consultant, wellness advisor, and pharmacist AI assistant.
Given the user's symptoms, age, and preferred system of medicine (Ayurvedic, Allopathy, or Homeopathy), perform a safe clinical evaluation and suggest remedies.
Your response MUST be a valid JSON object matching the schema below.
Provide realistic, common suggestions suitable for the user's age.
Always include appropriate safety disclaimers, especially for children (under 12) or elderly users.
Do not include any markdown formatting like \`\`\`json or \`\`\`, just return the raw JSON text.

JSON Schema:
{
  "system": "Ayurvedic" | "Allopathy" | "Homeopathy",
  "ageGroup": "Pediatric" | "Adult" | "Geriatric",
  "summary": "Overall guidance for these symptoms in this age group under the chosen system.",
  "suggestions": [
    {
      "medicine": "Medicine/Remedy Name",
      "purpose": "What this medicine helps with in relation to the symptoms.",
      "dosage": "Typical dosage instructions tailored specifically to their age (e.g. For a 5-year-old: 2.5ml syrup... or For a 30-year-old: 1 tablet...).",
      "timing": "E.g., Take twice daily, in morning and evening after food."
    }
  ],
  "warnings": [
    "Safety warning or precaution (e.g., Avoid if you have high blood pressure, consult doctor immediately if symptoms worsen, etc.)"
  ]
}`

        const promptText = `${systemPrompt}\n\nUser Input Details:\nSymptoms: ${finalSymptoms}\nPreferred System: ${medSystem}\nUser Age: ${userAge}`
        
        const modelsToTry = [
          'gemini-3.5-flash',
          'gemini-2.5-flash',
          'gemini-3.1-flash-lite',
          'gemini-2.5-flash-lite'
        ]
        
        let success = false
        let lastError = null

        for (const currentModelName of modelsToTry) {
          try {
            console.log(`Fallback: Attempting direct frontend suggestion check with model: ${currentModelName}`)
            const fallbackResponse = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${currentModelName}:generateContent?key=${apiKey}`,
              {
                contents: [
                  {
                    parts: [
                      {
                        text: promptText
                      }
                    ]
                  }
                ]
              }
            )

            const candidate = fallbackResponse.data?.candidates?.[0]
            const replyText = candidate?.content?.parts?.[0]?.text
            if (replyText) {
              let cleanJsonStr = replyText.trim()
              if (cleanJsonStr.startsWith('```')) {
                cleanJsonStr = cleanJsonStr.replace(/^```(json)?\n/, '').replace(/\n```$/, '')
              }
              const parsedData = JSON.parse(cleanJsonStr)
              setSuggestionsResult(parsedData)
              success = true
              console.log(`Fallback success with frontend model: ${currentModelName}`)
              break
            }
          } catch (modelErr) {
            console.warn(`Fallback frontend model ${currentModelName} failed:`, modelErr.response?.data || modelErr.message)
            lastError = modelErr
          }
        }

        if (!success) {
          throw lastError || new Error('All frontend models failed')
        }

      } catch (fallbackError) {
        console.error('Frontend fallback suggestions error:', fallbackError)
        setSuggestionsError('Could not connect to service. Please check your internet connection or try again.')
      }
    } finally {
      clearInterval(progressInterval)
      setSuggestionsLoading(false)
    }
  }

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
      const demoProfile = JSON.parse(localStorage.getItem('arogyabot_demo_profile') || '{}')
      const initialProfile = {
        name: demoProfile.name || user.user_metadata?.name || 'Demo User',
        age: demoProfile.age || '',
        weight: demoProfile.weight || '',
        height: demoProfile.height || '',
        gender: demoProfile.gender || '',
        conditions: demoProfile.conditions || ''
      }
      setProfile(initialProfile)
      setNameInput(initialProfile.name)
      setAgeInput(initialProfile.age)
      setWeightInput(initialProfile.weight)
      setHeightInput(initialProfile.height)
      setGenderInput(initialProfile.gender)
      setConditionsInput(initialProfile.conditions)
      if (initialProfile.age) {
        setUserAge(initialProfile.age.toString())
      }
      setLoading(false)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const meta = user.user_metadata || {}
        const initialProfile = {
          name: data?.name || meta.name || '',
          age: data?.age !== undefined && data?.age !== null ? data.age : (meta.age || ''),
          weight: data?.weight !== undefined && data?.weight !== null ? data.weight : (meta.weight || ''),
          height: data?.height !== undefined && data?.height !== null ? data.height : (meta.height || ''),
          gender: data?.gender || meta.gender || '',
          conditions: data?.conditions || meta.conditions || ''
        }
        setProfile(initialProfile)
        setNameInput(initialProfile.name)
        setAgeInput(initialProfile.age)
        setWeightInput(initialProfile.weight)
        setHeightInput(initialProfile.height)
        setGenderInput(initialProfile.gender)
        setConditionsInput(initialProfile.conditions)
        if (initialProfile.age) {
          setUserAge(initialProfile.age.toString())
        }
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    if (profile) {
      setDietData(prev => ({
        ...prev,
        age: profile.age !== undefined && profile.age !== null ? profile.age.toString() : prev.age,
        weight: profile.weight !== undefined && profile.weight !== null ? profile.weight.toString() : prev.weight,
        height: profile.height !== undefined && profile.height !== null ? profile.height.toString() : prev.height,
      }))
    }
  }, [profile])

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
  const generateDietPlan = async () => {
  try {
    setDietLoading(true)

    const response = await axios.post(
      'http://localhost:3000/api/diet/generate',
      dietData
    )

    setDietPlan(response.data)
  } catch (error) {
    console.error(error)
  } finally {
    setDietLoading(false)
  }
}

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

  const handleClearAllSessions = async () => {
    if (!window.confirm('Are you sure you want to delete all chat history? This cannot be undone.')) return

    console.log('Attempting to clear all sessions for user:', user?.id)
    try {
      if (user?.isDemo) {
        setSessions([])
        return
      }

      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setSessions([])
    } catch (err) {
      console.error('Clear all sessions error:', err)
      alert('Failed to clear all chats. Try again.')
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!user?.id) return
    setSavingProfile(true)
    setSaveMessage('')
    setSaveSuccess(true)

    const updatedProfile = {
      name: nameInput,
      age: ageInput ? parseInt(ageInput) : '',
      weight: weightInput ? parseFloat(weightInput) : '',
      height: heightInput ? parseFloat(heightInput) : '',
      gender: genderInput,
      conditions: conditionsInput
    }

    if (user.isDemo) {
      localStorage.setItem('arogyabot_demo_profile', JSON.stringify(updatedProfile))
      setProfile(updatedProfile)
      setSaveMessage('Demo profile updated successfully!')
      setSavingProfile(false)
      return
    }

    try {
      // 1. Update profiles table (all fields)
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          name: nameInput,
          age: ageInput ? parseInt(ageInput) : null,
          weight: weightInput ? parseFloat(weightInput) : null,
          height: heightInput ? parseFloat(heightInput) : null,
          gender: genderInput || null,
          conditions: conditionsInput || null
        })

      if (dbError) throw dbError

      // 2. Update user_metadata (all fields)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: nameInput,
          age: ageInput ? parseInt(ageInput) : null,
          weight: weightInput ? parseFloat(weightInput) : null,
          height: heightInput ? parseFloat(heightInput) : null,
          gender: genderInput,
          conditions: conditionsInput
        }
      })

      if (authError) throw authError

      setProfile(updatedProfile)
      setSaveMessage('Profile updated successfully!')
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Navigation Sidebar */}
          <div className="w-full lg:w-64 lg:min-w-[220px] shrink-0 flex flex-col justify-between lg:min-h-[560px] bg-gradient-to-b from-white to-indigo-50/30 dark:from-slate-800 dark:to-slate-900 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-md">
            
            {/* Top Section */}
            <div className="flex lg:flex-col flex-row flex-wrap gap-1 overflow-x-auto lg:overflow-x-visible scrollbar-hide w-full flex-1">
              {/* ArogyaBot mini logo */}
              <div className="hidden lg:flex items-center gap-2 px-3 pb-3 border-b border-indigo-100/50 dark:border-slate-700/50 mb-3 w-full">
                <HeartPulse className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-850 dark:from-indigo-400 dark:to-indigo-300">
                  ArogyaBot
                </span>
              </div>

              {[
                { id: 'overview', label: 'Overview', icon: Sparkles },
                { id: 'chats', label: 'Recent Chats', icon: Clock, count: sessions.length },
                { id: 'suggestions', label: 'Medicine Suggester', icon: Pill },
                { id: 'diet', label: 'Diet Planner', icon: HeartPulse },
                { id: 'tools', label: 'Health Tools', icon: Activity },
                { id: 'care', label: 'Care Finder', icon: MapPin },
                { id: 'tips', label: 'Tips & Guidelines', icon: Info },
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
                    className={`flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all w-full text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 rounded-xl transition-all'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="flex-1">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                        isActive
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

            {/* Pinned Bottom: Profile Settings */}
            <div className="mt-auto pt-3 border-t border-indigo-100/50 dark:border-slate-755 w-full">
              {(() => {
                const isActive = activeTab === 'profile'
                return (
                  <button
                    onClick={() => {
                      setActiveTab('profile')
                      setSaveMessage('')
                    }}
                    className={`flex items-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all w-full text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 rounded-xl transition-all'
                    }`}
                  >
                    <User className="w-[18px] h-[18px] shrink-0" />
                    <span>Profile Settings</span>
                  </button>
                )
              })()}
            </div>
          </div>

          {/* Main Content Pane */}
          <div className="flex-1 w-full min-w-0">
            {/* Active Tab Content Wrapper */}
            <div className="space-y-6">

          {/* Home Tab */}
          {activeTab === 'overview' && (
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Medical Conversations</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Access your previous sessions and medical guidance from ArogyaBot.</p>
                </div>
                {sessions.length > 0 && (
                  <button
                    id="clear-all-chats-btn"
                    onClick={handleClearAllSessions}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Chats
                  </button>
                )}
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
                    /* Location Allowed: List with nearby hospitals */
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

                      <div className="space-y-4">
                        {getNearbyHospitals().map((hosp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                <HeartPulse className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                    {hosp.name}
                                  </h4>
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    hosp.type === 'Government'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800'
                                  }`}>
                                    {hosp.type}
                                  </span>
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                                    {hosp.distance}
                                  </span>
                                </div>
                                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 leading-snug">
                                  {hosp.address}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 leading-snug truncate italic">
                                  {hosp.specialty}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hosp.query)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 ml-4 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 group-hover:scale-102"
                            >
                              <span>Go</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
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
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            Hospitals near {searchCity}
                          </h3>
                          <div className="space-y-4">
                            {getNearbyHospitals(searchCity).map((hosp, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group"
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                                    <HeartPulse className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                        {hosp.name}
                                      </h4>
                                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                        hosp.type === 'Government'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800'
                                      }`}>
                                        {hosp.type}
                                      </span>
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                                        {hosp.distance}
                                      </span>
                                    </div>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 leading-snug">
                                      {hosp.address}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 leading-snug truncate italic">
                                      {hosp.specialty}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hosp.query)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 ml-4 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 group-hover:scale-102"
                                >
                                  <span>Go</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        {activeTab === 'diet' && (
          <div className="animate-tab-fade-in max-w-3xl mx-auto space-y-4">
            
            {/* HEADER CARD */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-6 border border-indigo-100 dark:border-slate-700 shadow-sm">
              <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 to-indigo-850 dark:from-indigo-400 dark:to-indigo-300">
                🥗 AI Diet Planner
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">
                Get a personalized meal plan based on your body metrics and health goals
              </p>
            </div>

            {/* FORM CARD */}
            <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Grid of Inputs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={dietData.age}
                    onChange={(e) =>
                      setDietData({
                        ...dietData,
                        age: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 70"
                    value={dietData.weight}
                    onChange={(e) =>
                      setDietData({
                        ...dietData,
                        weight: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 175"
                    value={dietData.height}
                    onChange={(e) =>
                      setDietData({
                        ...dietData,
                        height: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Goal selector as pill buttons */}
              <div className="space-y-2 flex flex-col items-center">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  Health Goal
                </label>
                <div className="flex flex-wrap gap-2 justify-center w-full">
                  {[
                    'Weight Loss',
                    'Weight Gain',
                    'Maintain Weight',
                    'Build Muscle',
                    'Diabetic Diet',
                    'Heart Healthy'
                  ].map(g => {
                    const isSelected = dietData.goal === g
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          setDietData({
                            ...dietData,
                            goal: g
                          })
                        }
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-green-600 text-white border-transparent shadow-sm'
                            : 'border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900 hover:bg-green-50 dark:hover:bg-green-950/20'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dietary preference pills */}
              <div className="space-y-2 flex flex-col items-center">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  Dietary Preference
                </label>
                <div className="flex flex-wrap gap-2 justify-center w-full">
                  {['Vegetarian', 'Non-Vegetarian', 'Vegan'].map(dt => {
                    const isSelected = dietData.dietType === dt
                    return (
                      <button
                        key={dt}
                        type="button"
                        onClick={() =>
                          setDietData({
                            ...dietData,
                            dietType: dt
                          })
                        }
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-green-600 text-white border-transparent shadow-sm'
                            : 'border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900 hover:bg-green-50 dark:hover:bg-green-950/20'
                        }`}
                      >
                        {dt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Generate button */}
              <button
                type="button"
                onClick={generateDietPlan}
                disabled={dietLoading || !dietData.age || !dietData.weight || !dietData.height}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {dietLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Personalized Plan...
                  </>
                ) : (
                  'Generate Diet Plan'
                )}
              </button>

            </div>

            {/* RESULTS CARD */}
            {dietPlan && (
              <div className="bg-white dark:bg-slate-800 border border-green-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6 animate-card-fade-in opacity-0" style={{ animationDelay: '50ms' }}>
                <div className="border-b border-green-100 dark:border-slate-700/60 pb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    🥗 Your Personalized Diet Plan
                  </h3>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                    {dietData.goal}
                  </span>
                </div>

                {/* Grid of Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Estimated BMI', value: dietPlan.bmi || 'N/A', unit: '' },
                    { label: 'Daily Calories', value: dietPlan.calories || 'N/A', unit: ' kcal' },
                    { label: 'Water Intake', value: dietPlan.waterIntake || 'N/A', unit: '' }
                  ].map((m, idx) => (
                    <div key={idx} className="bg-green-50/50 dark:bg-slate-900/60 border border-green-100/40 dark:border-slate-750 p-3.5 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{m.label}</span>
                      <span className="text-base font-extrabold text-green-700 dark:text-green-400 mt-1 block">
                        {m.value}{m.unit}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Grid of Macros */}
                <div className="grid grid-cols-3 gap-3 border-t border-dashed border-green-100 dark:border-slate-700/50 pt-4">
                  {[
                    { label: 'Protein', value: dietPlan.protein || 'N/A' },
                    { label: 'Carbs', value: dietPlan.carbs || 'N/A' },
                    { label: 'Fats', value: dietPlan.fat || 'N/A' }
                  ].map((m, idx) => (
                    <div key={idx} className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{m.label}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day-wise meal plan: Breakfast | Mid-Morning | Lunch | Evening Snack | Dinner */}
                <div className="space-y-3.5 border-t border-green-150 dark:border-slate-700/50 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Daily Meal Breakdown
                  </h4>
                  {[
                    { label: 'Breakfast', value: dietPlan.breakfast, emoji: '🥞', cals: 'Est. 350-400 kcal' },
                    { label: 'Mid-Morning', value: dietPlan.midMorning || (dietPlan.snacks && dietPlan.snacks.toLowerCase().includes('and') ? dietPlan.snacks.split(/and/i)[0].trim() : dietPlan.snacks) || 'Fruit bowl', emoji: '🍎', cals: 'Est. 100-150 kcal' },
                    { label: 'Lunch', value: dietPlan.lunch, emoji: '🍲', cals: 'Est. 500-600 kcal' },
                    { label: 'Evening Snack', value: dietPlan.eveningSnack || (dietPlan.snacks && dietPlan.snacks.toLowerCase().includes('and') ? dietPlan.snacks.split(/and/i)[1].trim() : 'Nuts'), emoji: '🍵', cals: 'Est. 100-150 kcal' },
                    { label: 'Dinner', value: dietPlan.dinner, emoji: '🥗', cals: 'Est. 400-450 kcal' }
                  ].map((meal, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 p-4 bg-slate-50 dark:bg-slate-900 border border-green-100/30 dark:border-slate-800/80 rounded-2xl">
                      <span className="text-2xl shrink-0 mt-0.5" role="img" aria-label={meal.label}>
                        {meal.emoji}
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">
                            {meal.label}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                            {meal.cals}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          {meal.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* WhatsApp Share Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
                    onClick={() => {
                      const message = `
🥗 ArogyaBot Diet Plan 🥗

Goal: ${dietData.goal}
Diet: ${dietData.dietType}

🥞 Breakfast: ${dietPlan.breakfast}
🍎 Mid-Morning: ${dietPlan.midMorning || (dietPlan.snacks && dietPlan.snacks.toLowerCase().includes('and') ? dietPlan.snacks.split(/and/i)[0].trim() : dietPlan.snacks) || 'Fruit bowl'}
🍲 Lunch: ${dietPlan.lunch}
🍵 Evening Snack: ${dietPlan.eveningSnack || (dietPlan.snacks && dietPlan.snacks.toLowerCase().includes('and') ? dietPlan.snacks.split(/and/i)[1].trim() : 'Nuts')}
🥗 Dinner: ${dietPlan.dinner}

🔥 Calories: ${dietPlan.calories}
📊 BMI: ${dietPlan.bmi}
💧 Water Intake: ${dietPlan.waterIntake}
                      `
                      window.open(`https://wa.me/?text=${encodeURIComponent(message.trim())}`, '_blank')
                    }}
                  >
                    Share on WhatsApp
                  </button>
                </div>

                {/* Disclaimer banner */}
                <div className="px-6 py-5 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30 rounded-xl text-amber-800 dark:text-amber-400/80 text-xs leading-relaxed">
                  <strong>Disclaimer:</strong> This diet plan is AI-generated and is meant for general wellness guidance.
                  If you have underlying health issues, allergies, or chronic conditions, please consult a registered dietitian or medical practitioner before making major dietary changes.
                </div>

              </div>
            )}
          </div>
        )}

      {/* AI Medicine Suggester Tab */}
          {activeTab === 'suggestions' && (
            <div className="animate-tab-fade-in max-w-3xl mx-auto space-y-4">
              
              {/* SECTION 1 - Header card (full width) */}
              <div className="bg-gradient-to-r from-indigo-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-6 border border-indigo-100 dark:border-slate-700 shadow-sm">
                <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 to-indigo-850 dark:from-indigo-400 dark:to-indigo-300 flex items-center gap-2">
                  <Pill className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  AI Medicine Suggester
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">
                  Enter your symptoms, select your preferred system of medicine, and provide your age to get tailored medicine suggestions and dosage guidelines.
                </p>
              </div>

              {/* SECTION 2 - Symptom chips (full width card) */}
              <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-3">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Quick Symptoms
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Headache', 'Fever', 'Cough', 'Cold', 'Body Ache', 'Nausea', 'Fatigue', 'Back Pain'].map((chip) => {
                    const isSelected = symptoms.toLowerCase().includes(chip.toLowerCase())
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleChipClick(chip)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                            : 'border border-indigo-200 text-indigo-600 bg-white dark:bg-slate-900 dark:text-indigo-400 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-850/60'
                        }`}
                      >
                        {chip}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* SECTION 3 - Form card (full width) */}
              <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Describe Symptoms textarea */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Describe Symptoms
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. High fever, headache, body ache for 2 days"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium resize-none min-h-24"
                  />
                </div>

                {/* 3 System Pills in one row centered */}
                <div className="space-y-2 flex flex-col items-center">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                    Preferred System
                  </label>
                  <div className="flex gap-2 justify-center w-full max-w-md">
                    {[
                      { id: 'Allopathy', label: 'Allopathy', activeClass: 'bg-blue-600 text-white shadow-blue-500/20' },
                      { id: 'Ayurvedic', label: 'Ayurvedic', activeClass: 'bg-emerald-600 text-white shadow-emerald-500/20' },
                      { id: 'Homeopathy', label: 'Homeopathy', activeClass: 'bg-amber-600 text-white shadow-amber-500/20' }
                    ].map(sys => {
                      const isActive = medSystem === sys.id
                      return (
                        <button
                          key={sys.id}
                          type="button"
                          onClick={() => setMedSystem(sys.id)}
                          className={`flex-1 py-2 px-3 rounded-full text-xs font-bold border transition-all text-center ${
                            isActive
                              ? `${sys.activeClass} border-transparent shadow-md`
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {sys.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Age input + EN/हिंदी toggle + Get Suggestions button — all in one flex row, centered */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <div className="w-full sm:max-w-xs space-y-1">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Age (Years)"
                      value={userAge}
                      onChange={(e) => setUserAge(e.target.value)}
                      className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setSuggesterLang(prev => (prev === 'EN' ? 'HI' : 'EN'))}
                    className={`px-4 py-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center shrink-0 w-full sm:w-16 ${
                      suggesterLang === 'HI'
                        ? 'bg-amber-500 text-white border-transparent shadow-md shadow-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Toggle Hindi / English"
                  >
                    {suggesterLang === 'HI' ? 'हिंदी' : 'EN'}
                  </button>

                  <button
                    type="button"
                    onClick={handleGetSuggestions}
                    disabled={suggestionsLoading || !symptoms.trim() || !userAge}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-850 disabled:from-indigo-400 disabled:to-indigo-500 text-white rounded-xl text-sm font-extrabold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Get Suggestions
                  </button>
                </div>
              </div>

              {/* SECTION 4 - Results (full width, only shown after submit / when there is active loading, result, or error state) */}
              {(suggestionsLoading || suggestionsResult || suggestionsError) && (
                <div className="space-y-4 animate-card-fade-in opacity-0" style={{ animationDelay: '50ms' }}>
                  
                  {/* Heartbeat Medical Loading Animation */}
                  {suggestionsLoading && (
                    <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px] relative overflow-hidden">
                      <div className="relative flex flex-col items-center justify-center space-y-6">
                        <div className="relative flex items-center justify-center w-24 h-24">
                          <div className="absolute w-24 h-24 rounded-full bg-red-500/20 blur-xl animate-ping" />
                          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-100 dark:border-slate-850">
                            <HeartPulse className="w-10 h-10 text-red-500 animate-pulse" />
                          </div>
                        </div>
                        
                        <div className="space-y-2 max-w-sm">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base animate-pulse">
                            {suggestionsLoadingText}
                          </h4>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold transition-all duration-300">
                            {suggestionsProgress}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error state */}
                  {!suggestionsLoading && suggestionsError && (
                    <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-950/40 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-sm">
                      <div className="w-16 h-16 bg-red-550/10 dark:bg-red-950/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                        <AlertTriangle className="w-8 h-8 animate-bounce" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Safety Check Failed</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-6">{suggestionsError}</p>
                      <button
                        onClick={handleGetSuggestions}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Success Report output */}
                  {!suggestionsLoading && suggestionsResult && (
                    <div className="space-y-4">
                      
                      {/* Header card with system name + colored theme */}
                      <div className={`p-6 border border-l-4 rounded-2xl transition-all shadow-sm ${
                        suggestionsResult.system === 'Ayurvedic'
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 border-l-green-500 text-green-700 dark:text-green-300'
                          : suggestionsResult.system === 'Homeopathy'
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 border-l-amber-500 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 border-l-blue-500 text-blue-700 dark:text-blue-300'
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            suggestionsResult.system === 'Ayurvedic'
                              ? 'bg-green-500 text-white shadow-green-500/10'
                              : suggestionsResult.system === 'Homeopathy'
                              ? 'bg-amber-500 text-white shadow-amber-500/10'
                              : 'bg-blue-500 text-white shadow-blue-500/10'
                          }`}>
                            <FlaskConical className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-2.5">
                              <span>{suggestionsResult.system} Recommendations</span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                {suggestionsResult.ageGroup} Profile
                              </span>
                            </h3>
                            <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed font-medium">
                              {suggestionsResult.summary}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Remedy cards: grid grid-cols-1 md:grid-cols-2 gap-4 full width */}
                      {suggestionsResult.suggestions && suggestionsResult.suggestions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {suggestionsResult.suggestions.map((sug, idx) => (
                            <div
                              key={idx}
                              className={`p-6 bg-slate-50 dark:bg-slate-900 border border-l-4 rounded-2xl flex flex-col justify-between shadow-sm ${
                                suggestionsResult.system === 'Ayurvedic'
                                  ? 'border-l-green-500 border-y-slate-100 border-r-slate-100 dark:border-y-slate-800/80 dark:border-r-slate-800/80'
                                  : suggestionsResult.system === 'Homeopathy'
                                  ? 'border-l-amber-500 border-y-slate-100 border-r-slate-100 dark:border-y-slate-800/80 dark:border-r-slate-800/80'
                                  : 'border-l-blue-500 border-y-slate-100 border-r-slate-100 dark:border-y-slate-800/80 dark:border-r-slate-800/80'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <h4 className={`font-bold text-sm ${
                                  suggestionsResult.system === 'Ayurvedic'
                                    ? 'text-green-600 dark:text-green-400'
                                    : suggestionsResult.system === 'Homeopathy'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}>
                                  {sug.medicine}
                                </h4>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                  Purpose: <span className="text-slate-600 dark:text-slate-355 normal-case font-medium">{sug.purpose}</span>
                                </p>
                                <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-semibold">
                                  Dosage: <span className="text-slate-500 dark:text-slate-400 font-medium">{sug.dosage}</span>
                                </p>
                              </div>
                              <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase">
                                <Clock className={`w-3.5 h-3.5 shrink-0 ${
                                  suggestionsResult.system === 'Ayurvedic'
                                    ? 'text-green-500'
                                    : suggestionsResult.system === 'Homeopathy'
                                    ? 'text-amber-500'
                                    : 'text-blue-500'
                                }`} />
                                <span>{sug.timing}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-6 text-center text-sm text-slate-500">
                          No suggestions returned. Please refine your symptoms.
                        </div>
                      )}

                      {/* Clinical warnings below */}
                      {suggestionsResult.warnings && suggestionsResult.warnings.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-550" />
                            Clinical Safety Warnings
                          </h3>
                          <div className="space-y-2">
                            {suggestionsResult.warnings.map((warn, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-900/40 rounded-xl"
                              >
                                <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                <span className="text-xs text-red-700 dark:text-red-400 font-medium leading-relaxed">
                                  {warn}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* WhatsApp share button bottom right */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleShareWhatsApp}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
                        >
                          Share on WhatsApp
                        </button>
                      </div>

                      {/* Disclaimer banner at very bottom */}
                      <div className="px-6 py-5 sm:p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl">
                        <p className="text-amber-700/80 dark:text-amber-400/80 text-xs leading-relaxed">
                          <strong>Disclaimer:</strong> This recommendation report is generated by AI and is intended for educational purposes only.
                          It does not replace professional medical diagnosis or consultation.
                          Always consult a qualified doctor or physician before administering any new medicine, especially for children, pregnant women, or elderly patients.
                        </p>
                      </div>

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

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="e.g. 28"
                      value={ageInput}
                      onChange={(e) => setAgeInput(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={genderInput}
                      onChange={(e) => setGenderInput(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Height (in cm)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="250"
                        step="0.1"
                        placeholder="e.g. 175"
                        value={heightInput}
                        onChange={(e) => setHeightInput(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Weight (in kg)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="500"
                        step="0.1"
                        placeholder="e.g. 70"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                      />
                    </div>
                  </div>

                  {(() => {
                    const wVal = parseFloat(weightInput)
                    const hVal = parseFloat(heightInput)
                    if (isNaN(wVal) || isNaN(hVal) || hVal <= 0) return null
                    const bmi = (wVal / Math.pow(hVal / 100, 2)).toFixed(1)
                    let category = 'Normal'
                    let color = 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50'
                    if (bmi < 18.5) {
                      category = 'Underweight'
                      color = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50'
                    } else if (bmi >= 25 && bmi < 30) {
                      category = 'Overweight'
                      color = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                    } else if (bmi >= 30) {
                      category = 'Obese'
                      color = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                    }
                    return (
                      <div className={`p-4 border rounded-xl flex items-center justify-between transition-all duration-300 ${color}`}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">Body Mass Index (BMI)</span>
                          <span className="text-xl font-extrabold mt-0.5">{bmi}</span>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-white/20 dark:bg-black/20">
                          {category}
                        </span>
                      </div>
                    )
                  })()}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Existing Medical Conditions / Chronic Diseases
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Hypertension, Type 2 Diabetes, Penicillin allergy (leave blank if none)"
                      value={conditionsInput}
                      onChange={(e) => setConditionsInput(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium resize-none"
                    />
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
          </div>
        </div>
      </main>
    </div>
  )
}
