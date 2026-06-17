const express = require('express')
const router = express.Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash'
})

router.post('/', async (req, res) => {
  const { symptoms, system = 'Allopathy', age } = req.body

  if (!symptoms) {
    return res.status(400).json({ error: 'Symptoms description is required' })
  }
  if (!age) {
    return res.status(400).json({ error: 'User age is required' })
  }

  try {
    const systemPrompt = `You are an expert medical consultant, wellness advisor, and pharmacist AI assistant.
Given the user's symptoms, age, and preferred system of medicine (Ayurvedic, Allopathy, or Homeopathy), perform a safe clinical evaluation and suggest remedies.
Your response MUST be a valid JSON object matching the schema below.
Provide realistic, common suggestions suitable for the user's age.
Always include appropriate safety disclaimers, especially for children (under 12) or elderly users.
Do not include any markdown formatting like \`\`\`json or \`\`\`, just return the raw JSON text.

JSON Schema:
{
  "system": "Ayurvedic" | "Allopathy" | "Homeopathy",
  "ageGroup": "Pediatric" | "Adult" | "Geriatric",
  "summary": "Overall guidance for these symptoms in this age group under the chosen system.",
  "suggestions": [
    {
      "medicine": "Medicine/Remedy Name",
      "purpose": "What this medicine helps with in relation to the symptoms.",
      "dosage": "Typical dosage instructions tailored specifically to their age (e.g. For a 5-year-old: 2.5ml syrup... or For a 30-year-old: 1 tablet...).",
      "timing": "E.g., Take twice daily, in morning and evening after food."
    }
  ],
  "warnings": [
    "Safety warning or precaution (e.g., Avoid if you have high blood pressure, consult doctor immediately if symptoms worsen, etc.)"
  ]
}`

    const promptText = `${systemPrompt}\n\nUser Input Details:\nSymptoms: ${symptoms}\nPreferred System: ${system}\nUser Age: ${age}`

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
    console.error('Suggestions generator error:', error)
    res.status(500).json({ error: 'Failed to generate medicine suggestions. Please try again.' })
  }
})

module.exports = router
