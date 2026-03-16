import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
console.log("API Key:", !!(process.env.GEMINI_API_KEY || process.env.API_KEY));

async function test() {
  try {
    const session = await ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      config: {
        responseModalities: ["AUDIO"],
      }
    });
    console.log("Connected 09-2025!");
    session.close();
  } catch (e) {
    console.error("Error connecting 09-2025:", e.message);
  }
  
  try {
    const session = await ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      config: {
        responseModalities: ["AUDIO"],
      }
    });
    console.log("Connected 12-2025!");
    session.close();
  } catch (e) {
    console.error("Error connecting 12-2025:", e.message);
  }
  
  try {
    const session = await ai.live.connect({
      model: "gemini-2.0-flash-exp",
      config: {
        responseModalities: ["AUDIO"],
      }
    });
    console.log("Connected 2.0-flash-exp!");
    session.close();
  } catch (e) {
    console.error("Error connecting 2.0-flash-exp:", e.message);
  }
}
test();
