require('dotenv').config()
const express = require('express')
const cors = require('cors')

const chatRoutes = require('./routes/chat')
const whatsappRoutes = require('./routes/whatsapp')
const dietRoutes = require('./routes/diet')
const suggestionsRoutes = require('./routes/suggestions')
const reportAnalyzerRoutes = require('./routes/reportAnalyzer')

const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://arogya-bot-sooty.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
app.options(/.*/, cors())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

app.use('/api/chat', chatRoutes)
app.use('/api/whatsapp', whatsappRoutes)
app.use('/api/diet', dietRoutes)
app.use('/api/suggest-medicines', suggestionsRoutes)
app.use('/api/report-analyzer', reportAnalyzerRoutes)

app.get('/api/health', (req, res) => {
  const hasGoogleApiKey = !!process.env.GOOGLE_API_KEY
  const hasOpenRouterApiKey = !!(process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY)
  const hasOpenRouterModel = !!(
    process.env.OPENROUTER_VISION_MODEL ||
    process.env.VITE_OPENROUTER_VISION_MODEL ||
    process.env.OPENROUTER_MODEL ||
    process.env.VITE_OPENROUTER_MODEL
  )

  res.json({
    status: 'ArogyaBot backend is running!',
    hasApiKey: hasGoogleApiKey,
    reportAnalyzerConfigured: hasGoogleApiKey || (hasOpenRouterApiKey && hasOpenRouterModel)
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
