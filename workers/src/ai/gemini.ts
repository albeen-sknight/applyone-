import { isStructuredCv, type StructuredCv } from "../types/cv";

const CV_PARSER_INSTRUCTION = `You are a CV parser. Extract the following fields from the CV text and return ONLY valid JSON, no markdown, no explanation:
{
  experience: [{company, role, location, start, end, bullets[]}],
  education: [{institution, degree, field, start, end}],
  skills: [],
  certifications: [{name, issuer, date}],
  projects: [{name, description}],
  languages: [{language, level}]
}`;

type GeminiEnv = {
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
};

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
};

function stripJsonFences(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseStructuredCv(text: string): StructuredCv {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch {
    throw new Error("Gemini no devolvio JSON valido.");
  }

  if (!isStructuredCv(parsed)) {
    throw new Error("Gemini devolvio JSON con una estructura no valida.");
  }

  return parsed;
}

export async function parseCvWithGemini(rawText: string, env: GeminiEnv): Promise<StructuredCv> {
  if (env.AI_PROVIDER && env.AI_PROVIDER !== "gemini") {
    throw new Error("Proveedor AI no soportado para Phase 2.");
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error("Falta GEMINI_API_KEY en el entorno del Worker.");
  }

  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: CV_PARSER_INSTRUCTION }]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Raw CV text:\n\n${rawText}`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0
      }
    })
  });

  const data = (await response.json().catch(() => ({}))) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || "Error al llamar a Gemini.");
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();

  if (!text) {
    throw new Error("Gemini no devolvio contenido para analizar.");
  }

  return parseStructuredCv(text);
}
