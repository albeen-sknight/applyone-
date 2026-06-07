import { ownerProfile } from "../routes/profile";
import type { ApplyOneEnv } from "../env";
import type { ScrapedJob } from "../types/job";
import { isStructuredCv } from "../types/cv";

const primaryRoleKeywords = [
  "it support",
  "support technician",
  "soporte it",
  "soporte informatico",
  "soporte informático",
  "helpdesk",
  "help desk",
  "service desk",
  "sistemas junior",
  "system administrator",
  "sysadmin",
  "administrador de sistemas",
  "network administrator",
  "administrador de redes",
  "tecnico redes",
  "técnico redes"
];

const secondaryRoleKeywords = ["soc", "cybersoc", "cybersecurity", "ciberseguridad", "seguridad"];
const seniorityKeywords = ["junior", "trainee", "becario", "becaria", "practicas", "prácticas", "entry-level", "entry level", "l1", "nivel 1"];
const madridKeywords = ["madrid", "alcobendas", "pozuelo", "las rozas", "getafe", "leganes", "leganés", "san sebastian de los reyes"];
const remoteOnlyKeywords = ["remote only", "remoto 100", "100% remoto", "remoto completo"];
const locationBoostKeywords = ["hibrido", "híbrido", "hybrid", "presencial", "onsite", "on-site"];

const fallbackSkills = [
  ...ownerProfile.technicalSkills,
  "Microsoft 365",
  "Helpdesk",
  "IT support",
  "Troubleshooting",
  "Networking basics",
  "Systems administration",
  "User support",
  "Hardware/software troubleshooting",
  "Ticket handling",
  "Outlook",
  "Teams",
  "OneDrive",
  "SharePoint"
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function containsAny(text: string, keywords: string[]) {
  const normalized = normalize(text);
  return keywords.some((keyword) => normalized.includes(normalize(keyword)));
}

function skillOverlapScore(text: string, skills: string[]) {
  const normalized = normalize(text);
  const uniqueSkills = [...new Set(skills.map((skill) => skill.trim()).filter(Boolean))];

  if (uniqueSkills.length === 0) {
    return 0;
  }

  const matches = uniqueSkills.filter((skill) => normalized.includes(normalize(skill))).length;
  return Math.min(matches / 4, 1);
}

export async function getProfileSkills(env: ApplyOneEnv) {
  const row = await env.applyone_db.prepare("SELECT cv_structured FROM profile WHERE id = ?").bind("owner").first<{ cv_structured: string | null }>();

  if (!row?.cv_structured) {
    return fallbackSkills;
  }

  try {
    const parsed = JSON.parse(row.cv_structured);
    return isStructuredCv(parsed) && parsed.skills.length > 0 ? [...new Set([...parsed.skills, ...fallbackSkills])] : fallbackSkills;
  } catch {
    return fallbackSkills;
  }
}

export function calculateMatchScore(job: ScrapedJob, skills: string[]) {
  const text = [job.title, job.company, job.location, job.description_raw, job.description_parsed || ""].join(" ");
  const titleText = [job.title, job.description_parsed || job.description_raw].join(" ");

  let roleScore = 0;
  if (containsAny(titleText, primaryRoleKeywords)) {
    roleScore = 1;
  } else if (containsAny(titleText, secondaryRoleKeywords)) {
    roleScore = 0.7;
  }

  let locationScore = 0;
  if (containsAny([job.location, job.description_raw].join(" "), madridKeywords)) {
    locationScore = containsAny(text, locationBoostKeywords) ? 1 : 0.85;
  } else if (containsAny(text, remoteOnlyKeywords)) {
    locationScore = 0.25;
  }

  const seniorityScore = containsAny(text, seniorityKeywords) ? 1 : 0.45;
  const skillsScore = skillOverlapScore(text, skills);

  return Number(Math.min(roleScore * 0.4 + locationScore * 0.2 + seniorityScore * 0.2 + skillsScore * 0.2, 1).toFixed(2));
}
