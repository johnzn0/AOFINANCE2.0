import { GoogleGenAI } from '@google/genai';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API Key present:", !!apiKey);
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = "Diga um teste simples.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });
    console.log("Response:", response.text);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
