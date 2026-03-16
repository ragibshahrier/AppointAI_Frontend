# Appoint - Healthcare Assistant Frontend

Appoint is a voice- and video-enabled AI assistant designed to streamline healthcare access. This repository contains the frontend implementation of the MVP.

## Tech Stack
- React 19
- TypeScript
- Tailwind CSS
- React Router DOM
- Framer Motion (for animations)
- Lucide React (for icons)

## Project Structure
- `src/components/`: Reusable UI components (buttons, cards, inputs).
- `src/pages/`: Main application screens (Login, Dashboard, Agent, Booking).
- `src/context/`: React Context for global state management (Auth, App state).
- `src/services/`: API integration layer (currently mocked for frontend MVP).

## Backend Integration Guide

To connect this frontend to a real backend, you need to implement the following API endpoints. The frontend currently uses mocked services in `src/services/api.ts`. You should replace these mock functions with actual `fetch` or `axios` calls to your backend.

### 1. Authentication Endpoints
- **POST `/api/auth/login`**
  - Request body: `{ email, password }`
  - Response: `{ token, user: { id, name, email, language } }`
- **POST `/api/auth/register`**
  - Request body: `{ name, email, password, language }`
  - Response: `{ token, user: { id, name, email, language } }`
- **GET `/api/auth/me`**
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user: { id, name, email, language } }`

### 2. AI Agent Endpoints
- **POST `/api/agent/chat`**
  - Request body: `{ message, language, contextId? }`
  - Response: `{ reply, isEmergency, recommendedDoctors?: Doctor[], contextId }`
- **POST `/api/agent/voice`**
  - Request body: `FormData` containing audio file.
  - Response: `{ text, reply, isEmergency, recommendedDoctors?: Doctor[], contextId }`
- **POST `/api/agent/vision`**
  - Request body: `FormData` containing image file.
  - Response: `{ analysis, reply, isEmergency, recommendedDoctors?: Doctor[], contextId }`

### 3. Appointment Endpoints
- **GET `/api/appointments`**
  - Headers: `Authorization: Bearer <token>`
  - Response: `[{ id, doctorName, specialty, clinicName, date, time, status }]`
- **POST `/api/appointments/book`**
  - Headers: `Authorization: Bearer <token>`
  - Request body: `{ doctorId, clinicId, date, time, symptoms }`
  - Response: `{ success: true, appointment: { ... } }`

### 4. Doctor/Clinic Endpoints
- **GET `/api/doctors`**
  - Query params: `?specialty=...&lat=...&lng=...`
  - Response: `[{ id, name, specialty, clinicName, distance, rating, availableSlots }]`

## How to Connect
1. Open `src/services/api.ts`.
2. Update the `BASE_URL` to point to your backend server.
3. Replace the `Promise.resolve` mock implementations with actual HTTP requests.
4. Ensure your backend handles CORS properly if hosted on a different domain.

## Running the App
```bash
npm install
npm run dev
```
