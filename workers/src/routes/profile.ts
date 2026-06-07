import { parseCvWithGemini } from "../ai/gemini";
import type { ApplyOneEnv } from "../env";
import { json } from "../index";
import { emptyStructuredCv, isStructuredCv, type StructuredCv } from "../types/cv";

const OWNER_ID = "owner";

export const ownerProfile = {
  name: "Aboulfazl Saeedi",
  professionalName: "Alberto Saeedi",
  location: "Madrid, Spain",
  workPermit: "Spain long-term",
  phone: "+34 603 226 886",
  email: "albertosaeedi@gmail.com",
  linkedin: "linkedin.com/in/aboulfazl-saeedi-026716225",
  github: "github.com/albeen-sknight",
  languages: ["Spanish: native", "Persian: native", "English: C1"],
  targetRoles: ["Junior SOC Analyst", "CyberSOC", "Junior Cybersecurity", "IT Support", "Helpdesk", "Systems Administration"],
  targetMarket: "Madrid, Spain",
  targetLocations: ["Madrid, Spain"],
  preferredLanguage: "Spanish",
  education: [
    "ASIR, Network Systems Administration - IES Clara del Rey, 2025-2027, ongoing",
    "SMR, Microcomputer Systems and Networks - IES Barajas, 2023-2025"
  ],
  experience: [
    "Deloitte Madrid - Technology Trainee, CyberSOC Track, May 2026",
    "Atento / Securitas Direct Madrid - Customer Support / Call Center, Jul-Sep 2025",
    "Centric, Malta - IT Technician, Mar-May 2025",
    "United Networks, Remote - Volunteer, Training & Account Management, Oct 2022-Jun 2023"
  ],
  technicalSkills: [
    "SIEM",
    "Log analysis",
    "Alert triage",
    "Windows Event Logs",
    "KQL",
    "Elastic Stack",
    "Active Directory",
    "Windows/Linux",
    "Basic GRC",
    "SecOps detection and response"
  ],
  certifications: [
    "SecOps: Detection and Response - LinkedIn Learning, 2026",
    "SIEM Introduction - LinkedIn Learning, 2026",
    "Threat Landscape - LinkedIn Learning, 2026",
    "Basic GRC - LinkedIn Learning, 2026"
  ],
  projects: [
    "Windows Event Log Analysis & Attack Simulation Lab",
    "Windows Event Log Investigation: Auditing Settings Modification",
    "Elastic Stack / KQL - Failed Logon Analysis",
    "SIEM Virtualisation - Failed Logon Attempts, All Users + Disabled Users",
    "Deloitte Final Project - Internal Web App"
  ]
};

type ProfileRow = {
  cv_raw_text: string | null;
  cv_structured: string | null;
  languages_json: string | null;
  target_roles_json: string | null;
  target_locations_json: string | null;
  preferred_language: string | null;
};

type ParseBody = {
  rawText?: unknown;
};

type SaveProfileBody = {
  cv_structured?: unknown;
};

