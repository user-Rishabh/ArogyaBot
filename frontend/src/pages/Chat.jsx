import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Send, Mic, MicOff, ArrowLeft, HeartPulse,
  Globe2, StopCircle, Zap, Sun, Moon
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useSpeech } from '../hooks/useSpeech'

/* ─── Demo responses pool ─── */
const DEMO_RESPONSES_EN = {
  default: [
    "I understand your concern. Could you tell me more about when these symptoms started and how severe they are on a scale of 1–10?",
    "Thank you for sharing that. Based on what you've described, this could be related to several conditions. Are you experiencing any other symptoms alongside this?",
    "I see. Have you noticed if anything makes it better or worse? For example, rest, food, or certain activities?",
    "That's helpful information. I'd recommend staying well-hydrated and getting adequate rest. If symptoms persist beyond 2–3 days or worsen, please consult a qualified doctor.",
    "Based on your symptoms, this sounds like it could be a mild viral infection. Common remedies include rest, fluids, and light meals. Do you have any known allergies or existing medical conditions I should be aware of?",
    "I recommend monitoring your temperature regularly. If it exceeds 103°F (39.4°C), seek medical attention immediately. In the meantime, a cool compress and paracetamol (if not contraindicated) may help.",
  ],
  headache: "Headaches can have many causes — dehydration, stress, eye strain, or infections. Drink plenty of water, rest in a quiet dark room, and avoid screens for a while. If the headache is severe, sudden, or accompanied by fever/stiff neck, please seek medical help immediately.",
  fever: "A mild fever (under 101°F) is often the body fighting an infection. Stay hydrated, rest well, and use a cool compress. Take paracetamol if needed. If fever exceeds 103°F or lasts more than 3 days, consult a doctor right away.",
  cough: "For a dry cough, warm water with honey and ginger can be soothing. For a productive cough, stay hydrated to help clear secretions. If the cough lasts more than 2 weeks or is accompanied by blood, difficulty breathing, or chest pain, please see a doctor.",
  cold: "For common cold symptoms, rest is essential. Steam inhalation, warm fluids, and saline nasal drops can help relieve congestion. Symptoms usually resolve within 7–10 days.",
}

const DEMO_RESPONSES_HI = {
  default: [
    "मैं आपकी बात समझ गया। क्या आप मुझे बता सकते हैं कि यह लक्षण कब से शुरू हुए और 1 से 10 के पैमाने पर कितने गंभीर हैं?",
    "धन्यवाद। आपने जो बताया उसके आधार पर यह कई कारणों से हो सकता है। क्या आपको इसके अलावा और कोई लक्षण भी हैं?",
    "अच्छा। क्या आपने ध्यान दिया है कि कोई चीज़ इसे बेहतर या बदतर बनाती है? जैसे आराम, खाना, या कोई गतिविधि?",
    "पानी खूब पिएं और आराम करें। अगर लक्षण 2-3 दिन से ज़्यादा रहें या बढ़ें, तो कृपया किसी डॉक्टर से मिलें।",
    "आपके लक्षणों के आधार पर यह हल्का वायरल संक्रमण हो सकता है। आराम करें, तरल पदार्थ लें, और हल्का खाना खाएं।",
  ],
  headache: "सिरदर्द के कई कारण हो सकते हैं — डिहाइड्रेशन, तनाव, या संक्रमण। खूब पानी पिएं और अंधेरे कमरे में आराम करें। अगर सिरदर्द बहुत तेज़ हो या बुखार के साथ हो, तो तुरंत डॉक्टर से मिलें।",
  fever: "हल्का बुखार (101°F से कम) अक्सर शरीर का संक्रमण से लड़ने का तरीका है। पानी पिएं, आराम करें, और ठंडी पट्टी रखें। अगर बुखार 103°F से ऊपर जाए तो तुरंत डॉक्टर से मिलें।",
  cough: "सूखी खांसी के लिए शहद और अदरक के साथ गर्म पानी पिएं। अगर खांसी 2 हफ्ते से ज़्यादा रहे या खून आए, तो डॉक्टर से मिलें।",
}

