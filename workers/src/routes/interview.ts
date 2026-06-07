import {
  generateInterviewReplyWithGemini,
  summarizeInterviewWithGemini,
  type InterviewLanguage,
  type InterviewMode,
  type InterviewTranscriptMessage
} from "../ai/gemini";
import type { ApplyOneEnv } from "../env";
import { json } from "../index";

type InterviewRow = {
  id: string;
  mode: InterviewMode;
  language: InterviewLanguage;
  started_at: string | null;
  ended_at: string | null;
  transcript: string | null;
  transcript_json: string | null;
  overall_score: number | null;
  overall_feedback: string | null;
  created_at: string;
  updated_at: string;
};

const modes = new Set<InterviewMode>(["hr", "technical"]);
const languages = new Set<InterviewLanguage>(["es", "en"]);

function isMode(value: unknown): value is InterviewMode {
  return typeof value === "string" && modes.has(value as InterviewMode);
}

function isLanguage(value: unknown): value is InterviewLanguage {
  return typeof value === "string" && languages.has(value as InterviewLanguage);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ensureInterviewTable(env: ApplyOneEnv) {
  await env.applyone_db
    .prepare(
      `CREATE TABLE IF NOT EXISTS interview_sessions (
        id TEXT PRIMARY KEY,
        application_id TEXT,
        mode TEXT NOT NULL DEFAULT 'hr',
        language TEXT NOT NULL DEFAULT 'es',
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TEXT,
        role TEXT,
        company TEXT,
        transcript TEXT NOT NULL DEFAULT '[]',
        transcript_json TEXT NOT NULL DEFAULT '[]',
        overall_score INTEGER,
        overall_feedback TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();

  const table = await env.applyone_db.prepare("PRAGMA table_info(interview_sessions)").all<{ name: string }>();
  const columns = new Set((table.results || []).map((column) => column.name));
  const columnDefinitions: Array<[string, string]> = [
    ["mode", "TEXT NOT NULL DEFAULT 'hr'"],
    ["language", "TEXT NOT NULL DEFAULT 'es'"],
    ["started_at", "TEXT"],
    ["ended_at", "TEXT"],
    ["transcript", "TEXT NOT NULL DEFAULT '[]'"],
    ["overall_score", "INTEGER"],
    ["overall_feedback", "TEXT"]
  ];

  for (const [name, definition] of columnDefinitions) {
    if (!columns.has(name)) {
      await env.applyone_db.prepare(`ALTER TABLE interview_sessions ADD COLUMN ${name} ${definition}`).run();
    }
  }

  await env.applyone_db.prepare("CREATE INDEX IF NOT EXISTS idx_interview_sessions_started_at ON interview_sessions(started_at)").run();
}

function parseTranscript(row: Pick<InterviewRow, "transcript" | "transcript_json">): InterviewTranscriptMessage[] {
  const raw = row.transcript || row.transcript_json || "[]";

  try {
    const parsed = JSON.parse(raw) as InterviewTranscriptMessage[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (message) =>
            message &&
            (message.role === "assistant" || message.role === "user" || message.role === "system") &&
            typeof message.content === "string"
        )
      : [];
  } catch {
    return [];
  }
}

function mapSession(row: InterviewRow, includeTranscript = false) {
  const session = {
    id: row.id,
    mode: row.mode,
    language: row.language,
    started_at: row.started_at || row.created_at,
    ended_at: row.ended_at,
    overall_score: row.overall_score,
    overall_feedback: row.overall_feedback || "",
    created_at: row.created_at,
    updated_at: row.updated_at
  };

  return includeTranscript ? { ...session, transcript: parseTranscript(row) } : session;
}

async function getSessionRow(env: ApplyOneEnv, id: string) {
  return env.applyone_db.prepare("SELECT * FROM interview_sessions WHERE id = ?").bind(id).first<InterviewRow>();
}

async function saveTranscript(env: ApplyOneEnv, id: string, transcript: InterviewTranscriptMessage[]) {
  const serialized = JSON.stringify(transcript);
  await env.applyone_db
    .prepare("UPDATE interview_sessions SET transcript = ?, transcript_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(serialized, serialized, id)
    .run();
}

async function listSessions(env: ApplyOneEnv) {
  await ensureInterviewTable(env);
  const result = await env.applyone_db
    .prepare(
      `SELECT id, mode, language, started_at, ended_at, transcript, transcript_json, overall_score, overall_feedback, created_at, updated_at
       FROM interview_sessions
       ORDER BY COALESCE(started_at, created_at) DESC`
    )
    .all<InterviewRow>();

  return json({ sessions: (result.results || []).map((row) => mapSession(row)) });
}

async function getSession(env: ApplyOneEnv, id: string) {
  await ensureInterviewTable(env);
  const row = await getSessionRow(env, id);
  return row ? json(mapSession(row, true)) : json({ error: "Interview session not found" }, { status: 404 });
}

async function startSession(request: Request, env: ApplyOneEnv) {
  await ensureInterviewTable(env);
  const body = (await request.json().catch(() => null)) as { mode?: unknown; language?: unknown } | null;

  if (!isMode(body?.mode)) {
    return json({ error: "Invalid interview mode" }, { status: 400 });
  }

  if (!isLanguage(body?.language)) {
    return json({ error: "Invalid interview language" }, { status: 400 });
  }

  try {
    const firstReply = await generateInterviewReplyWithGemini({
      mode: body.mode,
      language: body.language,
      transcript: [],
      env
    });
    const id = await sha256(`${body.mode}:${body.language}:${Date.now()}:${crypto.randomUUID()}`);
    const transcript: InterviewTranscriptMessage[] = [{ role: "assistant", content: firstReply.content, feedback: firstReply.feedback }];
    const serialized = JSON.stringify(transcript);

    await env.applyone_db
      .prepare(
        `INSERT INTO interview_sessions (id, mode, language, transcript, transcript_json, started_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, body.mode, body.language, serialized, serialized, new Date().toISOString())
      .run();

    const row = await getSessionRow(env, id);
    return json({ session: row ? mapSession(row, true) : null, assistantMessage: transcript[0] });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "No se pudo iniciar la entrevista." }, { status: 400 });
  }
}

