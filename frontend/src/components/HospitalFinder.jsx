import { useState } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'

export default function HospitalFinder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [city, setCity] = useState('')

  const findNearbyHospitals = () => {
    setError('')
    setLoading(true)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLoading(false)
        window.open(
          `https://www.google.com/maps/search/hospitals+near+me/@${latitude},${longitude},14z`,
          '_blank'
        )
      },
      (err) => {
        console.error('Geolocation error:', err)
        setLoading(false)
        if (err.code === 1) {
          setError('Please allow location access and try again.')
        } else {
          setError('Failed to get your location. Please use the manual search below.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleCitySubmit = (e) => {
    e.preventDefault()
    if (!city.trim()) return
    window.open(
      `https://www.google.com/maps/search/hospitals+in+${encodeURIComponent(city.trim())}`,
      '_blank'
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md shadow-rose-500/20">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hospital Finder</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Locate nearby medical centers using your device location or search by city.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Geolocation Button */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl text-center">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 border border-indigo-100/20">
            <MapPin className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Use Device Location</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mb-5 leading-relaxed">
            Find the closest hospitals, clinics, and emergency rooms directly on Google Maps.
          </p>

          <button
            onClick={findNearbyHospitals}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-md transition-all duration-200 active:scale-98 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Getting your location...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Find Nearby Hospitals
              </>
            )}
          </button>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-xs font-semibold mt-4 animate-fade-in">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* Manual City Search Fallback */}
        <div className="p-6 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col justify-center">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Manual City Search
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
            Not sharing location? Enter your city or region name below to find hospitals manually.
          </p>

          <form onSubmit={handleCitySubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="e.g. New Delhi, Mumbai, Lucknow"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!city.trim()}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-all duration-200 active:scale-98 text-sm"
            >
              Search Hospitals
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
