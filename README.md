# 🏥 ArogyaBot

A public health awareness chatbot for rural and semi-urban India. Ask about diseases, symptoms, vaccines, and prevention — in Hindi or English.

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS v3 |
| Routing | React Router DOM |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Backend | Node.js + Express |
| AI | Claude API (claude-sonnet-4-6) |
| WhatsApp | Twilio |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
arogya-bot/
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── hooks/useSpeech.js
│   │   ├── lib/supabase.js
│   │   └── pages/
│   │       ├── Landing.jsx
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Dashboard.jsx
│   │       └── Chat.jsx
│   ├── .env.example
│   └── vite.config.js
└── backend/
    ├── data/healthData.json
    ├── lib/supabase.js
    ├── routes/
    │   ├── chat.js
    │   └── whatsapp.js
    ├── utils/claudeClient.js
    └── server.js
```

---

## ⚙️ Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/arogya-bot.git
cd arogya-bot
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Fill in your keys in .env
npm run dev
```

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your keys in .env
npm run dev
```

---

## 🔑 Environment Variables

### frontend/.env
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3000
```

### backend/.env
```
ANTHROPIC_API_KEY=your_claude_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=3000
```

> ⚠️ Never commit `.env` files. Only `.env.example` goes to GitHub.

---

## 🚀 Deployment

| Service | Platform | Branch |
|---------|----------|--------|
| Frontend | Vercel | `main` (root: `/frontend`) |
| Backend | Render | `main` (root: `/backend`) |

After deploying backend, update `VITE_API_URL` in Vercel environment variables with your Render URL.

---

## ✨ Features

- 💬 Chat with Claude-powered health bot
- 🌐 Hindi + English language support
- 🎤 Voice input (Chrome)
- 📜 Chat history saved per user
- 📱 WhatsApp integration via Twilio
- 🔐 Secure auth with Supabase

---

*ArogyaBot — Built to learn fullstack AI development*
