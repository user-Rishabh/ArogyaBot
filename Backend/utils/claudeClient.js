
const { GoogleGenerativeAI } = require('@google/generative-ai')
const healthData = require('../data/healthData.json')
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash'
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

const result = await model.generateContent(prompt)

return result.response.text()
}

module.exports = { getChatResponse }