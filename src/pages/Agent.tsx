import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, Doctor, Clinic } from '../services/api';
import { Button } from '../components/ui/Button';
import { PhoneOff, AlertTriangle, Stethoscope, X, ChevronRight, Volume2, Video, VideoOff, MessageSquareText, MessageSquareOff, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { AppointmentInfoWindow, AppointmentDetails } from '../components/AppointmentInfoWindow';
import { HoverWindow } from '../components/HoverWindow';

// Helper functions for PCM audio processing
function float32ToBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToFloat32(base64: string): Float32Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

type ToastType = 'recommendation' | 'emergency' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  data?: any;
}

export default function Agent() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [activeOverlay, setActiveOverlay] = useState<ToastData | null>(null);
  const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
  const [recommendedClinics, setRecommendedClinics] = useState<Clinic[]>([]);
  const [userVolume, setUserVolume] = useState(0);
  const [userSubtitle, setUserSubtitle] = useState('');
  const [isBookingAutomated, setIsBookingAutomated] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingStatus, setBookingStatus] = useState('');
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [aiSubtitle, setAiSubtitle] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(true);
  const [showHoverWindow, setShowHoverWindow] = useState(false);
  const [infoRequest, setInfoRequest] = useState<{ id: string; question: string; inputType: string } | null>(null);
  const [infoInputValue, setInfoInputValue] = useState('');

  const sessionRef = useRef<any>(null);
  const turnCompleteRef = useRef<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoIntervalRef = useRef<any>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const animationFrameRef = useRef<number>(0);
  const subtitleTimeoutRef = useRef<any>(null);
  const fullAiTextRef = useRef<string>('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraEnabled(true);

      // Start sending frames
      videoIntervalRef.current = setInterval(() => {
        if (!sessionRef.current || !videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
            sessionRef.current.sendRealtimeInput({
              media: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            });
          }
        }
      }, 1000); // 1 frame per second
    } catch (err) {
      console.error("Failed to start camera:", err);
      alert("Failed to access camera.");
    }
  };

  const stopCamera = () => {
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(t => t.stop());
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraEnabled(false);
  };

  const toggleCamera = () => {
    if (isCameraEnabled) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log("API Key available:", !!apiKey);

      if (!apiKey) {
        throw new Error("Missing VITE_GEMINI_API_KEY in frontend .env file");
      }

      const ai = new GoogleGenAI({ apiKey });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 }
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      nextPlayTimeRef.current = audioCtx.currentTime;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      // Prevent feedback by connecting processor to a muted gain node
      const dummyGain = audioCtx.createGain();
      dummyGain.gain.value = 0;
      processor.connect(dummyGain);
      dummyGain.connect(audioCtx.destination);

      // Volume detection
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setUserVolume(avg / 255);

        // Check if AI is speaking
        if (audioCtxRef.current) {
          setIsAiSpeaking(audioCtxRef.current.currentTime < nextPlayTimeRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Speech Recognition for User Subtitles
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = user?.language === 'bn' ? 'bn-BD' : 'en-US';
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setUserSubtitle(transcript);

          if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
          subtitleTimeoutRef.current = setTimeout(() => {
            setUserSubtitle('');
            setAiSubtitle('');
          }, 4000);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      console.log("[Appoint] Connecting to Gemini Live API...");
      const sessionPromise = ai.live.connect({
        model: "gemini-2.0-flash-live-001",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          outputAudioTranscription: {},
          systemInstruction: `You are Appoint, a helpful, trustworthy, and empathetic healthcare assistant. The user's language preference is ${user?.language === 'bn' ? 'Bangla' : 'English'}.

USER PROFILE DATA:
- Age: ${user?.profile?.age || 'Unknown'}
- Gender: ${user?.profile?.gender || 'Unknown'}
- Blood Type: ${user?.profile?.bloodType || 'Unknown'}
- Allergies: ${user?.profile?.allergies || 'Unknown'}
- Chronic Conditions: ${user?.profile?.chronicConditions || 'Unknown'}
- Emergency Contact: ${user?.profile?.emergencyContact || 'Unknown'}

CORE BEHAVIORAL GUIDELINES:
1. Empathetic but Objective: Validate the user's discomfort (e.g., "I'm sorry to hear your back is hurting, that sounds very uncomfortable"), but maintain a calm, professional tone.
2. One Question at a Time: Tech-challenged users get overwhelmed easily. NEVER ask compound questions. Ask one simple question, wait for the answer, and then ask the next.
3. Strict Medical Boundaries: You are an assistant, NOT a doctor. You must never replace medical advice. Use phrases like, "Based on what you're describing, a dermatologist would be the best person to look at this."
4. Conversational Pacing: Speak in short, easily digestible sentences. Avoid complex medical jargon unless explaining it simply.
5. Action-Oriented: Your ultimate goal is to get the user the help they need. Gently steer the conversation toward finding a doctor or clinic rather than endlessly discussing symptoms.
6. No Internal Monologue: NEVER narrate your thought process. Only output the exact words you want to speak to the user.

WORKFLOW:
- Talk to the user to understand their symptoms.
- If the description is vague, ask 1 or 2 simple follow-up questions (one at a time) to understand the condition better.
- If the user enables their camera, you can see them and analyze any physical symptoms they show you (like rashes, injuries, etc.).
- If they need a doctor, verbally suggest the type of specialist needed, then call the 'showRecommendations' tool with the specialty to recommend clinics and doctors with trade-offs.
- If the user agrees to book a specific doctor, say "I'll open the appointment details window for you" and call the 'triggerAutomatedBooking' tool.
- Once the appointment window is open, automatically fill in the details using the 'updateAppointmentDetails' tool. Ask the user for any missing information (like preferred date/time or symptoms).
- When the user confirms the details look good, call the 'confirmAppointment' tool to finalize the booking.
- If you need specific information that is easier to type (like an address, a specific date, or a complex name), call the 'requestInformation' tool to show an input popup on their screen.
- If you notice missing information in the user's profile (like age, blood type, allergies) that is needed for booking an appointment, ask the user for it. Once they provide it, use the 'updatePatientProfile' tool to save it.
- If it's an emergency (like chest pain or stroke), immediately trigger an emergency alert by calling 'triggerEmergencyAlert' and recommend the nearest emergency hospital.`,
          tools: [{
            functionDeclarations: [
              {
                name: 'updatePatientProfile',
                description: 'Update the user\'s profile with missing information (e.g., age, blood type, allergies, chronic conditions) before or during booking.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    field: { type: Type.STRING, description: 'The field to update (e.g., age, bloodType, allergies, emergencyContact).' },
                    value: { type: Type.STRING, description: 'The new value for the field.' }
                  },
                  required: ['field', 'value']
                }
              },
              {
                name: 'requestInformation',
                description: 'Request specific information from the user (e.g., date of birth, specific symptom details) and show an input popup on their screen.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: 'The question to ask the user.' },
                    inputType: { type: Type.STRING, description: 'The type of input expected (e.g., text, date, number).' }
                  },
                  required: ['question', 'inputType']
                }
              },
              {
                name: 'showRecommendations',
                description: 'Show a list of recommended doctors and clinics to the user based on their symptoms, including trade-offs like distance and availability.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    specialty: { type: Type.STRING, description: 'The medical specialty needed (e.g., Cardiologist, Dermatologist).' },
                    reason: { type: Type.STRING, description: 'Reason for the recommendation.' }
                  },
                  required: ['specialty', 'reason']
                }
              },
              {
                name: 'triggerEmergencyAlert',
                description: 'Trigger an emergency alert on the user screen if symptoms indicate a critical condition.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    condition: { type: Type.STRING, description: 'The suspected emergency condition.' }
                  },
                  required: ['condition']
                }
              },
              {
                name: 'triggerAutomatedBooking',
                description: 'Open the appointment information window when the user agrees to book an appointment with a doctor.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    doctorName: { type: Type.STRING, description: 'The name of the doctor to book.' },
                    hospital: { type: Type.STRING, description: 'The hospital name.' }
                  },
                  required: ['doctorName', 'hospital']
                }
              },
              {
                name: 'updateAppointmentDetails',
                description: 'Update the fields in the appointment information window. Use this to auto-fill data or update based on user answers.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: 'The appointment date (YYYY-MM-DD).' },
                    time: { type: Type.STRING, description: 'The appointment time (HH:MM).' },
                    symptoms: { type: Type.STRING, description: 'Symptoms or reason for visit.' }
                  }
                }
              },
              {
                name: 'confirmAppointment',
                description: 'Confirm and finalize the appointment booking after the user has reviewed the details.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {}
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);

            // Send an initial message to prompt the AI to speak
            sessionPromise.then(session => {
              session.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: 'Hello! I am here.' }] }],
                turnComplete: true
              });
            });

            processor.onaudioprocess = (e) => {
              if (!sessionRef.current) return;  // Don't send if session is closed
              const inputData = e.inputBuffer.getChannelData(0);
              const base64 = float32ToBase64(inputData);
              sessionPromise.then(session => {
                try {
                  session.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: base64 } });
                } catch (err) {
                  // Ignore errors from closed WebSocket
                }
              });
            };
            source.connect(processor);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
              activeSourcesRef.current = [];
              nextPlayTimeRef.current = audioCtx.currentTime;
              setAiSubtitle('');
              turnCompleteRef.current = true;
            }

            // Extract AI Subtitles
            let newSubtitleText = '';
            if (message.serverContent?.modelTurn?.parts) {
              newSubtitleText += message.serverContent.modelTurn.parts
                .map((p: any) => p.text)
                .filter(Boolean)
                .join('');
            }
            if (message.serverContent?.outputTranscription?.text) {
              newSubtitleText += message.serverContent.outputTranscription.text;
            }

            if (newSubtitleText) {
              const isNewTurn = turnCompleteRef.current;
              if (isNewTurn) {
                turnCompleteRef.current = false;
                fullAiTextRef.current = '';
              }
              fullAiTextRef.current += newSubtitleText;

              // Extract the last sentence or phrase to show as subtitle
              const sentences = fullAiTextRef.current.match(/[^.!?]+[.!?]*\s*/g) || [fullAiTextRef.current];
              const currentSentence = sentences[sentences.length - 1].trim();
              setAiSubtitle(currentSentence);

              if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
              subtitleTimeoutRef.current = setTimeout(() => {
                setAiSubtitle('');
                setUserSubtitle('');
              }, 4000);
            }

            if (message.serverContent?.turnComplete) {
              turnCompleteRef.current = true;
            }

            // Extract Audio
            if (message.serverContent?.modelTurn?.parts) {
              const audioPart = message.serverContent.modelTurn.parts.find((p: any) => p.inlineData?.data);
              const base64Audio = audioPart?.inlineData?.data;
              if (base64Audio) {
                const float32Data = base64ToFloat32(base64Audio);
                const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
                buffer.getChannelData(0).set(float32Data);

                const bufferSource = audioCtx.createBufferSource();
                bufferSource.buffer = buffer;
                bufferSource.connect(audioCtx.destination);

                const startTime = Math.max(audioCtx.currentTime, nextPlayTimeRef.current);
                bufferSource.start(startTime);
                nextPlayTimeRef.current = startTime + buffer.duration;

                activeSourcesRef.current.push(bufferSource);
                bufferSource.onended = () => {
                  activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== bufferSource);
                };
              }
            }

            if (message.toolCall) {
              const call = message.toolCall.functionCalls[0];
              if (call.name === 'triggerAutomatedBooking') {
                const args = call.args as any;
                setAppointmentDetails({
                  doctorName: args.doctorName || '',
                  hospital: args.hospital || '',
                  patientName: user?.name || '',
                  age: user?.profile?.age || '',
                  gender: user?.profile?.gender || '',
                  bloodType: user?.profile?.bloodType || '',
                  symptoms: '',
                  date: '',
                  time: ''
                });
                setIsBookingAutomated(true);

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { result: 'Appointment window opened. Please ask the user for preferred date, time, and symptoms, then use updateAppointmentDetails to fill them.' }
                    }]
                  });
                });
              } else if (call.name === 'updateAppointmentDetails') {
                const args = call.args as any;
                setAppointmentDetails(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    ...(args.date && { date: args.date }),
                    ...(args.time && { time: args.time }),
                    ...(args.symptoms && { symptoms: args.symptoms })
                  };
                });

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { result: 'Appointment details updated in the UI.' }
                    }]
                  });
                });
              } else if (call.name === 'confirmAppointment') {
                setToasts(prev => [...prev, {
                  id: call.id,
                  type: 'recommendation',
                  title: user?.language === 'bn' ? 'অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে' : 'Appointment Confirmed',
                  message: `Your appointment is confirmed.`
                }]);

                setTimeout(() => {
                  setIsBookingAutomated(false);
                  setAppointmentDetails(null);
                }, 2000);

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { result: 'Appointment confirmed and window closed.' }
                    }]
                  });
                });
              } else if (call.name === 'requestInformation') {
                const args = call.args as any;
                setInfoRequest({ id: call.id, question: args.question, inputType: args.inputType });
              } else if (call.name === 'showRecommendations') {
                const args = call.args as any;

                Promise.all([
                  api.doctors.search(args.specialty),
                  api.clinics.search(args.specialty)
                ]).then(([docs, clinics]) => {
                  setRecommendedDoctors(docs);
                  setRecommendedClinics(clinics);
                  setShowHoverWindow(true);
                });

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { result: 'Hover window with recommendations displayed to user.' }
                    }]
                  });
                });
              } else if (call.name === 'updatePatientProfile') {
                const args = call.args as any;
                console.log(`Updating profile: ${args.field} = ${args.value}`);

                // Call the context function to update the profile
                updateProfile({ [args.field]: args.value }).catch(console.error);

                setToasts(prev => [...prev, {
                  id: call.id,
                  type: 'info',
                  title: user?.language === 'bn' ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile Updated',
                  message: `Saved your ${args.field} as ${args.value}.`
                }]);

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { status: 'profile_updated', field: args.field, value: args.value }
                    }]
                  });
                });
              } else if (call.name === 'triggerEmergencyAlert') {
                const args = call.args as any;
                setToasts(prev => [...prev, {
                  id: call.id,
                  type: 'emergency',
                  title: user?.language === 'bn' ? 'জরুরী অবস্থা' : 'Emergency Alert',
                  message: args.condition,
                  data: args
                }]);

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { result: 'Emergency alert displayed to user.' }
                    }]
                  });
                });
              }
            }
          },
          onclose: (e: any) => {
            console.warn("[Appoint] WebSocket closed:", e?.code, e?.reason || 'No reason given');
            // console.log(apiKey);
            disconnect();
          },
          onerror: (err: any) => {
            console.error("[Appoint] Live API Error:", err?.message || err);
            // console.log(apiKey);
            console.error("[Appoint] Full error object:", JSON.stringify(err, null, 2));
            disconnect();
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setIsConnecting(false);
      alert(`Failed to start voice session. ${err.message || 'Please check microphone permissions or API key.'}`);
    }
  };

  const disconnect = () => {
    stopCamera();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
      recognitionRef.current = null;
    }
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { }
      sessionRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) { }
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    // Auto-connect on mount since user clicked the orb on the dashboard
    let mounted = true;
    if (mounted) {
      connect();
    }
    return () => {
      mounted = false;
      disconnect();
    };
  }, []);

  const handleToastClick = async (toast: ToastData) => {
    setActiveOverlay(toast);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden"
    >
      {/* Ambient Background */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: isAiSpeaking
            ? 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.4) 0%, rgba(15, 23, 42, 1) 70%)'
            : userVolume > 0.05
              ? 'radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.4) 0%, rgba(15, 23, 42, 1) 70%)'
              : isConnected
                ? 'radial-gradient(circle at 50% 50%, rgba(6, 95, 70, 0.3) 0%, rgba(15, 23, 42, 1) 70%)'
                : 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 1) 0%, rgba(2, 6, 23, 1) 100%)'
        }}
        transition={{ duration: 1 }}
      />

      {/* Toasts Area */}
      <div className="absolute top-12 right-4 z-50 flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => handleToastClick(toast)}
              className={`p-4 rounded-2xl cursor-pointer shadow-2xl border ${toast.type === 'emergency'
                  ? 'bg-red-950/80 border-red-500/50 text-red-100'
                  : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100'
                } backdrop-blur-md flex items-start gap-3`}
            >
              {toast.type === 'emergency' ? (
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
              ) : (
                <Stethoscope className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              <div className="flex-1">
                <h4 className="font-bold text-sm">{toast.title}</h4>
                <p className="text-xs opacity-80 mt-1 line-clamp-2">{toast.message}</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-50 shrink-0 self-center" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Center Orb */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Camera View */}
        <div className={`absolute top-4 right-4 z-30 transition-all duration-500 ${isCameraEnabled ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="relative w-32 h-48 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <span className="bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {user?.language === 'bn' ? 'ক্যামেরা চালু' : 'Camera On'}
              </span>
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {!isConnected && !isConnecting ? (
          <motion.button
            layoutId="ai-orb-core"
            onClick={connect}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.6)] relative group cursor-pointer border-4 border-white/20 z-10"
          >
            <motion.div layoutId="ai-orb-icon">
              <Mic className="w-12 h-12 text-white" />
            </motion.div>
          </motion.button>
        ) : isConnecting ? (
          <motion.div layoutId="ai-orb-core" className="flex flex-col items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_40px_rgba(16,185,129,0.6)] border-4 border-white/20 z-10">
            <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          </motion.div>
        ) : (
          <div className="relative flex items-center justify-center w-full h-full z-10">
            {/* The Orb */}
            <motion.div
              className="relative flex items-center justify-center"
              animate={{
                scale: isAiSpeaking ? [1, 1.1, 1] : 1 + (userVolume * 2),
              }}
              transition={{
                duration: isAiSpeaking ? 2 : 0.1,
                repeat: isAiSpeaking ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              {/* Outer Glow */}
              <motion.div
                layoutId="ai-orb-glow-1"
                className={`absolute w-64 h-64 rounded-full blur-3xl transition-colors duration-500 ${isAiSpeaking ? 'bg-emerald-500/40' : userVolume > 0.05 ? 'bg-teal-500/40' : 'bg-emerald-500/20'
                  }`}
              />

              {/* Middle Ring */}
              <motion.div
                layoutId="ai-orb-glow-2"
                className={`absolute w-48 h-48 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors duration-500 ${isAiSpeaking ? 'bg-emerald-400/20' : userVolume > 0.05 ? 'bg-teal-400/20' : 'bg-emerald-400/10'
                  }`}
              >
                {/* Inner Core */}
                <motion.div
                  layoutId="ai-orb-core"
                  className={`w-24 h-24 rounded-full shadow-2xl transition-colors duration-500 ${isAiSpeaking ? 'bg-gradient-to-br from-emerald-300 to-emerald-500' : userVolume > 0.05 ? 'bg-gradient-to-br from-teal-300 to-teal-500' : 'bg-gradient-to-br from-emerald-300/50 to-emerald-500/50'
                    }`}
                />
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Floating Live Process Modal */}
        <AnimatePresence>
          {isBookingAutomated && appointmentDetails && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  {user?.language === 'bn' ? 'অ্যাপয়েন্টমেন্ট বুকিং' : 'Appointment Booking'}
                </h3>
              </div>

              <div className="w-full flex-1 min-h-0 rounded-xl overflow-hidden bg-white">
                <AppointmentInfoWindow
                  details={appointmentDetails}
                  language={user?.language || 'en'}
                  onChange={setAppointmentDetails}
                  onCancel={() => {
                    setIsBookingAutomated(false);
                    setAppointmentDetails(null);

                    if (sessionRef.current) {
                      sessionRef.current.sendClientContent({
                        turns: [{ role: 'user', parts: [{ text: 'I have cancelled the appointment booking.' }] }],
                        turnComplete: true
                      });
                    }
                  }}
                  onConfirm={() => {
                    setToasts(prev => [...prev, {
                      id: Date.now().toString(),
                      type: 'recommendation',
                      title: user?.language === 'bn' ? 'অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে' : 'Appointment Confirmed',
                      message: `Your appointment is confirmed.`
                    }]);
                    setIsBookingAutomated(false);
                    setAppointmentDetails(null);

                    if (sessionRef.current) {
                      sessionRef.current.sendClientContent({
                        turns: [{ role: 'user', parts: [{ text: 'I have confirmed the appointment.' }] }],
                        turnComplete: true
                      });
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Information Request Modal */}
        <AnimatePresence>
          {infoRequest && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl z-40"
            >
              <h3 className="text-xl font-semibold text-white mb-4">{infoRequest.question}</h3>
              <input
                type={infoRequest.inputType === 'date' ? 'date' : infoRequest.inputType === 'number' ? 'number' : 'text'}
                value={infoInputValue}
                onChange={(e) => setInfoInputValue(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-6"
                placeholder="Type your answer here..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (sessionRef.current) {
                      sessionRef.current.sendToolResponse({
                        functionResponses: [{
                          id: infoRequest.id,
                          name: 'requestInformation',
                          response: { result: infoInputValue }
                        }]
                      });
                    }
                    setInfoRequest(null);
                    setInfoInputValue('');
                  }
                }}
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => {
                    if (sessionRef.current) {
                      sessionRef.current.sendToolResponse({
                        functionResponses: [{
                          id: infoRequest.id,
                          name: 'requestInformation',
                          response: { result: 'User cancelled input.' }
                        }]
                      });
                    }
                    setInfoRequest(null);
                    setInfoInputValue('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white border-0"
                  onClick={() => {
                    if (sessionRef.current) {
                      sessionRef.current.sendToolResponse({
                        functionResponses: [{
                          id: infoRequest.id,
                          name: 'requestInformation',
                          response: { result: infoInputValue }
                        }]
                      });
                    }
                    setInfoRequest(null);
                    setInfoInputValue('');
                  }}
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic Subtitles */}
        {isConnected && isCaptionsEnabled && (
          <div className="absolute bottom-32 left-0 right-0 px-8 flex flex-col items-center justify-end pointer-events-none z-20 space-y-2">
            <AnimatePresence>
              {userSubtitle && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-2xl text-center"
                >
                  <p className="text-sm md:text-base text-white/60 font-medium drop-shadow-md">{userSubtitle}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {aiSubtitle && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl text-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5"
                >
                  <p className="text-base md:text-lg text-white font-medium drop-shadow-lg leading-snug">{aiSubtitle}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="h-32 flex items-center justify-center gap-6 pb-8 z-20"
      >
        {isConnected && (
          <>
            <button
              onClick={() => setIsCaptionsEnabled(!isCaptionsEnabled)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 backdrop-blur-md ${isCaptionsEnabled
                  ? 'bg-white/20 text-white border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'bg-black/20 text-white/70 border border-white/10 hover:bg-black/40'
                }`}
            >
              {isCaptionsEnabled ? <MessageSquareText className="w-6 h-6" /> : <MessageSquareOff className="w-6 h-6" />}
            </button>
            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 backdrop-blur-md ${isCameraEnabled
                  ? 'bg-white/20 text-white border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'bg-black/20 text-white/70 border border-white/10 hover:bg-black/40'
                }`}
            >
              {isCameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          </>
        )}
        <button
          onClick={() => { disconnect(); navigate('/dashboard'); }}
          className="w-16 h-16 bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition-transform active:scale-95 border border-red-400/50"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </motion.div>

      {/* Overlay Modal */}
      <AnimatePresence>
        {activeOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 sticky top-0">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  {activeOverlay.type === 'emergency' ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Stethoscope className="w-5 h-5 text-emerald-500" />
                  )}
                  {activeOverlay.title}
                </h3>
                <button
                  onClick={() => setActiveOverlay(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <p className="text-slate-300 mb-6">{activeOverlay.message}</p>

                {activeOverlay.type === 'emergency' && (
                  <div className="space-y-4">
                    <div className="bg-red-950/50 border border-red-900/50 rounded-2xl p-6 text-center">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
                      <h4 className="text-xl font-bold text-white mb-2">
                        {user?.language === 'bn' ? 'অবিলম্বে সাহায্য নিন' : 'Seek Immediate Help'}
                      </h4>
                      <p className="text-red-200 mb-6">
                        {user?.language === 'bn'
                          ? 'অনুগ্রহ করে নিকটস্থ জরুরি কক্ষে যান বা অবিলম্বে আপনার স্থানীয় জরুরি নম্বরে কল করুন।'
                          : 'Please go to the nearest emergency room or call your local emergency number immediately.'}
                      </p>
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg border-0">
                        {user?.language === 'bn' ? 'জরুরী পরিষেবা কল করুন' : 'Call Emergency Services'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hover Window for Recommendations */}
      <AnimatePresence>
        {showHoverWindow && recommendedDoctors.length > 0 && (
          <HoverWindow
            doctors={recommendedDoctors}
            liveTranscript={aiSubtitle}
            language={user?.language || 'en'}
            onClose={() => setShowHoverWindow(false)}
            onSelect={(doctor) => {
              setShowHoverWindow(false);
              setAppointmentDetails({
                doctorName: doctor.name,
                hospital: doctor.hospital,
                patientName: user?.name || '',
                age: user?.profile?.age || '',
                gender: user?.profile?.gender || '',
                bloodType: user?.profile?.bloodType || '',
                symptoms: '',
                date: '',
                time: ''
              });
              setIsBookingAutomated(true);

              // Tell the AI that the user selected a doctor
              if (sessionRef.current) {
                sessionRef.current.sendClientContent({
                  turns: [{ role: 'user', parts: [{ text: `I selected ${doctor.name}. Please help me fill out the appointment details.` }] }],
                  turnComplete: true
                });
              }
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
