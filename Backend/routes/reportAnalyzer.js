const express = require('express')
const router = express.Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')

const SYSTEM_PROMPT = `You are a medical report analysis assistant for a public health awareness app used in India.
Analyze the uploaded medical report (lab report, prescription, scan summary, etc.) and respond with ONLY a valid JSON object (no markdown fences, no extra text) with EXACTLY these keys:

{
  "summary": "string - 2-3 sentence summary of the report",
  "plainExplanation": "string - explain the report in simple, non-technical language a layperson can understand",
  "findings": [{"name": "string", "value": "string", "status": "normal|abnormal|critical", "note": "string"}],
  "bodyChanges": "string - what is happening in the body based on these results",
  "possibleCauses": ["string"],
  "symptoms": ["string - symptoms the person may experience"],
  "lifestyleImprovements": ["string"],
  "foodsToEat": ["string"],
  "foodsToAvoid": ["string"],
  "medicineAnalysis": "string or null - only if medicines/prescriptions are detected in the report",
  "riskLevel": "normal|mild|moderate|critical",
  "doctorRecommendation": "string - whether and when to see a doctor",
  "disclaimer": "string - standard medical disclaimer stating this is not a diagnosis"
}

Be accurate, cautious, and clear. If the document is not a medical report, set riskLevel to "normal" and explain in "summary" that no medical data was found.
Respond with raw JSON only - no markdown code fences, no commentary before or after.`

const stripDataUri = (dataUri = '') => {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return {
    mimeType: match[1],
    data: match[2]
  }
}

const parseJsonResponse = (text = '') => {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw err
    return JSON.parse(jsonMatch[0])
  }
}

const analyzeWithGemini = async (fileData, mimeType, fileName) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_REPORT_MODEL || 'gemini-1.5-flash'
  })

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    {
      inlineData: {
        mimeType,
        data: fileData
      }
    },
    `Uploaded file name: ${fileName || 'medical-report'}`
  ])

  return result.response.text()
}

const analyzeWithOpenRouter = async (dataUri, mimeType, fileName) => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_VISION_MODEL ||
    process.env.VITE_OPENROUTER_VISION_MODEL ||
    process.env.OPENROUTER_MODEL ||
    process.env.VITE_OPENROUTER_MODEL

  if (!apiKey || !model) {
    throw new Error('Report analyzer is not configured. Add GOOGLE_API_KEY or OPENROUTER_API_KEY and a vision-capable model.')
  }

  const content = mimeType.startsWith('image/')
    ? [
        { type: 'text', text: `${SYSTEM_PROMPT}\n\nUploaded file name: ${fileName || 'medical-report'}` },
        { type: 'image_url', image_url: { url: dataUri } }
      ]
    : [
        { type: 'text', text: `${SYSTEM_PROMPT}\n\nUploaded file name: ${fileName || 'medical-report'}` },
        {
          type: 'file',
          file: {
            filename: fileName || 'report.pdf',
            file_data: dataUri
          }
        }
      ]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'ArogyaBot Report Analyzer'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content
        }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter analyzer failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('No response received from the analyzer. Please try again.')
  }

  return text
}

router.post('/', async (req, res) => {
  const { dataUri, mimeType, fileName } = req.body

  if (!dataUri) {
    return res.status(400).json({ error: 'Report file data is required.' })
  }

  const fileData = stripDataUri(dataUri)
  if (!fileData) {
    return res.status(400).json({ error: 'Invalid report file data.' })
  }

  const finalMimeType = mimeType || fileData.mimeType
  const supportedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!supportedTypes.includes(finalMimeType)) {
    return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP file.' })
  }

  try {
    const responseText = process.env.GOOGLE_API_KEY
      ? await analyzeWithGemini(fileData.data, finalMimeType, fileName)
      : await analyzeWithOpenRouter(dataUri, finalMimeType, fileName)
    const parsedData = parseJsonResponse(responseText)
    res.json(parsedData)
  } catch (error) {
    console.error('Report analyzer error:', error)
    res.status(500).json({ error: 'Failed to analyze report. Please try again with a clearer report image or PDF.' })
  }
})

module.exports = router
