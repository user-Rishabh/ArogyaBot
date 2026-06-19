# 🏥 ArogyaBot

A public health awareness and wellness assistant designed for rural and semi-urban India. ArogyaBot provides health guidance, disease awareness, vaccine information, personalized diet planning, BMI insights, and WhatsApp integration in a simple and accessible way.

---

## 🛠 Tech Stack

| Layer          | Tech                                 |
| -------------- | ------------------------------------ |
| Frontend       | React + Vite + Tailwind CSS v3       |
| Routing        | React Router DOM                     |
| Authentication | Supabase Auth                        |
| Database       | Supabase (PostgreSQL)                |
| Backend        | Node.js + Express                    |
| AI             | Google Gemini 2.5 Flash              |
| Messaging      | Twilio WhatsApp API                  |
| Deployment     | Vercel (Frontend) + Render (Backend) |

---

## 📁 Project Structure

```text
arogya-bot/
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useSpeech.js
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Chat.jsx
│   │   └── components/
│   ├── .env.example
│   └── vite.config.js
│
└── backend/
    ├── data/
    │   └── healthData.json
    ├── routes/
    │   ├── chat.js
    │   ├── whatsapp.js
    │   └── diet.js
    ├── utils/
    │   └── claudeClient.js
    ├── lib/
    │   └── supabase.js
    └── server.js
```

---

## ⚙️ Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/arogya-bot.git
cd arogya-bot
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

---

## 🔑 Environment Variables

### Frontend (.env)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
```

### Backend (.env)

```env
GOOGLE_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=optional_openrouter_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
PORT=3000
```

---

## 🚀 Deployment

| Service  | Platform |
| -------- | -------- |
| Frontend | Vercel   |
| Backend  | Render   |
| Database | Supabase |

After deploying the backend on Render:

1. Copy your Render backend URL.
2. Update `VITE_API_URL` in Vercel Environment Variables.
3. Redeploy the frontend.

---

## ✨ Features

### 🩺 Health Awareness Chatbot

* AI-powered health guidance using Gemini
* Disease awareness and prevention tips
* Vaccine information and schedules
* Symptom-related educational assistance
* Personalized responses using stored profile data

### 🌍 Multilingual Support

* English support
* Hindi support
* Responses generated in the user's language

### 🎤 Voice Interaction

* Speech-to-text input
* Faster accessibility for users
* Chrome browser support

### 📜 Chat Management

* Persistent chat history
* Session-based conversations
* User-specific records stored securely

### 🔐 Authentication

* Secure login and signup
* Supabase Authentication
* Protected dashboard and chat routes

### 📱 WhatsApp Integration

* Share health information via WhatsApp
* Twilio-powered messaging support

### 🍽️ Personalized Diet Planner

* AI-generated Indian diet plans
* Personalized using:

  * Age
  * Height
  * Weight
  * BMI
  * Goal (Weight Loss / Weight Gain / Maintenance)
  * Diet Preference (Vegetarian / Non-Vegetarian)

### ⚖️ BMI-Based Recommendations

* Automatic BMI calculation
* Personalized health suggestions
* Weight category identification

### 🌡️ Daily Health Advisory Dashboard

* Health awareness card on dashboard
* Hydration reminders
* Seasonal wellness guidance
* Preventive health tips for daily use

### 🎨 Modern User Experience

* Responsive design
* Mobile-friendly layout
* Dark mode support
* Clean healthcare-focused UI

---

## 🎯 Future Enhancements

* Real-time weather-based health advisories
* Nearby hospital and clinic finder
* Medicine reminder system
* Regional language expansion
* Health report generation
* Appointment booking integration

---

## 📸 Screens Included

* Landing Page
* Authentication Pages
* Dashboard
* AI Health Chat
* Diet Planner
* Daily Health Advisory
* WhatsApp Integration

---

## 👨‍💻 Developed For

Academic Project / Full Stack AI Healthcare Assistant

Focused on improving public health awareness and accessibility through AI-powered assistance.

---

### ArogyaBot

**"Your AI Health Companion for Everyday Wellness."**
