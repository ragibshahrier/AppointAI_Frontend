# AppointAI — React Frontend

> AI-powered healthcare assistant frontend with real-time voice interaction via Google Gemini Live API, doctor recommendations, and appointment booking.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 4 |
| **Routing** | React Router DOM 7 |
| **Animation** | Motion (Framer Motion) |
| **AI / Voice** | Google Gemini Live API (`@google/genai`) |
| **Icons** | Lucide React |
| **Deployment** | GitHub Pages (automated via GitHub Actions) |

---

## 📂 Project Structure

```
Appoint-main/
├── src/
│   ├── App.tsx                  # Root app with React Router
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Global styles
│   ├── pages/
│   │   ├── Login.tsx            # Login & Registration page
│   │   ├── Dashboard.tsx        # Main dashboard with appointments
│   │   ├── Agent.tsx            # AI Voice Agent (Gemini Live API)
│   │   ├── Booking.tsx          # Appointment booking flow
│   │   ├── History.tsx          # Symptom logs & communication threads
│   │   └── Profile.tsx          # User profile management
│   ├── components/
│   │   ├── HoverWindow.tsx      # Doctor/clinic recommendations overlay
│   │   ├── AppointmentInfoWindow.tsx  # Appointment details modal
│   │   ├── SimulatedBrowserStream.tsx # Video stream component
│   │   └── ui/                  # Reusable UI components (Button, Card, etc.)
│   ├── context/
│   │   └── AuthContext.tsx      # JWT auth state management
│   └── services/
│       └── api.ts               # REST API client (connects to Django backend)
├── public/
│   └── 404.html                 # SPA redirect for GitHub Pages
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions deployment workflow
├── index.html                   # App shell with SPA redirect handler
├── vite.config.ts               # Vite config (base path, env vars)
├── package.json
├── .env                         # Environment variables (not committed)
└── .gitignore
```

---

## 🚀 Local Setup (Reproducible)

### Prerequisites

- Node.js 18+ installed
- npm
- Git
- A running Django backend (see [Backend README](../Backend/README.md))

### Step 1: Clone & Navigate

```bash
git clone https://github.com/ragibshahrier/AppointAI_Frontend.git
cd AppointAI_Frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Gemini API Key for the Live Voice AI agent
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Backend API URL (Django server)
VITE_API_URL=http://localhost:8000/api
```

> **Important:** Only variables prefixed with `VITE_` are exposed to the browser by Vite.

### Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000/**.

---

## 🧪 Reproducible Testing

### Prerequisites for Full Testing

1. **Backend running** at `http://localhost:8000` (see Backend README)
2. **Sample data seeded** (`python manage.py seed_hospitals`)
3. **Test user created** in the backend
4. **Gemini API key** set in `.env`

### Test 1: Authentication Flow

1. Open **http://localhost:3000** in your browser
2. You should see the **Login page** with the AppointAI logo
3. Click **"Don't have an account? Sign up"**
4. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `testpass123`
   - Language: `English`
5. Click **"Create Account"**
6. ✅ **Expected**: You are redirected to the **Dashboard**

### Test 2: Login with Existing User

1. If you created a test user via the backend, click **"Sign In"**
2. Enter: `test@appoint.com` / `testpass123`
3. ✅ **Expected**: Dashboard loads with user greeting and any existing appointments

### Test 3: Dashboard & Appointments

1. On the Dashboard, verify:
   - ✅ User greeting is displayed (e.g., "Hello, Test")
   - ✅ Upcoming appointments section is visible
   - ✅ The AI assistant orb is visible at the bottom

### Test 4: AI Voice Agent (Gemini Live API)

1. From the Dashboard, click the **green orb / microphone** button
2. You should be taken to the **Agent page**
3. ✅ **Expected**: Browser asks for **microphone permission** → Allow it
4. ✅ **Expected**: The orb animates, showing the AI is listening
5. Speak: *"I have a headache"*
6. ✅ **Expected**: The AI responds empathetically and asks follow-up questions
7. After a few exchanges, the AI should suggest a specialist and call `showRecommendations`
8. ✅ **Expected**: A **HoverWindow** appears showing recommended doctors from the backend

### Test 5: Doctor Recommendations & Booking

1. When the HoverWindow shows doctors, click on a doctor card
2. ✅ **Expected**: The **Booking page** opens with the selected doctor pre-filled
3. Select a date and time, then click **Confirm**
4. ✅ **Expected**: Appointment is booked and saved to the backend

### Test 6: Profile Management

1. Navigate to **Profile** (via nav or URL `/profile`)
2. Update fields: age, gender, blood type, allergies
3. Click **Save**
4. ✅ **Expected**: Profile data is persisted (refresh the page to verify)

### Test 7: History

1. Navigate to **History** (via nav or URL `/history`)
2. ✅ **Expected**: Symptom logs and communication threads are displayed (may be empty initially)

### Test 8: Browser Console Verification

Open the browser console (F12 → Console) to verify:
- ✅ `[Appoint API] BASE_URL = http://localhost:8000/api` — confirms backend connection
- ✅ `[Appoint] Connecting to Gemini Live API...` — confirms AI connection attempt
- ✅ No red uncaught errors during normal operation

---

## 📡 API Integration

The frontend connects to the Django backend via `src/services/api.ts`. All API calls:

- Use `fetch()` with JWT token from `localStorage`
- Target `VITE_API_URL` (defaults to `http://localhost:8000/api`)
- Match the exact response shapes expected by each page component

| Frontend Page | API Calls |
|---|---|
| **Login** | `POST /auth/login`, `POST /auth/register` |
| **Dashboard** | `GET /auth/me`, `GET /appointments` |
| **Agent** | `GET /doctors?specialty=X`, `GET /clinics?specialty=X` |
| **Booking** | `POST /appointments/book` |
| **Profile** | `PATCH /auth/profile` |
| **History** | `GET /history/symptoms`, `GET /history/threads`, `GET /appointments` |

---

## 🌐 Deployment (GitHub Pages)

### Automatic (via GitHub Actions)

Every push to `main`/`master` triggers the `.github/workflows/deploy.yml` workflow which:
1. Installs dependencies (`npm ci`)
2. Builds the Vite app (`npm run build`)
3. Deploys the `dist/` folder to GitHub Pages

### Manual Build

```bash
npm run build    # Outputs to dist/
npm run preview  # Preview the production build locally
```

### GitHub Pages Setup

1. Go to **Settings → Pages** in the GitHub repo
2. Set Source to **"GitHub Actions"**
3. Add `VITE_GEMINI_API_KEY` as a **repository secret** (Settings → Secrets → Actions)

**Live URL**: `https://ragibshahrier.github.io/AppointAI_Frontend/`

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | ✅ | Google Gemini API key for Live Voice AI |
| `VITE_API_URL` | ❌ | Backend API URL (default: `http://localhost:8000/api`) |

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking |
| `npm run clean` | Remove dist folder |

---

## 📝 License

Built for the Google Cloud x MLB Hackathon 2025 by Team AppointAI.
