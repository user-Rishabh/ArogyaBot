import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HeartPulse, MessageCircle, Brain, ShieldCheck,
  Globe2, Mic, Zap, ChevronRight, Star
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Diagnosis',
    desc:  'Advanced symptom analysis using state-of-the-art language models trained on medical literature.',
  },
  {
    icon: Globe2,
    title: 'Multilingual Support',
    desc:  'Speak in English or हिंदी. ArogyaBot understands and responds in your preferred language.',
  },
  {
    icon: Mic,
    title: 'Voice Enabled',
    desc:  'Describe your symptoms naturally using your voice — no typing required.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & Secure',
    desc:  'Your health data is encrypted end-to-end and never shared with third parties.',
  },
  {
    icon: Zap,
    title: 'Instant Responses',
    desc:  'Get health insights in seconds, available 24/7 from anywhere in India.',
  },
  {
    icon: MessageCircle,
    title: 'Conversational Memory',
    desc:  'ArogyaBot remembers context within your session for more precise recommendations.',
  },
]

const testimonials = [
  { name: 'Priya Sharma',  role: 'Mumbai',  text: 'ArogyaBot helped me understand my symptoms before my doctor visit. Incredibly helpful!',     stars: 5 },
  { name: 'Rahul Verma',   role: 'Delhi',   text: 'The Hindi support is excellent. Finally a health AI that speaks my language.',                stars: 5 },
  { name: 'Anita Pillai',  role: 'Kochi',   text: 'I use it daily for quick health queries. Saves me so many unnecessary clinic visits.',         stars: 5 },
]

export default function Landing() {
  const { loginAsDemo } = useAuth()
  const navigate = useNavigate()

  function handleDemo() {
    loginAsDemo()
    navigate('/chat')
  }
  return (
    <div className="min-h-screen hero-gradient">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-surface-900/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-teal-400" />
            <span className="text-lg font-bold text-white">Arogya<span className="text-teal-400">Bot</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"  className="btn-ghost text-sm">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm px-5 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-full text-teal-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            AI Health Assistant for India
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Your Personal{' '}
            <span className="gradient-text">Health Companion</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            ArogyaBot understands your health concerns in English and हिंदी, delivers 
            instant AI-powered guidance — available 24/7, wherever you are.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signup"
              id="hero-signup-btn"
              className="btn-primary text-base px-8 py-4 shadow-2xl shadow-teal-500/20"
            >
              Start for Free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              id="hero-login-btn"
              className="btn-secondary text-base px-8 py-4"
            >
              Sign In
            </Link>
            <button
              id="hero-demo-btn"
              onClick={handleDemo}
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-amber-300 hover:text-amber-200 transition-colors"
            >
              <Zap className="w-5 h-5" />
              Try Demo
            </button>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-slate-500 text-sm">
            Trusted by <span className="text-teal-400 font-semibold">10,000+</span> users across India
          </p>
        </div>

        {/* Hero visual */}
        <div className="max-w-3xl mx-auto mt-20 animate-slide-up">
          <div className="glass-card p-6 shadow-2xl shadow-black/40">
            {/* Mock chat preview */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">ArogyaBot</p>
                <p className="text-xs text-teal-400">● Online</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="bg-teal-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-xs">
                  I have a headache and mild fever since yesterday
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-surface-800 text-slate-200 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-xs border border-white/5">
                  I understand. A headache with mild fever can be caused by several conditions. 
                  How high is your temperature? Do you have any other symptoms?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-teal-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-xs">
                  Around 99.5°F, also feeling a bit tired
                </div>
              </div>
              <div className="flex items-center gap-1.5 pl-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce-dot dot-1" />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce-dot dot-2" />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce-dot dot-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need for{' '}
              <span className="gradient-text">better health</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built for India, ArogyaBot combines cutting-edge AI with deep health knowledge.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="card p-6 hover:border-teal-500/30 hover:bg-surface-800/80 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors">
                  <f.icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Loved by users across India</h2>
            <p className="text-slate-400">Real experiences from real people</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-12 bg-gradient-to-br from-teal-900/30 to-surface-800/50 border-teal-500/20">
            <HeartPulse className="w-12 h-12 text-teal-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Start your health journey today
            </h2>
            <p className="text-slate-400 mb-8">
              Free to use. No credit card required. Available in English & हिंदी.
            </p>
            <Link to="/signup" className="btn-primary text-base px-10 py-4" id="cta-signup-btn">
              Create Free Account
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HeartPulse className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-semibold text-white">Arogya<span className="text-teal-400">Bot</span></span>
        </div>
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} ArogyaBot. For informational purposes only. Not a substitute for professional medical advice.
        </p>
      </footer>
    </div>
  )
}
