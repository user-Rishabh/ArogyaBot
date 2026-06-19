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
    let profile = null
    if (sessionId) {
      try {
        const { data: sessionData } = await supabase
          .from('chat_sessions')
          .select('user_id')
          .eq('id', sessionId)
          .maybeSingle()

        if (sessionData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionData.user_id)
            .maybeSingle()

          let meta = {}
          try {
            const { data: { user: authUser } } = await supabase.auth.admin.getUser(sessionData.user_id)
            meta = authUser?.user_metadata || {}
          } catch (authErr) {
            console.error('Error fetching auth user in backend:', authErr)
          }

          profile = {
            name: profileData?.name || meta.name || '',
            age: profileData?.age || meta.age || '',
            weight: meta.weight || '',
            height: meta.height || '',
            gender: meta.gender || '',
            conditions: meta.conditions || ''
          }
        }
      } catch (err) {
        console.error('Error loading session user profile in backend:', err)
      }
    }

    const botResponse = await getChatResponse(message, chatHistory, profile, language)

    if (sessionId) {
      try {
        const { error: dbError } = await supabase.from('messages').insert([
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
        if (dbError) {
          console.error('Database message insert error:', dbError)
        }
      } catch (dbErr) {
        console.error('Database message insert exception:', dbErr)
      }
    }


    res.json({ response: botResponse, reply: botResponse })
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
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...' 
      : firstMessage

    // Step 1: Insert without select
    const { error: insertError } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: title })

    if (insertError) throw insertError

    // Step 2: Fetch the newly created session separately
    const { data, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('id, title')
      .eq('user_id', userId)
      .eq('title', title)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError) throw fetchError

    res.json({ sessionId: data.id, title: data.title })
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