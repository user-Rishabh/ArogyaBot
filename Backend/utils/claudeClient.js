const { GoogleGenerativeAI } = require('@google/generative-ai')
const healthData = require('../data/healthData.json')

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash'
})

const buildSystemPrompt = (profile = null) => {
  const diseaseNames = healthData.diseases.map(d => d.name).join(', ')
  const vaccineNames = healthData.vaccines.map(v => v.name).join(', ')

  let profileText = 'You do not have the user\'s profile details yet.'
  if (profile) {
    const wVal = parseFloat(profile.weight)
    const hVal = parseFloat(profile.height)
    let bmiText = ''
    if (!isNaN(wVal) && !isNaN(hVal) && hVal > 0) {
      const bmi = (wVal / Math.pow(hVal / 100, 2)).toFixed(1)
      let category = 'Normal'
      if (bmi < 18.5) category = 'Underweight'
      else if (bmi >= 25 && bmi < 30) category = 'Overweight'
      else if (bmi >= 30) category = 'Obese'
      bmiText = `, BMI: ${bmi} (${category})`
    }

    profileText = `You are a personal health assistant for the following user:
Name: ${profile.name || 'User'}
Age: ${profile.age || 'Not provided'}
Weight: ${profile.weight ? profile.weight + 'kg' : 'Not provided'}
Height: ${profile.height ? profile.height + 'cm' : 'Not provided'}${bmiText}
Gender: ${profile.gender || 'Not provided'}
Existing conditions/allergies: ${profile.conditions || 'None'}`
  }

  return `You are ArogyaBot, a personal health assistant for rural and semi-urban India.

${profileText}

Your knowledge includes information about these diseases: ${diseaseNames}
And these vaccines: ${vaccineNames}

RULES:
1. Only answer health-related questions (symptoms, diseases, prevention, vaccines).
2. If asked anything unrelated to health, say: "I can only help with health-related questions."
3. Always end serious symptom answers with: "Please consult a doctor for proper diagnosis."
4. Keep answers under 150 words — simple and clear.
5. Respond in the SAME language as the user (Hindi or English).
6. Never diagnose — only provide general awareness information.
7. Be warm and supportive in tone.
8. Always consider their age, weight, and BMI when giving advice.
9. Give personalized remedies based on their profile.`
}

const getChatResponse = async (userMessage, chatHistory = [], profile = null) => {
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
            { role: 'system', content: buildSystemPrompt(profile) },
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
${buildSystemPrompt(profile)}

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
`

  const result = await model.generateContent(prompt)
  return result.response.text()
}
const getDietPlan = async (prompt) => {
  const dietPrompt = `
You are an expert Indian nutritionist.

Generate a personalized diet plan.

IMPORTANT:
Respond ONLY with valid JSON.

${prompt}
`

  const result = await model.generateContent(dietPrompt)
  return result.response.text()
}

module.exports = {
  getChatResponse,
  getDietPlan
}