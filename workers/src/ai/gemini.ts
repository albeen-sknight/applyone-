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

export type InterviewMode = "hr" | "technical";
export type InterviewLanguage = "es" | "en";
export type InterviewTranscriptMessage = {
  role: "assistant" | "user" | "system";
  content: string;
  feedback?: string;
};

const COVER_LETTER_INSTRUCTION = `You are a professional Spanish career writer. Write cover letters in formal but warm Spanish. Be concise, maximum 3 paragraphs. Never fabricate experience. Match keywords from the job description naturally. The candidate is applying for junior IT support, helpdesk, service desk, junior system administrator, junior network administrator, or junior cybersecurity/SOC roles in Madrid. Emphasize practical support skills, troubleshooting, Microsoft 365, Windows, user support, ticket handling, systems/network administration studies, and growing cybersecurity knowledge where relevant.`;

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

async function generateGeminiText(systemInstruction: string, userMessage: string, env: GeminiEnv) {
  if (env.AI_PROVIDER && env.AI_PROVIDER !== "gemini") {
    throw new Error("Proveedor AI no soportado.");
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
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 900
      }
    })
  });
  const data = (await response.json().catch(() => ({}))) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || "Error al llamar a Gemini.");
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();

  if (!text) {
    throw new Error("Gemini no devolvio una carta valida.");
  }

  return stripJsonFences(text);
}

function languageName(language: InterviewLanguage) {
  return language === "es" ? "Spanish" : "English";
}

function interviewInstruction(mode: InterviewMode, language: InterviewLanguage) {
  const spokenLanguage = languageName(language);

  if (mode === "hr") {
    return `You are a Spanish HR recruiter at a mid-size Madrid tech company. You are conducting a first-round screening call for a junior IT/cybersecurity position. Speak in ${spokenLanguage}. Ask one question at a time. After each candidate answer, give brief internal feedback in brackets [FEEDBACK: ...] then ask the next question. Be realistic and push back gently if answers are vague.

Candidate background:
- Name: Aboulfazl Saeedi
- Goes by Alberto in professional contexts
- Based in Madrid
- Studying ASIR at IES Clara del Rey
- Completed SMR at IES Barajas
- Experience: Deloitte CyberSOC trainee, IT Technician in Malta, call center/customer support at Atento/Securitas Direct, remote volunteer/training/account management at United Networks
- Target now: IT Support, Helpdesk, Service Desk, Junior System Administrator, Junior Network Administrator roles in Madrid
- Longer-term target: Junior SOC Analyst / Cybersecurity
- Work permit: Spain long-term
- Languages: Spanish native, Persian native, English C1
- Style: enthusiastic, proactive, teachable, respectful of processes and hierarchy, good at de-escalating users, organized, methodical, calm under pressure once familiar with the process

Question flow:
1. Presentation / tell me about yourself
2. Why IT support / helpdesk / systems administration now
3. Why cybersecurity as a longer-term path
4. Why this company
5. Availability and salary expectation
6. Strength and area to improve
7. Pressure or conflict situation, using Atento/Securitas Direct experience
8. Managing studies and work at the same time
9. Closing: questions for me

Ask one question at a time. Do not ask all questions at once. Keep it realistic and useful.`;
  }

  return `You are a senior SOC analyst conducting a technical interview for a junior SOC analyst or junior IT/security support position in Madrid. Speak in ${spokenLanguage}. Ask one question at a time. After each answer give [FEEDBACK: technical accuracy, what was missing, ideal answer]. Be rigorous but fair for a junior level.

Candidate's known technical areas:
- Windows Event Log analysis and attack simulation
- SIEM theory and basic hands-on practice
- Elastic Stack
- KQL queries for failed logon detection
- Alert triage concepts
- Active Directory basics
- Windows/Linux basics
- Microsoft 365 support
- Helpdesk/user support
- Ticket handling
- SecOps detection and response
- Basic GRC
- Built a web app for Deloitte final project

Question bank, rotate and do not repeat:
- Walk me through investigating 300 failed logons for a disabled user at 3am.
- What Windows Event IDs do you look for in a brute force scenario?
- What is the difference between a SIEM alert and a confirmed incident?
- How do you reduce false positives in a SIEM rule?
- Explain KQL and write a query to find failed logons in the last hour.
- A user cannot access Outlook. How do you troubleshoot?
- A user says their account is locked. What do you check?
- A laptop is slow after login. What steps do you take?
- A user cannot connect to a shared folder. What do you investigate?
- Explain how you would escalate an issue to L2/L3.
- Explain DNS in simple terms.
- What is DHCP?
- What is the difference between a local account and a domain account?
- What is Active Directory used for?
- What would you check if a user cannot reach an internal website?
- What is lateral movement and how would you detect it?
- Explain the kill chain and where a SOC analyst operates in it.
- What is the difference between IDS and IPS?
- What does a SOC L1 analyst do vs L2?
- What would you do in your first 30 days as a junior SOC analyst?
- You receive 40 alerts at shift start. How do you prioritize?
- An endpoint suddenly starts communicating with an external IP at 2am. Steps?
- Tell me about your Windows Event Log Attack Simulation Lab.
- What did you learn from the disabled user failed logon SIEM lab?
- How did you use KQL in your Elastic Stack project?
- What was your Deloitte final project and what was your role?

Do not repeat questions in the same session. Keep feedback practical and junior-level.`;
}

