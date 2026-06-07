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

function valueToText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(valueToText).filter(Boolean).join("; ");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.values(record).map(valueToText).filter(Boolean).join("; ");
  }

  return "";
}

function valueToStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const text = valueToText(item);
      return text ? [text] : [];
    });
  }

  const text = valueToText(value);
  return text ? [text] : [];
}

function objectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => (item && typeof item === "object" ? [item as Record<string, unknown>] : []));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const text = valueToText(item);
    return text ? [text] : [];
  });
}

function splitPair(value: string) {
  const [first, ...rest] = value.split(/\s[-|]\s/);
  return {
    first: first.trim(),
    rest: rest.join(" - ").trim()
  };
}

function pickText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const text = valueToText(record[key]);
    if (text) {
      return text;
    }
  }

  return "";
}

function pickArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const values = valueToStringArray(record[key]);
    if (values.length > 0) {
      return values;
    }
  }

  return [];
}

function hasUsefulCvContent(cv: StructuredCv) {
  return (
    cv.experience.length > 0 ||
    cv.education.length > 0 ||
    cv.skills.length > 0 ||
    cv.certifications.length > 0 ||
    cv.projects.length > 0 ||
    cv.languages.length > 0
  );
}

export function normalizeStructuredCv(value: unknown): StructuredCv | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as Record<string, unknown>;
  const record =
    input.cv && typeof input.cv === "object"
      ? (input.cv as Record<string, unknown>)
      : input.profile && typeof input.profile === "object"
        ? (input.profile as Record<string, unknown>)
        : input;

  const cv: StructuredCv = {
    experience: objectArray(record.experience || record.professional_experience || record.work_experience).map((item) => ({
      company: pickText(item, ["company", "employer", "organization", "name"]),
      role: pickText(item, ["role", "title", "position", "job_title"]),
      location: pickText(item, ["location", "city"]),
      start: pickText(item, ["start", "start_date", "from"]),
      end: pickText(item, ["end", "end_date", "to"]),
      bullets: pickArray(item, ["bullets", "responsibilities", "achievements", "description", "details"])
    })),
    education: objectArray(record.education).map((item) => ({
      institution: pickText(item, ["institution", "school", "university", "center", "name"]),
      degree: pickText(item, ["degree", "qualification", "title", "program"]),
      field: pickText(item, ["field", "area", "specialization", "description"]),
      start: pickText(item, ["start", "start_date", "from"]),
      end: pickText(item, ["end", "end_date", "to"])
    })),
    skills: [
      ...valueToStringArray(record.skills),
      ...valueToStringArray(record.technicalSkills),
      ...valueToStringArray(record.technical_skills),
      ...valueToStringArray(record.personalSkills),
      ...valueToStringArray(record.personal_skills)
    ],
    certifications: objectArray(record.certifications || record.certificates).map((item) => ({
      name: pickText(item, ["name", "certification", "title"]),
      issuer: pickText(item, ["issuer", "provider", "organization", "institution"]),
      date: pickText(item, ["date", "year", "issued", "completed"])
    })),
    projects: objectArray(record.projects || record.featured_projects || record.technical_projects).map((item) => ({
      name: pickText(item, ["name", "title", "project"]),
      description: pickText(item, ["description", "details", "summary", "bullets"])
    })),
    languages: objectArray(record.languages).map((item) => ({
      language: pickText(item, ["language", "name"]),
      level: pickText(item, ["level", "proficiency"])
    }))
  };

  if (cv.certifications.length === 0 && Array.isArray(record.education_certifications)) {
    cv.certifications = objectArray(record.education_certifications).map((item) => ({
      name: pickText(item, ["name", "certification", "title", "degree"]),
      issuer: pickText(item, ["issuer", "provider", "institution", "school"]),
      date: pickText(item, ["date", "year", "end", "completed"])
    }));
  }

  if (cv.education.length === 0) {
    cv.education = stringArray(record.education).map((item) => ({
      institution: item,
      degree: "",
      field: "",
      start: "",
      end: ""
    }));
  }

  if (cv.certifications.length === 0) {
    cv.certifications = stringArray(record.certifications || record.certificates || record.education_certifications).map((item) => ({
      name: item,
      issuer: "",
      date: ""
    }));
  }

  if (cv.languages.length === 0) {
    cv.languages = stringArray(record.languages).map((item) => {
      const parts = splitPair(item);
      return {
        language: parts.first || item,
        level: parts.rest
      };
    });
  }

  cv.skills = Array.from(new Set(cv.skills.filter(Boolean)));
  return hasUsefulCvContent(cv) ? cv : null;
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