function parseJsonArray(value: string | null, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function parseStoredStructuredCv(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return isStructuredCv(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function ensureProfileTable(env: ApplyOneEnv) {
  await env.applyone_db
    .prepare(
      `CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        location TEXT NOT NULL,
        linkedin_url TEXT NOT NULL,
        github_url TEXT NOT NULL,
        languages_json TEXT NOT NULL DEFAULT '[]',
        target_roles_json TEXT NOT NULL DEFAULT '[]',
        target_locations_json TEXT NOT NULL DEFAULT '[]',
        preferred_language TEXT NOT NULL,
        cv_raw_text TEXT,
        cv_structured TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();

  const table = await env.applyone_db.prepare("PRAGMA table_info(profile)").all<{ name: string }>();
  const columns = new Set((table.results || []).map((column) => column.name));
  const columnDefinitions: Array<[string, string]> = [
    ["linkedin_url", "TEXT NOT NULL DEFAULT ''"],
    ["github_url", "TEXT NOT NULL DEFAULT ''"],
    ["target_locations_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["cv_raw_text", "TEXT"],
    ["cv_structured", "TEXT"]
  ];
  const missingColumns = columnDefinitions.filter(([name]) => !columns.has(name));

  for (const [name, definition] of missingColumns) {
    await env.applyone_db.prepare(`ALTER TABLE profile ADD COLUMN ${name} ${definition}`).run();
  }

  return new Set([...columns, ...missingColumns.map(([name]) => name)]);
}

async function ensureOwnerProfile(env: ApplyOneEnv) {
  const columns = await ensureProfileTable(env);
  const values: Record<string, string> = {
    id: OWNER_ID,
    name: ownerProfile.professionalName,
    professional_name: ownerProfile.professionalName,
    email: ownerProfile.email,
    phone: ownerProfile.phone,
    location: ownerProfile.location,
    work_permit: ownerProfile.workPermit,
    linkedin_url: ownerProfile.linkedin,
    github_url: ownerProfile.github,
    linkedin: ownerProfile.linkedin,
    github: ownerProfile.github,
    languages_json: JSON.stringify(ownerProfile.languages),
    target_roles_json: JSON.stringify(ownerProfile.targetRoles),
    target_locations_json: JSON.stringify(ownerProfile.targetLocations),
    target_market: ownerProfile.targetMarket,
    preferred_language: ownerProfile.preferredLanguage,
    education_json: JSON.stringify(ownerProfile.education),
    experience_json: JSON.stringify(ownerProfile.experience),
    technical_skills_json: JSON.stringify(ownerProfile.technicalSkills),
    certifications_json: JSON.stringify(ownerProfile.certifications),
    projects_json: JSON.stringify(ownerProfile.projects)
  };
  const writableColumns = Object.keys(values).filter((column) => columns.has(column));
  const placeholders = writableColumns.map(() => "?").join(", ");
  const updateColumns = writableColumns.filter((column) => column !== "id");

  await env.applyone_db
    .prepare(
      `INSERT INTO profile (${writableColumns.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET
        ${updateColumns.map((column) => `${column} = excluded.${column}`).join(",\n        ")},
        updated_at = CURRENT_TIMESTAMP`
    )
    .bind(...writableColumns.map((column) => values[column]))
    .run();
}

async function readStoredProfile(env: ApplyOneEnv) {
  await ensureOwnerProfile(env);
  return env.applyone_db
    .prepare(
      `SELECT
        cv_raw_text,
        cv_structured,
        languages_json,
        target_roles_json,
        target_locations_json,
        preferred_language
      FROM profile
      WHERE id = ?`
    )
    .bind(OWNER_ID)
    .first<ProfileRow>();
}

async function saveCv(env: ApplyOneEnv, rawText: string | null, structuredCv: StructuredCv) {
  await ensureOwnerProfile(env);
  await env.applyone_db
    .prepare(
      `UPDATE profile
      SET cv_raw_text = COALESCE(?, cv_raw_text),
        cv_structured = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    )
    .bind(rawText, JSON.stringify(structuredCv), OWNER_ID)
    .run();
}

function buildProfile(row: ProfileRow | null) {
  const storedStructuredCv = parseStoredStructuredCv(row?.cv_structured || null);

  return {
    ...ownerProfile,
    languages: parseJsonArray(row?.languages_json || null, ownerProfile.languages),
    targetRoles: parseJsonArray(row?.target_roles_json || null, ownerProfile.targetRoles),
    targetLocations: parseJsonArray(row?.target_locations_json || null, ownerProfile.targetLocations),
    preferredLanguage: row?.preferred_language || ownerProfile.preferredLanguage,
    cv_raw_text: row?.cv_raw_text || "",
    cv_structured: storedStructuredCv
  };
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function handleProfile(request: Request, env: ApplyOneEnv) {
  if (request.method === "GET") {
    const row = await readStoredProfile(env);
    return json(buildProfile(row));
  }

  if (request.method === "PUT") {
    const body = await readJson<SaveProfileBody>(request);

    if (!body || !isStructuredCv(body.cv_structured)) {
      return json({ error: "El perfil estructurado no es valido." }, { status: 400 });
    }

    await saveCv(env, null, body.cv_structured);
    const row = await readStoredProfile(env);
    return json(buildProfile(row));
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

export async function handleProfileCvParse(request: Request, env: ApplyOneEnv) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await readJson<ParseBody>(request);
  const rawText = typeof body?.rawText === "string" ? body.rawText.trim() : "";

  if (!rawText) {
    return json({ error: "rawText es obligatorio." }, { status: 400 });
  }

  try {
    const structuredCv = await parseCvWithGemini(rawText, env);
    await saveCv(env, rawText, structuredCv);
    return json({ cv_raw_text: rawText, cv_structured: structuredCv });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Error al analizar el CV." }, { status: 400 });
  }
}

export async function handleProfileCv(_request: Request, env: ApplyOneEnv) {
  const row = await readStoredProfile(env);
  return json({
    cv_raw_text: row?.cv_raw_text || "",
    cv_structured: parseStoredStructuredCv(row?.cv_structured || null) || emptyStructuredCv()
  });
}
