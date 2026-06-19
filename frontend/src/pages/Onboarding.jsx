import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { HeartPulse, ArrowRight, ArrowLeft, User, Activity, CheckCircle, AlertCircle, Sun, Moon, Loader2 } from 'lucide-react'

export default function Onboarding() {
  const { user, updateProfileComplete } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Tell us about yourself
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')

  // Step 2: Your body metrics
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')

  // Step 3: Any health conditions?
  const [selectedConditions, setSelectedConditions] = useState([])
  const [otherConditions, setOtherConditions] = useState('')

  const isDemo = Boolean(user?.isDemo)

  // Pre-fill name from metadata or email
  useEffect(() => {
    if (user) {
      if (user.user_metadata?.name) {
        setName(user.user_metadata.name)
      } else if (user.email) {
        const emailPrefix = user.email.split('@')[0]
        const capitalized = emailPrefix
          .split(/[._-]/)
          .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(' ')
        setName(capitalized)
      }
    }
  }, [user])

  // Calculate BMI and Category
  const getBmiDetails = () => {
    const wVal = parseFloat(weight)
    const hVal = parseFloat(height)
    if (isNaN(wVal) || isNaN(hVal) || hVal <= 0) return null
    const bmi = (wVal / Math.pow(hVal / 100, 2)).toFixed(1)
    let category = 'Normal'
    let color = 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50'
    if (bmi < 18.5) {
      category = 'Underweight'
      color = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50'
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight'
      color = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50'
    } else if (bmi >= 30) {
      category = 'Obese'
      color = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50'
    }
    return { bmi, category, color }
  }

  const handleConditionToggle = (condition) => {
    if (condition === 'None of the above') {
      setSelectedConditions(['None of the above'])
      return
    }

    let updated = selectedConditions.filter(c => c !== 'None of the above')
    if (updated.includes(condition)) {
      updated = updated.filter(c => c !== condition)
    } else {
      updated.push(condition)
    }
    setSelectedConditions(updated)
  }

  const isStepValid = (stepNum) => {
    if (stepNum === 1) {
      if (!name.trim()) return false
      if (!age) return false
      const ageVal = parseInt(age)
      if (isNaN(ageVal) || ageVal < 1 || ageVal > 120) return false
      if (!gender) return false
    } else if (stepNum === 2) {
      if (!height) return false
      const hVal = parseFloat(height)
      if (isNaN(hVal) || hVal < 30 || hVal > 250) return false

      if (!weight) return false
      const wVal = parseFloat(weight)
      if (isNaN(wVal) || wVal < 2 || wVal > 500) return false
    }
    return true
  }

  const validateStep = () => {
    setError('')
    if (step === 1) {
      if (!name.trim()) { setError('Please enter your name.'); return false }
      if (!age) { setError('Please enter your age.'); return false }
      const ageVal = parseInt(age)
      if (isNaN(ageVal) || ageVal < 1 || ageVal > 120) { setError('Please enter a valid age (1-120).'); return false }
      if (!gender) { setError('Please select your gender.'); return false }
    } else if (step === 2) {
      if (!height) { setError('Please enter your height.'); return false }
      const hVal = parseFloat(height)
      if (isNaN(hVal) || hVal < 30 || hVal > 250) { setError('Please enter a valid height in cm (30-250).'); return false }

      if (!weight) { setError('Please enter your weight.'); return false }
      const wVal = parseFloat(weight)
      if (isNaN(wVal) || wVal < 2 || wVal > 500) { setError('Please enter a valid weight in kg (2-500).'); return false }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setError('')
    setStep(prev => prev - 1)
  }

  const getCleanedConditions = () => {
    let condList = [...selectedConditions]
    if (condList.includes('None of the above')) {
      condList = []
    }
    if (otherConditions.trim()) {
      condList.push(otherConditions.trim())
    }
    return condList.join(', ')
  }

  const handleComplete = async (skip = false) => {
    setLoading(true)
    setError('')

    const finalName = name.trim() || 'User'
    const finalAge = skip ? '' : (age ? parseInt(age) : '')
    const finalGender = skip ? '' : gender
    const finalHeight = skip ? '' : (height ? parseFloat(height) : '')
    const finalWeight = skip ? '' : (weight ? parseFloat(weight) : '')
    const finalConditions = skip ? '' : getCleanedConditions()

    const updatedProfile = {
      name: finalName,
      age: finalAge,
      gender: finalGender,
      height: finalHeight,
      weight: finalWeight,
      conditions: finalConditions,
      onboarding_complete: true
    }

    if (isDemo) {
      localStorage.setItem('arogyabot_demo_profile', JSON.stringify(updatedProfile))
      updateProfileComplete(updatedProfile)
      setLoading(false)
      navigate('/dashboard')
      return
    }

    try {
      // 1. Save to Supabase profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: finalName,
          age: finalAge || null,
          gender: finalGender || null,
          height: finalHeight || null,
          weight: finalWeight || null,
          conditions: finalConditions || null,
          onboarding_complete: true
        })

      if (dbError) throw dbError

      // 2. Save all fields to Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: updatedProfile
      })

      if (authError) throw authError

      updateProfileComplete(updatedProfile)
      navigate('/dashboard')
    } catch (err) {
      console.error('Error saving onboarding data:', err)
      setError(err.message || 'Failed to complete setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const bmiDetails = getBmiDetails()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-indigo-100 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-300">
      
      {/* Theme toggle */}
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

      <div className="relative z-10 w-full max-w-lg animate-custom-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 mb-4 shadow-sm">
            <HeartPulse className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome to <span className="bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">ArogyaBot</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Let's set up your health profile in a few quick steps</p>
        </div>

        {/* Onboarding Card */}
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-indigo-50 dark:border-slate-700 transition-colors duration-300">
          
          {/* Progress Bar & Dots */}
          <div className="mb-8">
            <div className="flex justify-between items-center max-w-xs mx-auto relative">
              {/* Connecting line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 transition-all duration-300 -z-10"
                style={{ width: `${(step - 1) * 50}%` }}
              />
              
              {[1, 2, 3].map((num) => {
                const isActive = step === num
                const isCompleted = step > num
                return (
                  <button
                    key={num}
                    disabled={num > step && !isStepValid(step)}
                    onClick={() => {
                      if (num <= step || validateStep()) setStep(num)
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      isCompleted 
                        ? 'bg-indigo-600 text-white'
                        : isActive 
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 scale-110'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4 text-white" /> : num}
                  </button>
                )
              })}
            </div>
            <p className="text-center text-xs text-slate-400 mt-3 font-semibold uppercase tracking-wider">
              Step {step} of 3 — {step === 1 ? 'Personal details' : step === 2 ? 'Body metrics' : 'Health profile'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-600 dark:text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Step Contents */}
          <div className="min-h-[220px]">
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tell us about yourself</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-650 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Age (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-650 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                  <div className="flex gap-3">
                    {['Male', 'Female', 'Other'].map((g) => {
                      const isSelected = gender === g
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border transition-all text-center ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/20'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {g}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Body Metrics */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Your body metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Height (in cm)</label>
                    <input
                      type="number"
                      min="30"
                      max="250"
                      step="0.1"
                      placeholder="e.g. 170"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-650 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Weight (in kg)</label>
                    <input
                      type="number"
                      min="2"
                      max="500"
                      step="0.1"
                      placeholder="e.g. 65"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-650 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                {bmiDetails && (
                  <div className={`p-4 border rounded-xl flex items-center justify-between transition-all duration-300 ${bmiDetails.color} animate-scale-up`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">Your BMI Metric</span>
                      <span className="text-2xl font-black mt-0.5">{bmiDetails.bmi}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold border bg-white/20 dark:bg-black/20">
                      {bmiDetails.category}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Health Conditions */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Any health conditions?</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                    Select all that apply
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'None of the above'].map((condition) => {
                      const isSelected = selectedConditions.includes(condition)
                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => handleConditionToggle(condition)}
                          className={`py-2.5 px-4 rounded-full text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/10'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {condition}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Anything else?</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Thyroid, Gluten allergy, Pregnancy status, etc."
                    value={otherConditions}
                    onChange={(e) => setOtherConditions(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-650 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium resize-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/60">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-5 py-3 border border-slate-250 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 shadow-md shadow-indigo-500/10"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleComplete(true)}
                  className="text-xs text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 font-bold hover:underline py-2"
                >
                  Skip for now
                </button>
                
                <button
                  type="button"
                  onClick={() => handleComplete(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 shadow-md shadow-indigo-500/10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
