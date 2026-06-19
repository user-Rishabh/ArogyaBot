const { GoogleGenerativeAI } = require('@google/generative-ai')
const healthData = require('../data/healthData.json')

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash'
})

const generateOpeningMessage = (profile, language = 'en') => {
  const lang = (language || 'en').toLowerCase()
  const name = (profile && profile.name) ? profile.name : (lang === 'hi' ? 'उपयोगकर्ता' : 'User')
  
  // Time-based greeting
  const hr = new Date().getHours()
  let greeting = ''
  if (lang === 'hi') {
    if (hr < 12) greeting = 'शुभ प्रभात'
    else if (hr < 17) greeting = 'नमस्कार'
    else greeting = 'शुभ संध्या'
  } else {
    if (hr < 12) greeting = 'Good morning'
    else if (hr < 17) greeting = 'Good afternoon'
    else greeting = 'Good evening'
  }

  const age = profile && profile.age ? parseFloat(profile.age) : NaN
  const weight = profile && profile.weight ? parseFloat(profile.weight) : NaN
  const height = profile && profile.height ? parseFloat(profile.height) : NaN

  const hasProfileData = !isNaN(age) && !isNaN(weight) && !isNaN(height) && height > 0

  let healthProfileSection = ''

  if (hasProfileData) {
    const calculatedBmi = (weight / Math.pow(height / 100, 2)).toFixed(1)
    const bmiVal = parseFloat(calculatedBmi)
    
    let bmiCategory = ''
    let insight = ''

    if (lang === 'hi') {
      if (bmiVal < 18.5) {
        bmiCategory = 'अंडरवेट (कम वजन)'
        insight = 'सुझाव: आपके बीएमआई (BMI) के आधार पर, स्वस्थ मांसपेशियां बनाने में मदद के लिए प्रोटीन युक्त आहार लेने की सलाह दी जाती है।'
      } else if (bmiVal >= 18.5 && bmiVal < 25) {
        bmiCategory = 'नॉर्मल (सामान्य)'
        insight = 'सुझाव: आपके बीएमआई (BMI) के आधार पर, आपका वजन स्वस्थ सीमा में है! इसे बनाए रखने के लिए संतुलित आहार और स्वस्थ जीवनशैली जारी रखें।'
      } else if (bmiVal >= 25 && bmiVal < 30) {
        bmiCategory = 'ओवरवेट (अधिक वजन)'
        insight = 'सुझाव: आपके बीएमआई (BMI) के आधार पर, अपनी दैनिक दिनचर्या में हल्का व्यायाम (जैसे 30 मिनट की तेज़ सैर) शामिल करने की सलाह दी जाती है।'
      } else {
        bmiCategory = 'ओबीस (मोटापा)'
        insight = 'सुझाव: आपके बीएमआई (BMI) के आधार पर, अपनी दैनिक दिनचर्या में हल्का व्यायाम (जैसे 30 मिनट की तेज़ सैर) शामिल करने की सलाह दी जाती है।'
      }

      const conditions = (profile.conditions && profile.conditions.trim()) ? profile.conditions : 'कोई रिपोर्ट नहीं की गई'

      healthProfileSection = `📋 आपका स्वास्थ्य प्रोफ़ाइल:
- उम्र: ${profile.age} वर्ष
- वजन: ${profile.weight} kg
- ऊंचाई: ${profile.height} cm
- बीएमआई (BMI): ${calculatedBmi} (${bmiCategory})
- स्वास्थ्य स्थितियां: ${conditions}

${insight}`
    } else {
      if (bmiVal < 18.5) {
        bmiCategory = 'Underweight'
        insight = 'Tip: Based on your BMI, a protein-rich diet is suggested to help you build healthy muscle mass.'
      } else if (bmiVal >= 18.5 && bmiVal < 25) {
        bmiCategory = 'Normal'
        insight = 'Tip: Based on your BMI, your weight is in the healthy range! Keep up the good work and maintain a balanced diet.'
      } else if (bmiVal >= 25 && bmiVal < 30) {
        bmiCategory = 'Overweight'
        insight = 'Tip: Based on your BMI, incorporating light exercise (like a 30-minute brisk walk) into your daily routine is suggested.'
      } else {
        bmiCategory = 'Obese'
        insight = 'Tip: Based on your BMI, incorporating light exercise (like a 30-minute brisk walk) into your daily routine is suggested.'
      }

      const conditions = (profile.conditions && profile.conditions.trim()) ? profile.conditions : 'None reported'

      healthProfileSection = `📋 Your Health Profile:
- Age: ${profile.age} years
- Weight: ${profile.weight} kg
- Height: ${profile.height} cm
- BMI: ${calculatedBmi} (${bmiCategory})
- Health Conditions: ${conditions}

${insight}`
    }
  } else {
    if (lang === 'hi') {
      healthProfileSection = `कृपया सेटिंग्स में अपना स्वास्थ्य प्रोफ़ाइल (उम्र, वजन, ऊंचाई) पूरा करें ताकि मैं आपको व्यक्तिगत स्वास्थ्य अंतर्दृष्टि प्रदान कर सकूं!`
    } else {
      healthProfileSection = `Please complete your health profile (Age, Weight, Height) in settings so I can provide personalized health insights!`
    }
  }

  if (lang === 'hi') {
    return `🙏 ${greeting}! ArogyaBot में आपका स्वागत है, ${name}!

मैं आपका व्यक्तिगत एआई स्वास्थ्य सहायक हूँ, यहाँ स्वास्थ्य जानकारी, लक्षणों और कल्याण मार्गदर्शन में आपकी सहायता के लिए हूँ।

${healthProfileSection}

━━━━━━━━━━━━━━━

💬 आज मैं आपकी कैसे मदद कर सकता हूँ?
- 🤒 अपने लक्षणों के बारे में बताएं
- 💊 दवाओं या उपचार के बारे में पूछें
- 🥗 आहार या पोषण संबंधी सलाह लें
- 🏥 नजदीकी अस्पताल खोजें
- 📋 सामान्य स्वास्थ्य प्रश्न

कृपया मुझे बताएं कि आपको क्या परेशानी है, और मैं मदद करने की पूरी कोशिश करूँगा! याद रखें, मैं सामान्य स्वास्थ्य जानकारी प्रदान करता हूँ — चिकित्सा निर्णयों के लिए हमेशा डॉक्टर से परामर्श करें।`
  } else {
    return `🙏 ${greeting}! Welcome to ArogyaBot, ${name}!

I'm your personal AI health assistant, here to help you with health information, symptoms, and wellness guidance.

${healthProfileSection}

━━━━━━━━━━━━━━━

💬 How can I help you today?
- 🤒 Describe your symptoms
- 💊 Ask about medicines or treatments
- 🥗 Get diet or nutrition advice
- 🏥 Find nearby hospitals
- 📋 General health queries

Please tell me what's bothering you, and I'll do my best to help! Remember, I provide general health information — always consult a doctor for medical decisions.`
  }
}

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
9. Give personalized remedies based on their profile.
10. When a new chat session starts (no chat history), AI should send a structured opening message matching:
    - Welcome greeting using the user's name.
    - Time-based greeting: "Good morning" before 12pm, "Good afternoon" between 12-5pm, and "Good evening" after 5pm (or Hindi equivalents).
    - Under "📋 Your Health Profile", list Age, Weight, Height, BMI (rounded to 1 decimal with category: Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (30+)), and Health Conditions (or 'None reported').
    - If any of age/weight/height are missing, skip the "📋 Your Health Profile" section entirely and ask the user to complete their profile.
    - Provide a personalized insight: suggest a protein-rich diet if underweight, light exercise if overweight/obese, and appreciate/suggest maintenance if normal.
    - Offer standard help suggestions and a medical disclaimer.
    - Always respond in the user's preferred language.`
}

const getChatResponse = async (userMessage, chatHistory = [], profile = null, language = 'en') => {
  if (!chatHistory || chatHistory.length === 0) {
    return generateOpeningMessage(profile, language)
  }

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