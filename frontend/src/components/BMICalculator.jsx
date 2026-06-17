import { useState } from 'react'
import { Scale, Info, Sparkles, Dumbbell, Heart, Activity, Timer } from 'lucide-react'

export default function BMICalculator() {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [bmi, setBmi] = useState(null)
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')

  const calculateBmi = (e) => {
    e.preventDefault()
    setError('')
    setBmi(null)

    const hVal = parseFloat(height)
    const wVal = parseFloat(weight)

    if (isNaN(hVal) || hVal <= 0) {
      setError('Please enter a valid height.')
      return
    }
    if (isNaN(wVal) || wVal <= 0) {
      setError('Please enter a valid weight.')
      return
    }

    const heightInMeters = hVal / 100
    const bmiVal = wVal / (heightInMeters * heightInMeters)
    const roundedBmi = parseFloat(bmiVal.toFixed(1))

    // To restart the stagger animation on calculate click, we trigger state change
    setTimeout(() => {
      setBmi(roundedBmi)
      if (roundedBmi < 18.5) {
        setCategory('Underweight')
      } else if (roundedBmi >= 18.5 && roundedBmi < 25) {
        setCategory('Normal')
      } else if (roundedBmi >= 25 && roundedBmi < 30) {
        setCategory('Overweight')
      } else {
        setCategory('Obese')
      }
    }, 50)
  }

  const getPercent = (val) => {
    const min = 15
    const max = 35
    const percent = ((val - min) / (max - min)) * 100
    return Math.max(0, Math.min(100, percent))
  }

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Underweight':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40'
      case 'Normal':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/40'
      case 'Overweight':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
      case 'Obese':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40'
      default:
        return ''
    }
  }

  const getCategoryTip = (cat) => {
    switch (cat) {
      case 'Underweight':
        return 'Focus on nutrient-dense foods, lean protein, and healthy fats. Consider strength training to build muscle mass safely.'
      case 'Normal':
        return 'Great job! Maintain a balanced diet, stay active with 150 minutes of moderate exercise weekly, and get regular checkups.'
      case 'Overweight':
        return 'Incorporate more whole foods, vegetables, and daily physical activity. Small, consistent lifestyle adjustments can make a big difference.'
      case 'Obese':
        return 'Prioritize portion control, daily movement, and balanced nutrition. We highly recommend consulting a healthcare provider or a nutritionist for a tailored plan.'
      default:
        return ''
    }
  }

  const getExerciseRecommendation = (cat) => {
    switch (cat) {
      case 'Underweight':
        return [
          { icon: Dumbbell, text: 'Strength training 3x/week' },
          { icon: Heart, text: 'Protein-rich diet' },
          { icon: Activity, text: 'Yoga and stretching' }
        ]
      case 'Normal':
        return [
          { icon: Timer, text: '150 min moderate cardio/week' },
          { icon: Heart, text: 'Maintain balanced diet' }
        ]
      case 'Overweight':
        return [
          { icon: Timer, text: '30 min walking daily' },
          { icon: Heart, text: 'Reduce processed food' },
          { icon: Activity, text: 'Swimming or cycling' }
        ]
      case 'Obese':
        return [
          { icon: Activity, text: 'Low-impact exercise (walking, cycling)' },
          { icon: Heart, text: 'Consult doctor before starting' }
        ]
      default:
        return []
    }
  }

  const getDailyHealthTips = (cat) => {
    switch (cat) {
      case 'Underweight':
        return [
          { emoji: '🥜', text: 'Eat healthy snacks (nuts, seeds) between meals' },
          { emoji: '💧', text: 'Avoid drinking water right before meals' },
          { emoji: '🍌', text: 'Incorporate energy-dense fruits like bananas' }
        ]
      case 'Normal':
        return [
          { emoji: '🥗', text: 'Eat a rainbow of vegetables and fruits daily' },
          { emoji: '😴', text: 'Get 7-8 hours of quality sleep for recovery' },
          { emoji: '🏃', text: 'Stay consistent with daily steps and breaks' }
        ]
      case 'Overweight':
        return [
          { emoji: '🥗', text: 'Eat veggies/salad before your main courses' },
          { emoji: '🥤', text: 'Swap sugary drinks and juices for infused water' },
          { emoji: '🚶', text: 'Take a 10-15 minute walk after each meal' }
        ]
      case 'Obese':
        return [
          { emoji: '💧', text: 'Drink plenty of water to support metabolism' },
          { emoji: '🥗', text: 'Start with small, sustainable dietary changes' },
          { emoji: '⏱️', text: 'Track your steps and aim for gradual progress' }
        ]
      default:
        return []
    }
  }

  const exerciseRecs = getExerciseRecommendation(category)
  const healthTips = getDailyHealthTips(category)

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">BMI Calculator</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Calculate your Body Mass Index (BMI) to understand your weight category.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Form */}
        <form onSubmit={calculateBmi} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Height (in cm)
            </label>
            <input
              type="number"
              min="1"
              max="300"
              placeholder="e.g. 175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Weight (in kg)
            </label>
            <input
              type="number"
              min="1"
              max="500"
              placeholder="e.g. 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 active:scale-98"
          >
            Calculate BMI
          </button>
        </form>

        {/* Results Screen */}
        <div className="flex flex-col justify-center">
          {bmi !== null ? (
            <div className="space-y-6 animate-custom-fade-in">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your BMI Score</span>
                  <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{bmi}</div>
                </div>
                <div className={`px-4 py-2 border rounded-full text-sm font-bold capitalize ${getCategoryColor(category)}`}>
                  {category}
                </div>
              </div>

              {/* BMI Scale Bar with Indicator */}
              <div className="pt-4 pb-2">
                <div className="relative mb-2">
                  {/* Indicator Pointer */}
                  <div
                    className="absolute -top-3.5 -translate-x-1/2 flex flex-col items-center transition-all duration-500 ease-out"
                    style={{ left: `${getPercent(bmi)}%` }}
                  >
                    <div className="w-0.5 h-3.5 bg-slate-700 dark:bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700 dark:bg-slate-300 -mt-1" />
                  </div>

                  {/* Multi-segment Scale Bar */}
                  <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                    <div className="h-full bg-blue-400/80" style={{ width: '17.5%' }} title="Underweight (<18.5)" />
                    <div className="h-full bg-green-400/80" style={{ width: '32.5%' }} title="Normal (18.5-25)" />
                    <div className="h-full bg-amber-400/80" style={{ width: '25.0%' }} title="Overweight (25-30)" />
                    <div className="h-full bg-red-400/80" style={{ width: '25.0%' }} title="Obese (>=30)" />
                  </div>
                </div>

                {/* Scale Ticks */}
                <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 px-0.5">
                  <span>15.0</span>
                  <span style={{ marginRight: '10%' }}>18.5</span>
                  <span style={{ marginRight: '5%' }}>25.0</span>
                  <span style={{ marginRight: '10%' }}>30.0</span>
                  <span>35.0+</span>
                </div>
              </div>

              {/* Health suggestion block */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-3">
                <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Health Suggestion</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                    {getCategoryTip(category)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center">
              <Info className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[240px] leading-relaxed">
                Enter your height and weight, then click **Calculate BMI** to view results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analytical Cards Section */}
      {bmi !== null && (
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: What is BMI? */}
          <div
            className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm animate-custom-slide-up opacity-0"
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">What is BMI?</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Body Mass Index (BMI) measures body fat based on weight and height, helping evaluate healthy weight ranges.
            </p>
            <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-lg text-[11px]">
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-950/10 border-l-2 border-blue-400">
                    <td className="px-2.5 py-1.5 font-semibold text-blue-700 dark:text-blue-400">&lt; 18.5</td>
                    <td className="px-2.5 py-1.5 text-blue-600 dark:text-blue-400">Underweight</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-green-50/40 dark:bg-green-950/10 border-l-2 border-green-400">
                    <td className="px-2.5 py-1.5 font-semibold text-green-700 dark:text-green-400">18.5 - 24.9</td>
                    <td className="px-2.5 py-1.5 text-green-600 dark:text-green-400">Normal</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/10 border-l-2 border-amber-400">
                    <td className="px-2.5 py-1.5 font-semibold text-amber-700 dark:text-amber-400">25.0 - 29.9</td>
                    <td className="px-2.5 py-1.5 text-amber-600 dark:text-amber-400">Overweight</td>
                  </tr>
                  <tr className="bg-red-50/40 dark:bg-red-950/10 border-l-2 border-red-400">
                    <td className="px-2.5 py-1.5 font-semibold text-red-700 dark:text-red-400">30.0+</td>
                    <td className="px-2.5 py-1.5 text-red-600 dark:text-red-400">Obese</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Recommended Exercise */}
          <div
            className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm animate-custom-slide-up opacity-0"
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recommended Exercise</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Exercises tailored to support healthy progress for the **{category}** category:
            </p>
            <ul className="space-y-2.5">
              {exerciseRecs.map((rec, idx) => {
                const Icon = rec.icon
                return (
                  <li key={idx} className="flex items-center gap-2.5 text-xs text-black dark:text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0 border border-indigo-100/30 dark:border-indigo-900/30">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium">{rec.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Card 3: Daily Health Tips */}
          <div
            className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm animate-custom-slide-up opacity-0"
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Daily Health Tips</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              General guidelines for optimal metabolic balance:
            </p>
            <div className="flex flex-col gap-2.5">
              {healthTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 bg-white dark:bg-surface-850 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 animate-custom-slide-up opacity-0"
                  style={{ animationDelay: `${300 + idx * 100}ms` }}
                >
                  <span className="text-sm shrink-0" role="img" aria-label="Tip Icon">{tip.emoji}</span>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
                    {tip.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
