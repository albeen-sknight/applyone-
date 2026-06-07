export type StructuredCv = {
  experience: Array<{
    company: string;
    role: string;
    location: string;
    start: string;
    end: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    start: string;
    end: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
  }>;
  languages: Array<{
    language: string;
    level: string;
  }>;
};

export function emptyStructuredCv(): StructuredCv {
  return {
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: []
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function hasStringFields(value: unknown, fields: string[]) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return fields.every((field) => isString(record[field]));
}

export function isStructuredCv(value: unknown): value is StructuredCv {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    Array.isArray(record.experience) &&
    record.experience.every(
      (item) => hasStringFields(item, ["company", "role", "location", "start", "end"]) && isStringArray((item as { bullets?: unknown }).bullets)
    ) &&
    Array.isArray(record.education) &&
    record.education.every((item) => hasStringFields(item, ["institution", "degree", "field", "start", "end"])) &&
    isStringArray(record.skills) &&
    Array.isArray(record.certifications) &&
    record.certifications.every((item) => hasStringFields(item, ["name", "issuer", "date"])) &&
    Array.isArray(record.projects) &&
    record.projects.every((item) => hasStringFields(item, ["name", "description"])) &&
    Array.isArray(record.languages) &&
    record.languages.every((item) => hasStringFields(item, ["language", "level"]))
  );
}
