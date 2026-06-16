const express = require('express')
const router = express.Router()
const { getChatResponse } = require('../utils/claudeClient')
const supabase = require('../lib/supabase')

// POST /api/chat
// Body: { message, sessionId, language, chatHistory }
router.post('/', async (req, res) => {
  const { message, sessionId, language = 'en', chatHistory = [] } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  try {
    const botResponse = await getChatResponse(message, chatHistory)

    if (sessionId) {
      await supabase.from('messages').insert([
        {
          session_id: sessionId,
          role: 'user',
          content: message,
          language: language
        },
        {
          session_id: sessionId,
          role: 'assistant',
          content: botResponse,
          language: language
        }
      ])
    }

    res.json({ response: botResponse, reply: botResponse })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to get response. Please try again.' })
  }
})

// POST /api/chat/session
// Create a new chat session
router.post('/session', async (req, res) => {
  const { userId, firstMessage } = req.body

  try {
    const title = firstMessage.substring(0, 50) + '...'

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title })
      .select()
      .single()

    if (error) throw error

    res.json({ sessionId: data.id, title: data.title })
  } catch (error) {
    console.error('Session error:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// GET /api/chat/history/:userId
router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, messages(content, role, created_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ sessions: data })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

module.exports = router