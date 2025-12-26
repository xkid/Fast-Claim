
import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeReceipt(base64Image: string): Promise<{ amount: number; categorySuggestion: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Clean the base64 string
  const data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Extract the total amount and suggest one of these categories: Handphone, Petrol, Toll, Parking Fee, Car Maintenance, Outstation Allowance, Travelling & Accomodation, Transportation, Staff Welfare, Entertainment, OT Claim, Medical, Misc. Return ONLY JSON." },
            { inlineData: { mimeType: "image/jpeg", data: data } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            categorySuggestion: { type: Type.STRING }
          },
          required: ["amount", "categorySuggestion"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      amount: result.amount || 0,
      categorySuggestion: result.categorySuggestion || "Misc"
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { amount: 0, categorySuggestion: "Misc" };
  }
}
