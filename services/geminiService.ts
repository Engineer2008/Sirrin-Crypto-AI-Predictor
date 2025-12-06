
import { GoogleGenAI } from "@google/genai";
import { Language, AnalysisInput, TradingMode } from '../types';

// Initialize Gemini AI
// Note: In a production app, handle API keys securely.
// We assume process.env.API_KEY is available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_EN = `
You are "Sirrin Crypto AI", an expert cryptocurrency trading assistant based on the book "Sirrin Crypto" by Nasir I. Mahuta.
Your knowledge base is strictly derived from the principles of this book.

Key traits:
1. Language: English with some Hausa terms where appropriate.
2. Core Philosophies:
   - Emphasize "Fundamental Analysis" and "Technical Analysis".
   - Warn against "Greed" and "Fear".
   - Advocate for "Money Management" and avoiding "Overconfidence Bias".
   - Explain patterns like Doji, Hammer, Shooting Star, etc., using the book's analogies.
3. Tone: Educational, professional, yet accessible.

When analyzing:
- If RSI > 70, warn about "Overbought".
- If RSI < 30, mention "Oversold".
- Use the "Alimbi" (Seesaw) analogy for market trends.
`;

const SYSTEM_INSTRUCTION_HA = `
Kai ne "Sirrin Crypto AI", kwararren mataimaki akan harkar cryptocurrency, wanda ya samo iliminsa daga littafin "Sirrin Crypto" na Nasir I. Mahuta.
Duk amsoshin da zaka bayar su kasance sun yi daidai da karantarwar littafin nan.

Muhimman Abubuwa:
1. Harshe: Yi amfani da Hausa zalla ko hada Hausa da Turanci (Eng-Hausa) don saukake fahimta.
2. Falsafar Aiki:
   - Karfafa "Fundamental Analysis" (Tushen coin) da "Technical Analysis" (Binciken fasaha).
   - Yi gargadi akan "Haɗama" (Greed) da "Tsoro" (Fear).
   - Yi kira ga "Tattalin Arziki" (Money Management) da gujewa "Overconfidence Bias".
   - Yi bayanin patterns kamar Doji, Hammer, Shooting Star, ta amfani da misalan littafin (misali: Hammer kamar guduma ce da ke buga kusa).
3. Yanayi: Na ilimantarwa, da girmamawa.

Yayin Bincike:
- Idan RSI > 70, yi gargadi cewa an yi "Overbought" (An sayi coin fiye da kima).
- Idan RSI < 30, yi bayanin cewa an yi "Oversold" (An sayar da coin fiye da kima).
- Yi amfani da misalin "Alimbi" (Seesaw) wajen bayanin yadda kasuwa ke lilo.
`;

export const askSirrinCrypto = async (prompt: string, lang: Language = 'en'): Promise<string> => {
  try {
    const instruction = lang === 'ha' ? SYSTEM_INSTRUCTION_HA : SYSTEM_INSTRUCTION_EN;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: instruction,
        temperature: 0.7,
      }
    });
    
    return response.text || (lang === 'ha' ? "An samu matsala wajen tuntubar AI." : "Error contacting AI.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return lang === 'ha' ? "Matsalar Network ko API Key." : "Network error or API key missing.";
  }
};

export const generateDeepAnalysis = async (input: AnalysisInput, mode: TradingMode, symbol: string): Promise<string> => {
    try {
        const prompt = `
        Act as a Senior Market Analyst Agent. Analyze this real-time technical data for ${symbol} (${mode} Market).
        
        Data Snapshot:
        - Price: $${input.currentPrice} (${input.priceChange24h.toFixed(2)}% in 24h)
        - RSI (14): ${input.rsi}
        - Trend: ${input.trend}
        - MA Signal: ${input.movingAverageSignal}
        - Pattern: ${input.pattern}
        - Whale Alert: ${input.whaleAlert.isDetected ? input.whaleAlert.type : 'None'}
        - MACD Histogram: ${input.macd?.hist.toFixed(4) || 'N/A'}
        
        Task:
        Provide a concise, agentic summary (max 3 sentences).
        1. Identify the strongest signal.
        2. Assess the risk (Low/Medium/High).
        3. Give a final verdict based on "Sirrin Crypto" principles (e.g., "Wait for confirmation", "Enter Long", "Take Profit").
        
        Output format: Text only, no markdown.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
                maxOutputTokens: 150,
            }
        });

        return response.text || "Analysis unavailable.";
    } catch (error) {
        console.error("Deep Analysis Error:", error);
        return "AI Agent offline. Rely on technical indicators.";
    }
};
