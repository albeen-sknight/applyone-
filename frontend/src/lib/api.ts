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

export type OwnerProfile = {
  name: string;
  professionalName: string;
  location: string;
  workPermit: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  languages: string[];
  targetRoles: string[];
  targetLocations: string[];
  targetMarket: string;
  preferredLanguage: string;
  education: string[];
  experience: string[];
  technicalSkills: string[];
  certifications: string[];
  projects: string[];
  cv_raw_text: string;
  cv_structured: StructuredCv | null;
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

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | { error?: string } | null;

  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data ? data.error : null;
    throw new Error(message || "Error de API.");
  }

  return data as T;
}

export async function getProfile(): Promise<OwnerProfile> {
  const response = await fetch("/api/profile");
  return parseJsonResponse<OwnerProfile>(response);
}

export async function parseCv(rawText: string): Promise<{ cv_raw_text: string; cv_structured: StructuredCv }> {
  const response = await fetch("/api/profile/cv/parse", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rawText })
  });

  return parseJsonResponse<{ cv_raw_text: string; cv_structured: StructuredCv }>(response);
}

export async function saveStructuredCv(cv: StructuredCv): Promise<OwnerProfile> {
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cv_structured: cv })
  });

  return parseJsonResponse<OwnerProfile>(response);
}
