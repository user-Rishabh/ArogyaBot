const express = require('express')
const router = express.Router()

router.post('/generate', async (req, res) => {
  try {
    const { age, weight, height, goal, dietType } = req.body

    const bmi = (
      weight /
      ((height / 100) * (height / 100))
    ).toFixed(1)

    let calories = 2000

    if (goal === 'Weight Loss') calories = 1800
    if (goal === 'Weight Gain') calories = 2500

    res.json({
      breakfast: 'Oats with fruits and milk',
      lunch: 'Rice, dal, vegetables and salad',
      snacks: 'Fruit bowl and nuts',
      dinner: 'Chapati with vegetables and curd',
      calories,
      bmi,
      waterIntake: '3 Litres',
      protein: '80g',
      carbs: '220g',
      fat: '60g'
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      error: 'Failed to generate diet plan'
    })
  }
})

module.exports = router