function transcriptForPrompt(transcript: InterviewTranscriptMessage[]) {
  if (transcript.length === 0) {
    return "No previous messages.";
  }

  return transcript
    .map((message, index) => {
      const feedback = message.feedback ? `\nFeedback: ${message.feedback}` : "";
      return `${index + 1}. ${message.role.toUpperCase()}: ${message.content}${feedback}`;
    })
    .join("\n\n");
}

export function splitInterviewFeedback(text: string): { content: string; feedback?: string } {
  const match = text.match(/\[FEEDBACK:\s*([\s\S]*?)\]\s*/i);
  if (!match) {
    return { content: text.trim() };
  }

  const content = text.replace(match[0], "").trim();
  return {
    content: content || text.trim(),
    feedback: match[1].trim()
  };
}

export async function generateInterviewReplyWithGemini(input: {
  mode: InterviewMode;
  language: InterviewLanguage;
  transcript: InterviewTranscriptMessage[];
  env: GeminiEnv;
}) {
  const isFirstQuestion = input.transcript.length === 0;
  const userMessage = isFirstQuestion
    ? "Start the interview now. Ask only the first question. Do not include feedback yet."
    : `Continue the interview from this transcript. Give feedback on the latest candidate answer in [FEEDBACK: ...], then ask exactly one next question.\n\nTranscript:\n${transcriptForPrompt(input.transcript)}`;

  const text = await generateGeminiText(interviewInstruction(input.mode, input.language), userMessage, input.env);
  return splitInterviewFeedback(text);
}

export async function summarizeInterviewWithGemini(input: {
  mode: InterviewMode;
  language: InterviewLanguage;
  transcript: InterviewTranscriptMessage[];
  env: GeminiEnv;
}) {
  const text = await generateGeminiText(
    `${interviewInstruction(input.mode, input.language)}

You are ending the session. Return ONLY valid JSON with this shape:
{"overall_score": number from 1 to 10, "overall_feedback": "brief practical feedback"}
Do not include markdown.`,
    `Evaluate this interview transcript:\n\n${transcriptForPrompt(input.transcript)}`,
    input.env
  );

  try {
    const parsed = JSON.parse(stripJsonFences(text)) as { overall_score?: unknown; overall_feedback?: unknown };
    return {
      overall_score: Math.max(1, Math.min(10, Number(parsed.overall_score) || 5)),
      overall_feedback: typeof parsed.overall_feedback === "string" ? parsed.overall_feedback : text
    };
  } catch {
    return {
      overall_score: 5,
      overall_feedback: text
    };
  }
}

export async function generateCoverLetterWithGemini(input: {
  profile: unknown;
  job: unknown;
  env: GeminiEnv;
}) {
  const userMessage = `Candidate structured profile/CV from D1:
${JSON.stringify(input.profile, null, 2)}

Job details:
${JSON.stringify(input.job, null, 2)}

Write only the cover letter text. No subject line. No markdown. No fake experience. If the job posting is clearly in English, generate in English; otherwise Spanish.`;

  return generateGeminiText(COVER_LETTER_INSTRUCTION, userMessage, input.env);
}
