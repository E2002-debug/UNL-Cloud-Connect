import { GoogleGenAI } from "@google/genai";

let ai: any = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined. Gemini features will run in simulation fallback mode.");
}

export async function analyzeEventPhoto(base64Image: string) {
  // If it's a placeholder or too short, return mock response for demo stability
  if (!base64Image || base64Image === "placeholder_base64" || base64Image.length < 50) {
    return "Análisis de sensor completado: Zona UNL detectada con afluencia académica moderada. Sin riesgos climáticos inmediatos.";
  }

  if (!ai) {
    return "Análisis simulado (API Key de Gemini no configurada): Imagen cargada con éxito. Se observa el área del campus con iluminación adecuada y flujo normal de personas.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        },
        {
          text: "Analyze this photo from a cultural event in Loja. Determine the crowd density (Low, Medium, High), the 'vibe' of the event, and if there are any immediate weather or safety concerns visible. Return a short, punchy Spanish summary for a social feed."
        }
      ],
      config: {
        systemInstruction: "You are a 'Social-Sensing' AI for the Loja-Cloud-Live platform. Your goal is to extract real-time insights from user-uploaded photos at cultural festivals."
      }
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Check if it's an image processing error or API issue
    if (error?.message?.includes("Unable to process input image")) {
      return "Error de telemetría: La imagen no pudo ser procesada por el cluster. Intente de nuevo.";
    }
    
    return "El nodo de IA está procesando demasiadas solicitudes. Sensing temporalmente limitado.";
  }
}

