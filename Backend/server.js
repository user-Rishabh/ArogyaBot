const whatsappRoutes = require('./routes/whatsapp')
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const chatRoutes = require('./routes/chat')

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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/chat', chatRoutes)
app.use('/api/whatsapp', whatsappRoutes) 

app.get('/api/health', (req, res) => {
  res.json({ status: 'ArogyaBot backend is running!' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})