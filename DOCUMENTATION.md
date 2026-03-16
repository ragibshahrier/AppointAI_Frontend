# Appoint: AI-Powered Healthcare Assistant

Appoint is a voice- and video-enabled AI assistant designed to streamline healthcare access. It helps users identify symptoms, suggests the right type of doctor, recommends suitable clinics/hospitals nearby, and automates appointment booking. Built for a hackathon, this MVP demonstrates a seamless, intelligent patient journey tailored for everyone, including illiterate, elderly, or tech-challenged individuals.

## Table of Contents

1. [Core Features](#core-features)
2. [Architecture Overview](#architecture-overview)
3. [The AI Agent (Gemini Live API)](#the-ai-agent-gemini-live-api)
4. [The "Live Visual Stream" Booking Automation](#the-live-visual-stream-booking-automation)
5. [Frontend Stack & UI/UX](#frontend-stack--uiux)

---

## Core Features

### 1. Multimodal AI Triage Agent

* **Real-time Voice Conversation:** Users describe symptoms via voice or text. The AI responds with low-latency voice output using the Gemini Live API and asks clarifying questions if information is incomplete.
* **Visual Symptom Analysis:** Multimodal support allows users to show rashes or injuries via the camera.
* **Multilingual Support:** The system supports both Bangla and English. The AI can understand and respond in the user's preferred language.

### 2. Intelligent Medical Routing & Management

* **Doctor & Clinic Recommendations:** Recommends specialists and clinics based on symptoms and location. It shows options with trade-offs such as distance, availability, and ratings.
* **Emergency Detection:** Detects high-risk symptoms like chest pain, stroke, or bleeding. It immediately alerts the user and recommends the nearest emergency hospital.
* **Appointment Management:** Includes a dashboard for upcoming and past appointments. The system sends notifications and reminders before appointments.
* **History & Context Awareness:** Keeps all past appointment info, symptom logs, and communication threads. This enables context-aware follow-ups, reducing repetitive inputs.

### 3. Automated Booking

* **Live Visual Stream Simulation:** The automation agent navigates hospital/clinic portals, fills forms, and sends emails if needed. For the MVP, this is visualized as a modal popping up showing a simulated live video feed of a "ghost cursor" navigating a hospital portal.

---

## Architecture Overview

The system follows a modern client-server architecture to orchestrate AI, frontend UI, and automation.

* **Frontend UI:** React and Camera API integration.
* **Backend API:** FastAPI orchestrating the AI, frontend, and automation.
* **Database:** Firestore for storing user info, appointment history, and symptom logs.
* **AI Engine:** Gemini LLM + Vision API.
* **Automation Agent:** Playwright/Selenium for portal navigation.

---

## The AI Agent (Gemini Live API)

The core of the application is the `Agent.tsx` page, which establishes a WebSocket connection to the Gemini Live API.

### Connection & Configuration

The connection is established using `ai.live.connect()`. The model is configured with specific system instructions to act as a healthcare assistant, adapt to the user's language preference, and utilize specific tools.

### Audio Processing

* **Input:** The user's microphone audio is captured using `navigator.mediaDevices.getUserMedia()`. The raw audio stream is processed to extract raw PCM data and sent to the Gemini API.
* **Output:** The AI's audio responses are received as Base64 encoded PCM data and played back seamlessly using the Web Audio API.

### Video Processing

When the camera is enabled, the frontend captures frames from the video stream and sends them to the Gemini API, allowing the AI to "see" the user and analyze visual symptoms.

### Tool Calling (Function Calling)

The AI is equipped with specific tools it can call based on the conversation:

1. `showRecommendations`: Shows doctor and clinic options with availability and trade-offs.
2. `triggerEmergencyAlert`: Triggers a critical red alert modal for high-risk symptoms.
3. `triggerAutomatedBooking`: Initiates the visual booking automation sequence.

---

## The "Live Visual Stream" Booking Automation

To provide a working demo for the hackathon, the automated booking process is visualized as a live stream of an AI agent controlling a browser.

### The `SimulatedBrowserStream` Component

This component creates a fake browser window demonstrating the end-to-end flow:

1. **Ghost Cursor:** A red mouse pointer icon is animated across the screen.
2. **Form Interaction:** The cursor moves to specific input fields to handle different portal UIs.
3. **Typing Simulation:** Text is incrementally added to the input fields to simulate human typing.
4. **Confirmation:** The cursor clicks a "Confirm Booking" button, confirming the booking and storing the info in the database.

---

## Frontend Stack & UI/UX

* **Tailwind CSS & Framer Motion:** Used for styling and animations, providing a clean interface that ensures healthcare is accessible and straightforward.
* **Key UI Components:**
  * **The AI Orb:** A central, animated orb that reacts to both the user's voice volume and the AI's speaking state.
  * **Cinematic Subtitles:** Floating text at the bottom of the screen that displays the conversation in real-time.
  * **Dashboard:** A dedicated view for appointment management and continuation of previous appointment threads.