function getDemoReply(text, lang) {
  const lower = text.toLowerCase()
  const pool = lang === 'hi' ? DEMO_RESPONSES_HI : DEMO_RESPONSES_EN
  if (lower.includes('headache') || lower.includes('सिरदर्द')) return pool.headache
  if (lower.includes('fever')    || lower.includes('बुखार'))   return pool.fever
  if (lower.includes('cough')    || lower.includes('खांसी'))   return pool.cough
  if (lower.includes('cold')     || lower.includes('ठंड'))     return pool.cold || pool.default[0]
  const arr = pool.default
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ─── Message bubble ─── */
function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-slide-up`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mr-2.5 shrink-0 mt-1 shadow-md shadow-indigo-500/20">
          <HeartPulse className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={
          isUser
            ? 'bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-sm max-w-[85%] sm:max-w-[75%] text-sm leading-relaxed shadow-md'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%] sm:max-w-[75%] text-sm leading-relaxed border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-300'
        }
      >
        {msg.content}
      </div>
    </div>
  )
}

/* ─── Typing indicator ─── */
function TypingDots() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mr-2.5 shrink-0 shadow-md shadow-indigo-500/20">
        <HeartPulse className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5 transition-colors duration-300">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce-dot dot-1" />
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce-dot dot-2" />
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce-dot dot-3" />
      </div>
    </div>
  )
}

/* ─── Main Chat page ─── */
export default function Chat() {
  const { sessionId: urlSessionId } = useParams()
  const { user }   = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate   = useNavigate()

  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [sessionId, setSessionId] = useState(urlSessionId || null)
  const [isLoading, setIsLoading] = useState(false)
  const [language,  setLanguage]  = useState('en') // 'en' | 'hi'

  const isDemo         = Boolean(user?.isDemo)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  const speechLang = language === 'hi' ? 'hi-IN' : 'en-IN'
  const {
    transcript, isListening, isSupported,
    startListening, stopListening, clearTranscript,
  } = useSpeech(speechLang)

  /* Sync speech transcript → input */
  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript])

  /* Auto-scroll */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  /* Focus input on mount */
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleMicToggle() {
    if (isListening) {
      stopListening()
    } else {
      clearTranscript()
      startListening()
    }
  }

  function buildHistory(msgs) {
    return msgs.slice(-6).map(m => ({ role: m.role, content: m.content }))
  }

  /* ── Demo reply simulation ── */
  async function getDemoResponse(text) {
    return new Promise(resolve => {
      const delay = 1000 + Math.random() * 1000
      setTimeout(() => {
        resolve(getDemoReply(text, language))
      }, delay)
    })
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || isLoading) return

    if (isListening) stopListening()
    clearTranscript()

    const userMsg        = { role: 'user', content: text, id: Date.now() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      let reply

      if (isDemo) {
        /* ── Demo mode: use local mock responses ── */
        reply = await getDemoResponse(text)
        if (!sessionId) {
          const demoSessionId = `demo-${Date.now()}`
          setSessionId(demoSessionId)
          window.history.replaceState(null, '', `/chat/${demoSessionId}`)
        }
      } else {
        /* ── Real API mode ── */
        let activeSessionId = sessionId

        if (!activeSessionId) {
          const { data } = await axios.post('/api/chat/session', {
            userId:       user?.id,
            firstMessage: text,
          })
          activeSessionId = data.sessionId
          setSessionId(activeSessionId)
          window.history.replaceState(null, '', `/chat/${activeSessionId}`)
        }

        const { data } = await axios.post('/api/chat', {
          message:     text,
          sessionId:   activeSessionId,
          language,
          chatHistory: buildHistory(updatedMessages),
        })
        reply = data.reply || data.message || 'I could not understand that. Please try again.'
      }

      setMessages(prev => [...prev, {
        role: 'assistant', content: reply, id: Date.now() + 1,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: 'Sorry, something went wrong. Please check your connection and try again.',
        id:      Date.now() + 1,
      }])
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const langLabel = language === 'en' ? 'EN' : 'हिंदी'

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            id="chat-back-btn"
            onClick={() => navigate('/dashboard')}
            className="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
              <HeartPulse className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">ArogyaBot</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-tight">● Online</p>
            </div>
          </div>

          {/* Demo badge */}
          {isDemo && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Demo</span>
            </div>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Toggle */}
          <button
            id="chat-lang-toggle-btn"
            onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-sm font-medium"
            title="Toggle language"
          >
            <Globe2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-slate-700 dark:text-slate-300">{langLabel}</span>
          </button>
        </div>

        {/* Demo mode notice strip */}
        {isDemo && (
          <div className="bg-amber-50 dark:bg-amber-500/5 border-b border-amber-200 dark:border-amber-500/10 px-4 py-1.5 text-center transition-colors duration-300">
            <p className="text-amber-600 dark:text-amber-400/80 text-xs">
              ⚡ Demo Mode — responses are simulated.{' '}
              <a href="/signup" className="underline hover:text-amber-700 dark:hover:text-amber-300">Create a free account</a>{' '}
              to connect your real backend.
            </p>
          </div>
        )}
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-5 shadow-xl shadow-indigo-500/20">
                <HeartPulse className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {language === 'hi' ? 'नमस्ते! मैं ArogyaBot हूँ।' : "Hello! I'm ArogyaBot."}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                {language === 'hi'
                  ? 'अपने लक्षण बताएं और मैं आपकी मदद करूँगा।'
                  : "Describe your symptoms and I'll do my best to help you."}
              </p>
              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {(language === 'hi'
                  ? ['सिरदर्द है', 'बुखार है', 'खांसी है']
                  : ['I have a headache', 'I have fever', 'I have a cough']
                ).map(chip => (
                  <button
                    key={chip}
                    onClick={() => { setInput(chip); inputRef.current?.focus() }}
                    className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 rounded-full text-indigo-600 dark:text-indigo-300 text-xs transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}

          {/* Typing indicator */}
          {isLoading && <TypingDots />}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input bar */}
      <footer className="shrink-0 border-t border-slate-100 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Mic active banner */}
          {isListening && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Listening… speak now
              <button onClick={stopListening} className="w-11 h-11 flex items-center justify-center ml-auto hover:text-red-700 dark:hover:text-red-300">
                <StopCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Mic button */}
            {isSupported && (
              <button
                id="chat-mic-btn"
                onClick={handleMicToggle}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            {/* Text input */}
            <textarea
              ref={inputRef}
              id="chat-input"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === 'hi'
                  ? 'अपना संदेश लिखें… (Enter भेजें)'
                  : 'Type your message… (Enter to send)'
              }
              className="flex-1 resize-none py-2.5 px-4 max-h-32 min-h-[44px] leading-snug scrollbar-hide bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              style={{ height: 'auto' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
              }}
            />

            {/* Send button */}
            <button
              id="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="shrink-0 w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-2">
            ArogyaBot is for informational purposes only — not a medical diagnosis.
          </p>
        </div>
      </footer>
    </div>
  )
}
