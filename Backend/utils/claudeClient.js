
const { GoogleGenerativeAI } = require('@google/generative-ai')
const healthData = require('../data/healthData.json')
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

const modelName = 'gemini-3.5-flash'
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-8b'
})
// Build system prompt with health data context
const buildSystemPrompt = () => {
  const diseaseNames = healthData.diseases.map(d => d.name).join(', ')
  const vaccineNames = healthData.vaccines.map(v => v.name).join(', ')

  return `You are ArogyaBot, a public health awareness assistant for rural and semi-urban India.

Your knowledge includes information about these diseases: ${diseaseNames}
And these vaccines: ${vaccineNames}

RULES:
1. Only answer health-related questions (symptoms, diseases, prevention, vaccines).
2. If asked anything unrelated to health, say: "I can only help with health-related questions."
3. Always end serious symptom answers with: "Please consult a doctor for proper diagnosis."
4. Keep answers under 150 words — simple and clear.
5. Respond in the SAME language as the user (Hindi or English).
6. Never diagnose — only provide general awareness information.
7. Be warm and supportive in tone.`
}

// Main function to call Claude
const getChatResponse = async (userMessage, chatHistory = []) => {
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free'
    console.log(`Attempting backend OpenRouter generation with model: ${model}`)
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...chatHistory.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            { role: 'user', content: userMessage }
          ]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const text = data?.choices?.[0]?.message?.content
        if (text) {
          console.log(`Backend OpenRouter success with model: ${model}`)
          return text
        }
      } else {
        const errText = await response.text()
        console.warn(`Backend OpenRouter API error response: ${response.status} ${errText}`)
      }
    } catch (err) {
      console.warn('Backend OpenRouter generation failed, falling back to Gemini:', err.message)
    }
  }

  const messages = chatHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  }))

  messages.push({
    role: 'user',
    content: userMessage
  })

  const prompt = `
${buildSystemPrompt()}

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
`

  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite'
  ]

  let lastError = null

  for (const currentModelName of modelsToTry) {
    try {
      console.log(`Attempting generation with model: ${currentModelName}`)
      const currentModel = genAI.getGenerativeModel({ model: currentModelName })
      const result = await currentModel.generateContent(prompt)
      const text = result.response.text()
      if (text) {
        console.log(`Successfully generated content using: ${currentModelName}`)
        return text
      }
    } catch (err) {
      console.warn(`Model ${currentModelName} failed:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('All Gemini model fallbacks failed')
}

module.exports = { getChatResponse, modelName }