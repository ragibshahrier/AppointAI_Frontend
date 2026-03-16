// Real API Service for Appoint Frontend — calls Django backend

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
console.log('[Appoint API] BASE_URL =', BASE_URL);

// ─── Interfaces (unchanged from original) ───────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  language: 'en' | 'bn';
  profile?: {
    age?: string;
    gender?: string;
    bloodType?: string;
    emergencyContact?: string;
    allergies?: string;
    chronicConditions?: string;
  };
}

export interface Clinic {
  id: string;
  name: string;
  distance: string;
  rating: number;
  availability: string;
  tradeoffs: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinicName: string;
  distance: string;
  rating: number;
  availableSlots: string[];
  tradeoff: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'past' | 'cancelled';
}

export interface SymptomLog {
  id: string;
  date: string;
  symptoms: string[];
  severity: 'low' | 'medium' | 'high';
  notes: string;
}

export interface CommunicationThread {
  id: string;
  date: string;
  summary: string;
  outcome: string;
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers as Record<string, string> || {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

function get<T>(path: string) {
  return request<T>(path, { method: 'GET' });
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

function patch<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

// ─── API object (drop-in replacement, same call signatures) ──────────────────

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
      return post('/auth/login', { email, password });
    },

    register: async (name: string, email: string, password: string, language: 'en' | 'bn'): Promise<{ token: string; user: User }> => {
      return post('/auth/register', { name, email, password, language });
    },

    me: async (): Promise<{ user: User }> => {
      return get('/auth/me');
    },

    updateProfile: async (profileData: any): Promise<{ user: User }> => {
      return patch('/auth/profile', profileData);
    },
  },

  agent: {
    chat: async (message: string, language: 'en' | 'bn'): Promise<{ reply: string; isEmergency: boolean; recommendedDoctors?: Doctor[] }> => {
      return post('/agent/chat', { message, language });
    },
  },

  appointments: {
    get: async (): Promise<Appointment[]> => {
      return get('/appointments');
    },

    book: async (doctorId: string, date: string, time: string): Promise<{ success: boolean; appointment: Appointment }> => {
      return post('/appointments/book', { doctorId, date, time });
    },
  },

  doctors: {
    search: async (specialty: string): Promise<Doctor[]> => {
      return get(`/doctors?specialty=${encodeURIComponent(specialty)}`);
    },
  },

  history: {
    getSymptomLogs: async (): Promise<SymptomLog[]> => {
      return get('/history/symptoms');
    },

    getCommunicationThreads: async (): Promise<CommunicationThread[]> => {
      return get('/history/threads');
    },
  },

  clinics: {
    search: async (specialty?: string): Promise<Clinic[]> => {
      const qs = specialty ? `?specialty=${encodeURIComponent(specialty)}` : '';
      return get(`/clinics${qs}`);
    },
  },
};
