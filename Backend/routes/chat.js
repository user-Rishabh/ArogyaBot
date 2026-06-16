const express = require('express')
const router = express.Router()
const { getChatResponse } = require('../utils/claudeClient')
const supabase = require('../lib/supabase')

// POST /api/chat
router.post('/', async (req, res) => {
  const { message, sessionId, language = 'en', chatHistory = [] } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  try {
    const botResponse = await getChatResponse(message, chatHistory)

    if (sessionId) {
      const { error: messageError } = await supabase.from('messages').insert([
        { session_id: sessionId, role: 'user', content: message, language },
        { session_id: sessionId, role: 'assistant', content: botResponse, language }
      ])
      if (messageError) console.error('Message save error:', messageError)
    }

    res.json({ response: botResponse })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to get response. Please try again.' })
  }
})

// POST /api/chat/session
router.post('/session', async (req, res) => {
  const { userId, firstMessage } = req.body

  if (!userId) return res.status(400).json({ error: 'User ID is required' })
  if (!firstMessage) return res.status(400).json({ error: 'First message is required' })

  try {
    const title = firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage

    console.log('Creating session for userId:', userId)

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ user_id: userId, title }])
      .select('id, title')

    console.log('Session data:', data)
    console.log('Session error:', error)

    if (error) throw error

    res.json({ sessionId: data[0].id, title: data[0].title })
  } catch (error) {
    console.error('Session error:', JSON.stringify(error))
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// GET /api/chat/history/:userId
router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params

  if (!userId) return res.status(400).json({ error: 'User ID is required' })

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ sessions: data || [] })
  } catch (error) {
    console.error('History error:', error)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

module.exports = router