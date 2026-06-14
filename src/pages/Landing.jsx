import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  HeartPulse, MessageCircle, Mic, Zap, ChevronRight, Star, Clock, Sun, Moon, Menu, X
} from 'lucide-react'

function FadeIn({ children, className = '' }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useState(() => {
    if (typeof document !== 'undefined') {
      const el = document.createElement('div')
      return { current: el }
    }
    return { current: null }
  })[0]

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(node) } },
      { threshold: 0.1 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  )
}

const testimonials = [
  { name: 'Priya Sharma', role: 'Mumbai', text: 'ArogyaBot helped me understand my symptoms before my doctor visit. Incredibly helpful!', stars: 5 },
  { name: 'Rahul Verma',  role: 'Delhi',  text: 'The Hindi support is excellent. Finally a health AI that speaks my language.',           stars: 5 },
  { name: 'Anita Pillai', role: 'Kochi',  text: 'I use it daily for quick health queries. Saves me so many unnecessary clinic visits.',   stars: 5 },
]

export default function Landing() {
  const { loginAsDemo } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  function handleDemo() { loginAsDemo(); navigate('/chat') }

  return (
    <div className="min-h-screen selection:bg-indigo-500 selection:text-white font-sans scroll-smooth transition-colors duration-300">
      {/* Sticky navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 backdrop-blur-md transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-900/80 border-b border-indigo-100/50 dark:border-slate-700/50 shadow-md py-3'
          : 'bg-white/10 dark:bg-slate-900/10 border-b border-indigo-50/10 dark:border-slate-700/10 py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">ArogyaBot 🏥</span>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3">
              Login
            </Link>
            <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 min-h-[44px] inline-flex items-center justify-center rounded-xl transition-all shadow-sm duration-300 hover:scale-105">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-slate-900/95 border-b border-indigo-100 dark:border-slate-800 px-6 py-4 flex flex-col gap-3 transition-colors duration-300 animate-slide-up">
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="w-full min-h-[44px] flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={() => setIsMenuOpen(false)}
              className="w-full min-h-[44px] flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-xl"
            >
              Sign Up
            </Link>
            <button
              onClick={() => { handleDemo(); setIsMenuOpen(false); }}
              className="w-full min-h-[44px] flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl"
            >
              Try Demo
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-indigo-100 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 transition-colors duration-300">
        <div className="absolute -top-10 -left-10 w-96 h-96 bg-indigo-400 dark:bg-indigo-700 rounded-full blur-3xl opacity-40 z-0 animate-blob-float" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-amber-300 dark:bg-amber-700 rounded-full blur-3xl opacity-40 z-0 animate-blob-float animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-300 dark:bg-violet-800 rounded-full blur-3xl opacity-40 z-0 animate-blob-float animation-delay-4000" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-700 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-semibold mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            AI Health Assistant for India
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6 tracking-tight opacity-0 animate-custom-fade-in animate-custom-slide-up [animation-fill-mode:forwards]">
            Your Personal <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">Health Companion</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            ArogyaBot understands your health concerns in English and हिंदी, delivers instant AI-powered guidance — available 24/7, wherever you are.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup" id="hero-signup-btn" className="bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold px-8 py-4 rounded-xl transition-all shadow-lg flex items-center gap-2 hover:scale-105 duration-300">
              Get Started <ChevronRight className="w-5 h-5" />
            </Link>
            <Link to="/login" id="hero-login-btn" className="border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-base font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 duration-300">
              Login
            </Link>
            <button id="hero-demo-btn" onClick={handleDemo} className="inline-flex items-center gap-2 px-6 py-4 text-base font-semibold text-amber-500 hover:text-amber-600 transition-all duration-300 hover:scale-105">
              <Zap className="w-5 h-5 fill-amber-500" /> Try Demo
            </button>
          </div>
          <p className="mt-8 text-slate-500 dark:text-slate-400 text-sm">
            Trusted by <span className="text-indigo-600 dark:text-indigo-400 font-semibold">10,000+</span> users across India
          </p>
        </div>

        {/* Mock chat */}
        <div className="relative z-10 max-w-3xl mx-auto mt-20">
          <FadeIn>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-indigo-100/50 dark:border-slate-700 transition-colors duration-300">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-base">🏥</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">ArogyaBot</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">● Online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-xs">I have a headache and mild fever since yesterday</div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-xs border border-slate-100 dark:border-slate-600">
                    I understand. How high is your temperature? Do you have any other symptoms?
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pl-1 py-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce-dot dot-1" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce-dot dot-2" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce-dot dot-3" />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Everything you need for{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">better health</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto">Built for India, ArogyaBot combines cutting-edge AI with deep health knowledge.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { Icon: MessageCircle, title: 'AI Health Chat', desc: 'Describe your symptoms naturally and get instant AI-powered health guidance.' },
              { Icon: Mic, title: 'Voice Support (Hindi+English)', desc: 'Share your symptoms by speaking in English or Hindi. Accessible and easy to use.' },
              { Icon: Clock, title: '24/7 Availability', desc: 'Get medical information any time of the day or night, from anywhere in India.' },
            ].map(({ Icon, title, desc }, i) => (
              <FadeIn key={title} className={`delay-${(i+1)*100}`}>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-indigo-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center mb-6 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:rotate-6 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-transparent dark:bg-transparent border-t border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">How it works</h2>
              <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto">Get health guidance in three simple steps.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-100 via-amber-100 to-indigo-100 dark:from-indigo-900 dark:via-amber-900 dark:to-indigo-900 -translate-y-12 -z-10" />
            {['Sign up', 'Ask questions', 'Get guidance'].map((step, i) => (
              <FadeIn key={step} className={`delay-${(i+1)*100}`}>
                <div className="text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/50 border-2 border-indigo-500/20 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold mb-6 shadow-sm">{i+1}</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{step}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-xs">
                    {i === 0 && 'Create your free account in just a few clicks to start your journey.'}
                    {i === 1 && 'Describe your symptoms in English or हिंदी via text or voice naturally.'}
                    {i === 2 && 'Receive instant AI-powered health information and actionable advice.'}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Loved by users across India</h2>
              <p className="text-slate-600 dark:text-slate-300">Real experiences from real people</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <FadeIn key={t.name} className={`delay-${(idx+1)*100}`}>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm h-full flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-md transition-all duration-300">
                  <div>
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-transparent dark:bg-transparent border-t border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="bg-gradient-to-br from-indigo-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 p-12 rounded-3xl border border-indigo-100/50 dark:border-slate-700 shadow-lg transition-colors duration-300">
              <span className="inline-block p-4 bg-indigo-600 text-white rounded-2xl mb-6 shadow-md"><HeartPulse className="w-8 h-8" /></span>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Start your health journey today</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-8">Free to use. No credit card required. Available in English & हिंदी.</p>
              <Link to="/signup" id="cta-signup-btn" className="bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold px-10 py-4 rounded-xl transition-all shadow-md inline-flex items-center gap-2 hover:scale-105 duration-300">
                Create Free Account <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-950 dark:bg-slate-950 py-12 px-6 text-center text-slate-300 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <span className="text-lg font-bold text-white block mb-4">ArogyaBot 🏥</span>
          <p className="text-sm text-slate-400 mb-2">© {new Date().getFullYear()} ArogyaBot. All rights reserved.</p>
          <p className="text-xs text-amber-400 font-semibold mb-4">Built by Team AlgoMinds</p>
          <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">Disclaimer: ArogyaBot provides general health information only. It is not a substitute for professional medical advice, diagnosis, or treatment.</p>
        </div>
      </footer>
    </div>
  )
}
