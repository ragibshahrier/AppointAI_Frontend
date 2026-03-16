import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.log("NO API KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

console.log("Attempting Live connect...");
ai.live.connect({
  model: "gemini-2.0-flash-live-001",
  callbacks: {
    onopen: () => {
      console.log("SUCCESSFULLY CONNECTED TO WS!");
      process.exit(0);
    },
    onclose: (e) => {
      console.log("WS CLOSED", e?.code, e?.reason);
      process.exit(1);
    },
    onerror: (e) => {
      console.log("WS ERROR", e);
      process.exit(1);
    }
  }
}).then(session => {
  console.log("SESSION PROMISE RESOLVED");
}).catch(err => {
  console.log("SESSION PROMISE REJECTED", err);
});
