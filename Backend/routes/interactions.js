const express = require('express')
const router = express.Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash'
})

router.post('/', async (req, res) => {
  const { medicines } = req.body

  if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({ error: 'Medicines list is required' })
  }

  try {
    const medicinesListStr = medicines.join(', ')

    const systemPrompt = `You are an expert clinical pharmacist and pharmacology AI assistant.
Given a list of medicines, perform a comprehensive clinical check.
Your response MUST be a valid JSON object matching the schema below.
Ensure the analysis is specific, evidence-based, and practical.
Do not include any markdown formatting like \`\`\`json or \`\`\`, just return the raw JSON text.

JSON Schema:
{
  "severity": "High" | "Moderate" | "Minimal",
  "summary": "Overall summary of the safety check. Focus on the main risks if any, or general reassurance.",
  "interactions": [
    {
      "drugs": "Drug Name A + Drug Name B",
      "severity": "High" | "Moderate" | "Minor",
      "description": "Explain what interaction occurs and why, including clinical effects."
    }
  ],
  "sideEffects": [
    {
      "drug": "Drug Name",
      "effects": ["Common or serious side effect 1", "Common or serious side effect 2"]
    }
  ],
  "timingRecommendations": [
    {
      "drug": "Drug Name",
      "recommendation": "Recommendation (e.g. Take in the morning with food. Avoid taking with other medications.)",
      "bestTime": "Morning" | "Afternoon" | "Evening" | "Night" | "Flexible"
    }
  ],
  "foodRestrictions": [
    {
      "drug": "Drug Name",
      "restrictions": ["Food/Drink to avoid (e.g. Avoid alcohol, avoid dairy products within 2 hours, etc.)"]
    }
  ]
}

If only one medicine is provided, the "interactions" list should be empty, and "severity" should be "Minimal", but still provide sideEffects, timingRecommendations, and foodRestrictions for that medicine.`

    const promptText = `${systemPrompt}\n\nList of medicines to check:\n${medicinesListStr}`

    const result = await model.generateContent(promptText)
    const responseText = result.response.text().trim()

    // Clean up potential markdown formatting in case the model adds it
    let cleanJsonStr = responseText
    if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```(json)?\n/, '').replace(/\n```$/, '')
    }

    const parsedData = JSON.parse(cleanJsonStr)
    res.json(parsedData)
  } catch (error) {
    console.error('Interactions check error:', error)
    res.status(500).json({ error: 'Failed to analyze medicine interactions. Please try again.' })
  }
})

module.exports = router
