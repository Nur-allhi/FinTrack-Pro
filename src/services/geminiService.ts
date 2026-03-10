import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const categorizeTransaction = async (particulars: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a single financial category and a very short summary (max 5 words) for this transaction: "${particulars}". Support both English and Bengali.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["category", "summary"],
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Categorization failed:", error);
    return { category: "Uncategorized", summary: particulars };
  }
};

export const getFinancialInsights = async (data: any) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this financial data and provide 3-5 key insights, highlighting patterns, anomalies, and suggestions. Data: ${JSON.stringify(data)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["insights"],
        },
      },
    });
    return JSON.parse(response.text).insights;
  } catch (error) {
    console.error("AI Insights failed:", error);
    return ["Unable to generate insights at this time."];
  }
};
