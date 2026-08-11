const express = require('express')
const router = express.Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')
const multer = require('multer')
const sharp = require('sharp')
const pdfParse = require('pdf-parse')
const fs = require('fs')
const path = require('path')
const os = require('os')

const SYSTEM_PROMPT = `You are a highly advanced medical AI assistant.
Analyze the provided medical document. It may be a blood test, prescription, MRI, CT Scan, Ultrasound, X-Ray, Discharge Summary, or Medical Certificate.
Respond strictly with ONLY a JSON object that matches this format (do not include markdown formatting or extra text):

{
  "success": true,
  "reportType": "Blood Test | Prescription | MRI | etc.",
  "summary": "Plain language summary of the report",
  "findings": [
    {
      "name": "Test or observation name",
      "value": "Value or description (with units if available)",
      "reference": "Biological reference range if stated or standard clinical bracket",
      "status": "normal|abnormal|critical",
      "note": "Medical terminology explained simply"
    }
  ],
  "abnormalities": ["List of abnormal findings explained in plain English"],
  "recommendations": ["Lifestyle recommendations and next steps"],
  "doctorQuestions": ["3-4 specific, high-value questions the patient should ask their doctor regarding these results"],
  "emergency": false,
  "confidence": 0.95
}

Be accurate, cautious, and clear. If no medical data is found, set success to false and explain why in summary.`

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

const analyzeWithGemini = async (fileBuffer, mimeType, fileName) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_REPORT_MODEL || 'gemini-1.5-flash'
  })

  const base64Data = fileBuffer.toString('base64')

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    {
      inlineData: {
        mimeType,
        data: base64Data
      }
    },
    `Uploaded file name: ${fileName || 'medical-report'}`
  ])

  return result.response.text()
}

const analyzeWithOpenRouter = async (fileBuffer, mimeType, fileName) => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_VISION_MODEL ||
    process.env.VITE_OPENROUTER_VISION_MODEL ||
    process.env.OPENROUTER_MODEL ||
    process.env.VITE_OPENROUTER_MODEL

  if (!apiKey || !model) {
    throw new Error('Report analyzer is not configured. Add GOOGLE_API_KEY or OPENROUTER_API_KEY and a vision-capable model.')
  }

  const base64Data = fileBuffer.toString('base64')
  const dataUri = `data:${mimeType};base64,${base64Data}`

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

const uploadDir = path.join(os.tmpdir(), 'arogyabot-uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP file.'))
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: fileFilter
})

router.post('/', upload.single('report'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file selected. Please upload a report.' })
  }

  const filePath = req.file.path
  const originalMimeType = req.file.mimetype
  const fileName = req.file.originalname

  try {
    let fileBuffer = await fs.promises.readFile(filePath)
    let finalMimeType = originalMimeType

    // Image optimization with sharp or PDF text extraction
    if (originalMimeType.startsWith('image/')) {
      fileBuffer = await sharp(fileBuffer)
        .resize(1500, null, { withoutEnlargement: true }) // Max width 1500px, maintain aspect ratio
        .jpeg({ quality: 80 }) // Automatically compress
        .toBuffer()
      finalMimeType = 'image/jpeg'
    } else if (originalMimeType === 'application/pdf') {
      try {
        const pdfData = await pdfParse(fileBuffer)
        fileBuffer = Buffer.from(pdfData.text, 'utf-8')
        finalMimeType = 'text/plain'
      } catch (pdfErr) {
        console.error('Failed to parse PDF text:', pdfErr)
        // Fallback to sending PDF directly if extraction fails
      }
    }

    const responseText = process.env.GOOGLE_API_KEY
      ? await analyzeWithGemini(fileBuffer, finalMimeType, fileName)
      : await analyzeWithOpenRouter(fileBuffer, finalMimeType, fileName)
      
    const parsedData = parseJsonResponse(responseText)
    res.json(parsedData)
  } catch (error) {
    console.error('Report analyzer error:', error)
    res.status(500).json({ error: 'Failed to analyze report. Please try again with a clearer report image or PDF.' })
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete temporary file:', err)
      })
    }
  }
})

// Custom error handling for multer limits and unsupported files
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Please upload a report smaller than 10 MB.' })
    }
    return res.status(415).json({ error: err.message })
  }
  next(err)
})

module.exports = router