async function sendMessage(request: Request, env: ApplyOneEnv, id: string) {
  await ensureInterviewTable(env);
  const row = await getSessionRow(env, id);

  if (!row) {
    return json({ error: "Interview session not found" }, { status: 404 });
  }

  if (row.ended_at) {
    return json({ error: "La sesion ya esta finalizada." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { content?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!content) {
    return json({ error: "La respuesta no puede estar vacia." }, { status: 400 });
  }

  const transcript = parseTranscript(row);
  transcript.push({ role: "user", content });

  try {
    const reply = await generateInterviewReplyWithGemini({
      mode: row.mode,
      language: row.language,
      transcript,
      env
    });
    const assistantMessage: InterviewTranscriptMessage = { role: "assistant", content: reply.content, feedback: reply.feedback };
    transcript.push(assistantMessage);
    await saveTranscript(env, id, transcript);

    const updated = await getSessionRow(env, id);
    return json({ session: updated ? mapSession(updated, true) : null, assistantMessage });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "No se pudo continuar la entrevista." }, { status: 400 });
  }
}

async function endSession(env: ApplyOneEnv, id: string) {
  await ensureInterviewTable(env);
  const row = await getSessionRow(env, id);

  if (!row) {
    return json({ error: "Interview session not found" }, { status: 404 });
  }

  if (row.ended_at) {
    return json({ session: mapSession(row, true) });
  }

  const transcript = parseTranscript(row);

  try {
    const summary = await summarizeInterviewWithGemini({
      mode: row.mode,
      language: row.language,
      transcript,
      env
    });

    await env.applyone_db
      .prepare(
        `UPDATE interview_sessions
         SET ended_at = ?, overall_score = ?, overall_feedback = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(new Date().toISOString(), summary.overall_score, summary.overall_feedback, id)
      .run();
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "No se pudo finalizar la entrevista." }, { status: 400 });
  }

  const updated = await getSessionRow(env, id);
  return json({ session: updated ? mapSession(updated, true) : null });
}

async function deleteSession(env: ApplyOneEnv, id: string) {
  await ensureInterviewTable(env);
  await env.applyone_db.prepare("DELETE FROM interview_sessions WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

export async function handleInterview(request: Request, env: ApplyOneEnv) {
  const url = new URL(request.url);
  const detailMatch = url.pathname.match(/^\/api\/interview\/sessions\/([^/]+)$/);
  const messageMatch = url.pathname.match(/^\/api\/interview\/sessions\/([^/]+)\/message$/);
  const endMatch = url.pathname.match(/^\/api\/interview\/sessions\/([^/]+)\/end$/);

  if (request.method === "GET" && url.pathname === "/api/interview/sessions") return listSessions(env);
  if (request.method === "POST" && url.pathname === "/api/interview/sessions") return startSession(request, env);
  if (request.method === "GET" && detailMatch) return getSession(env, detailMatch[1]);
  if (request.method === "POST" && messageMatch) return sendMessage(request, env, messageMatch[1]);
  if (request.method === "POST" && endMatch) return endSession(env, endMatch[1]);
  if (request.method === "DELETE" && detailMatch) return deleteSession(env, detailMatch[1]);

  return json({ error: "Not found" }, { status: 404 });
}
