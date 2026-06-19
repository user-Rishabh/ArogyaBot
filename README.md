# 🏥 ArogyaBot

[![Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Backend-Express.js-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20%2B%20Postgres-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-4285F4?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

A premium, comprehensive public health awareness and wellness assistant designed specifically for rural and semi-urban India. **ArogyaBot** provides health guidance, disease awareness, vaccine information, personalized diet planning, BMI insights, medicine suggestions, safety/interaction checks, and seamless WhatsApp integration in a highly accessible, multilingual manner.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React (v19) + Vite + Tailwind CSS (v3) | Ultra-fast rendering, responsive layout, modern design system. |
| **Routing** | React Router DOM (v7) | Dynamic routing and client-side page handling. |
| **Authentication** | Supabase Auth | Secure, token-based authentication and sessions. |
| **Database** | Supabase (PostgreSQL) | Secure and scalable user profile and health history storage. |
| **Backend** | Node.js + Express.js | Core API gateway and routing logic. |
| **AI Engine** | Google Gemini 2.5 Flash / OpenRouter (Llama 3.3) | State-of-the-art LLMs for smart chat, diet planning, and health checks. |
| **Messaging** | Twilio WhatsApp API | Direct delivery of health summaries and prescriptions via WhatsApp. |
| **PDF/Canvas** | jsPDF + html2canvas | On-the-fly generation of downloadable wellness reports. |

---

## ✨ Features

### 🩺 Multilingual Health Chatbot
* **AI Health Consultation**: Conversational wellness guidance using Google Gemini or OpenRouter (Llama 3.3).
* **Disease & Vaccine Awareness**: Detailed information on regional diseases and immunization timelines.
* **Multilingual Support**: Real-time toggling and automated detection for Hindi and English.
* **Speech-to-Text Integration**: Chrome-based Web Speech API allows users to speak their questions instead of typing.
* **Medical Disclaimer Protection**: Safeguards user behavior by automatically appending necessary medical disclaimers.

### 💊 Intelligent Medicine Suggester
* **Alternative Systems of Medicine**: Support for Ayurvedic, Homeopathic, and Allopathic suggestions.
* **Age-Adjusted Dosages**: Intelligent dosage recommendations tailored to Pediatric, Adult, and Geriatric groups.
* **Multi-Step Safety Warning**: Tailored precautions for chronic conditions, age limits, and allergies.

### 🥗 Personal Diet Planner
* **Tailored Indian Diet Charts**: Generates customized breakfast, lunch, snack, and dinner options.
* **Multi-Factor Customization**: Automatically calculates suggestions based on:
  * Age, Height, Weight, and calculated BMI category.
  * Health Goal (Weight Loss, Weight Gain, Maintenance).
  * Dietary Preference (Vegetarian, Non-Vegetarian).

### ⚖️ BMI Tracker & Health Dashboard
* **Dynamic BMI Analysis**: Calculates BMI instantly with visual category scales.
* **Wellness Advisory Panel**: Seasonal tips, hydration tracking, and preventative suggestions updated in real time.
* **Emergency Contacts**: Quick access to national and state-level healthcare helpline numbers.

### 📱 WhatsApp & Offline Sharing
* **WhatsApp Share**: Integrated Twilio messaging client to push diet plans and tips to a user's phone.
* **PDF Report Generation**: Instant export of health profile, diet plans, and BMI stats into a printable PDF.

---

## 📁 Project Structure

```text
ArogyaBot/
├── Backend/
│   ├── data/
│   │   └── healthData.json         # Static dictionary of diseases and vaccines
│   ├── lib/
│   │   └── supabase.js             # Supabase server client initialization
│   ├── routes/
│   │   ├── chat.js                 # Chatbot endpoint wrapper
│   │   ├── diet.js                 # Personal diet planner endpoint
│   │   ├── interactions.js         # Medicine interactions checker route
│   │   ├── suggestions.js          # Medicine suggestions generator route
│   │   └── whatsapp.js             # Twilio WhatsApp messaging logic
│   ├── utils/
│   │   └── claudeClient.js         # Google Gemini & OpenRouter AI adapter
│   ├── .env                        # Local Backend environment file (ignored)
│   ├── package.json                # Node dependencies and run scripts
│   └── server.js                   # Express application entrypoint
│
├── frontend/
│   ├── public/                     # Static assets (favicons, logos)
│   ├── src/
│   │   ├── assets/                 # SVGs, images, and fonts
│   │   ├── components/
│   │   │   ├── BMICalculator.jsx   # Interactive BMI calculator and indicator
│   │   │   └── EmergencyNumbers.jsx # List of important Indian helpline numbers
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global Supabase authentication wrapper
│   │   ├── hooks/
│   │   │   └── useSpeech.js        # Custom speech recognition hook
│   │   ├── lib/
│   │   │   └── supabase.js         # Supabase client credentials and init
│   │   ├── pages/
│   │   │   ├── Landing.jsx         # Modern landing page with interactive features
│   │   │   ├── Login.jsx           # Clean login screen
│   │   │   ├── Signup.jsx          # Register user with email credentials
│   │   │   ├── Onboarding.jsx      # Collects initial user details (age, weight, goal)
│   │   │   ├── Dashboard.jsx       # Tabbed interface (Advisory, Suggester, Diet, BMI)
│   │   │   └── Chat.jsx            # Speech-enabled healthcare assistant workspace
│   │   ├── App.css                 # Local component rules
│   │   ├── App.jsx                 # Routing configuration (Protected routes)
│   │   ├── index.css               # Global tailwind rules & HSL color tokens
│   │   └── main.jsx                # React app mount
│   ├── .env                        # Local Frontend environment file (ignored)
│   ├── tailwind.config.js          # Tailwind customization and color palette
│   └── vite.config.js              # Vite bundler configurations
│
└── supabase_schema.json            # Database schema backup file
```

---

## ⚙️ Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/arogya-bot.git
cd arogya-bot
```

### 2. Configure Environment Variables
Create `.env` files in both the `Backend` and `frontend` folders using the templates provided below.

### 3. Backend Setup
```bash
cd Backend
npm install
npm run dev
```
The backend will run on `http://localhost:3000`.

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`. Open your browser to explore the dashboard.

---

## 🔑 Environment Variables

### Backend Configuration (`Backend/.env`)
Create a file named `.env` in the `Backend` directory:
```env
# Server Port
PORT=3000

# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key

# OpenRouter (Optional: Fallback/Alternative LLM Provider)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Supabase Configurations
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Twilio Credentials (WhatsApp integration)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

### Frontend Configuration (`frontend/.env`)
Create a file named `.env` in the `frontend` directory:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_publishable_key

# API connection URL
VITE_API_URL=http://localhost:3000
```

---

## 🚀 Deployment

### Database (Supabase)
Create a table `profiles` in your Supabase database using the SQL Editor:
```sql
create table profiles (
  id uuid references auth.users not null primary key,
  name text,
  age numeric,
  gender text,
  height numeric,
  weight numeric,
  conditions text,
  diet_preference text,
  goal text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);
```

### Frontend (Vercel)
1. Link your GitHub repository to [Vercel](https://vercel.com).
2. Configure build settings:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
3. Add environmental variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (Pointer to deployed backend URL)

### Backend (Render / Railway)
1. Deploy the `Backend` directory as a Web Service.
2. Ensure the start script is set to `npm start`.
3. Provide variables: `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `TWILIO_ACCOUNT_SID`, and `TWILIO_AUTH_TOKEN`.
4. Copy the deployed backend URL and update your frontend's `VITE_API_URL`.

---

## 👨‍💻 Developed For
Academic Project / Full Stack AI Healthcare Assistant aimed at improving public health literacy, accessibility, and emergency support for semi-urban and rural populations.

---

*Disclaimer: ArogyaBot is an AI-powered public health assistant designed for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.*
