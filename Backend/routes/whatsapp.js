const express = require('express')
const router = express.Router()
const twilio = require('twilio')
const { getChatResponse } = require('../utils/claudeClient')

// POST /api/whatsapp (Twilio webhook)
router.post('/', async (req, res) => {
  const incomingMessage = req.body.Body // User's WhatsApp message
  const from = req.body.From // User's phone number

  console.log(`WhatsApp message from ${from}: ${incomingMessage}`)

  try {
    // Get Claude response (no history for WhatsApp — stateless for now)
    const botResponse = await getChatResponse(incomingMessage, [])

    const twiml = new twilio.twiml.MessagingResponse()
    twiml.message(botResponse)

    res.type('text/xml')
    res.send(twiml.toString())
  } catch (error) {
    console.error('WhatsApp error:', error)
    const twiml = new twilio.twiml.MessagingResponse()
    twiml.message('Sorry, I could not process your request. Please try again.')
    res.type('text/xml')
    res.send(twiml.toString())
  }
})

module.exports = router