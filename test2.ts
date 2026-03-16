import { GoogleGenAI, Modality, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

async function test() {
  try {
    const session = await ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        outputAudioTranscription: {},
        systemInstruction: `You are Appoint, a helpful, trustworthy, and empathetic healthcare assistant.`,
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
            }
          ]
        }]
      }
    });
    console.log("Connected successfully!");
    session.close();
  } catch (e) {
    console.error("Error connecting:", e.message);
  }
}
test();
