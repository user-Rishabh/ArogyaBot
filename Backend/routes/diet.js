const express = require('express')
const router = express.Router()
const { getChatResponse } = require('../utils/claudeClient')


router.post('/generate', async (req, res) => {
  try {
    const { age, weight, height, goal, dietType } = req.body

    const bmi = (weight / ((height / 100) * (height / 100))).toFixed(1)

    const prompt = `Generate a personalized Indian diet plan for:
- Age: ${age} years
- Weight: ${weight} kg
- Height: ${height} cm
- BMI: ${bmi}
- Goal: ${goal}
- Diet Type: ${dietType || 'Vegetarian'}

Respond in JSON format only (no markdown):
{
  "breakfast": "meal description",
  "midMorning": "snack description", 
  "lunch": "meal description",
  "eveningSnack": "snack description",
  "dinner": "meal description",
  "calories": number,
  "protein": "Xg",
  "carbs": "Xg",
  "fat": "Xg",
  "waterIntake": "X Litres",
  "bmi": "${bmi}"
}`

    const response = await getChatResponse(prompt, [])
    console.log(response)
    // Parse JSON from response
    const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const dietPlan = JSON.parse(cleanResponse)
    
    res.json(dietPlan)
  } catch (error) {
    console.error('Diet error:', error)
    res.status(500).json({ error: 'Failed to generate diet plan' })
  }
})

module.exports = router