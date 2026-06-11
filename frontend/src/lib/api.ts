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

export type JobStatus = "new" | "reviewed" | "applied" | "skipped";

export type JobPlatform = "infojobs" | "linkedin" | "tecnoempleo" | "indeed" | "manual";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  platform: JobPlatform;
  url: string;
  description_raw: string;
  description_parsed?: string;
  match_score: number;
  posted_at?: string;
  scraped_at: string;
  status: JobStatus;
};

export type ApplicationStatus = "draft" | "ready_to_apply" | "manual_required" | "applied" | "viewed" | "interview" | "offer" | "rejected" | "no_reply";

export type Application = {
  id: string;
  job_id: string;
  applied_at: string | null;
  cover_letter_used: string;
  cv_version_used: string;
  form_platform: string;
  status: ApplicationStatus;
  notes: string;
  follow_up_date: string;
  auto_applied: boolean;
  created_at: string;
  updated_at: string;
  job: {
    id: string;
    title: string;
    company: string;
    platform: string;
    url: string;
    location: string;
    description_raw: string;
    description_parsed: string;
    match_score: number;
  };
};

export type ApplicationStats = {
  totalApplications: number;
  responseRate: number;
  interviewsScheduled: number;
  thisWeekApplications: number;
};

export type InterviewMode = "hr" | "technical";
export type InterviewLanguage = "es" | "en";

export type InterviewMessage = {
  role: "assistant" | "user" | "system";
  content: string;
  feedback?: string;
};

export type InterviewSessionSummary = {
  id: string;
  mode: InterviewMode;
  language: InterviewLanguage;
  started_at: string;
  ended_at: string | null;
  overall_score: number | null;
  overall_feedback: string;
  created_at: string;
  updated_at: string;
};

export type InterviewSession = InterviewSessionSummary & {
  transcript: InterviewMessage[];
};

export type ScrapeSummary = {
  platforms: Array<{ platform: JobPlatform; found: number; status: "ok" | "error"; error?: string }>;
  inserted: number;
  updated: number;
  skippedDuplicates: number;
  errors: Array<{ platform: JobPlatform; error: string }>;
};

export type AnalyticsSummary = {
  totalViews: number;
  viewsToday: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  approximateUniqueToday: number;
  approximateUniqueLast7Days: number;
  topPaths: Array<{ name: string; count: number }>;
  topReferrers: Array<{ name: string; count: number }>;
  viewsByDay: Array<{ day: string; views: number }>;
  countries: Array<{ name: string; count: number }>;
  deviceTypes: Array<{ name: string; count: number }>;
};

export type JobFilters = {
  platform?: string;
  status?: string;
  minScore?: string;
  q?: string;
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


const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers
  });
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | { error?: string } | null;

  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data ? data.error : null;
    throw new Error(message || "Error de API.");
  }

  return data as T;
}

export async function getSession(): Promise<{ authenticated: boolean }> {
  const response = await apiFetch("/api/auth/session");
  return parseJsonResponse<{ authenticated: boolean }>(response);
}

export async function login(password: string): Promise<{ authenticated: boolean }> {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ password })
  });
  return parseJsonResponse<{ authenticated: boolean }>(response);
}

export async function logout(): Promise<{ authenticated: boolean }> {
  const response = await apiFetch("/api/auth/logout", { method: "POST" });
  return parseJsonResponse<{ authenticated: boolean }>(response);
}

export function recordPublicVisit(input: { path: string; referrer: string }) {
  const body = JSON.stringify(input);
  const url = apiUrl("/api/public/visit");

  try {
    if ("sendBeacon" in navigator) {
      const sent = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (sent) return;
    }

    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      credentials: "omit",
      keepalive: true
    }).catch(() => null);
  } catch {
    // Public analytics is intentionally best-effort.
  }
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await apiFetch("/api/analytics/summary");
  return parseJsonResponse<AnalyticsSummary>(response);
}

export async function getProfile(): Promise<OwnerProfile> {
  const response = await apiFetch("/api/profile");
  return parseJsonResponse<OwnerProfile>(response);
}

export async function parseCv(rawText: string): Promise<{ cv_raw_text: string; cv_structured: StructuredCv }> {
  const response = await apiFetch("/api/profile/cv/parse", {
    method: "POST",
    body: JSON.stringify({ rawText })
  });

  return parseJsonResponse<{ cv_raw_text: string; cv_structured: StructuredCv }>(response);
}

export async function saveStructuredCv(cv: StructuredCv): Promise<OwnerProfile> {
  const response = await apiFetch("/api/profile", {
    method: "PUT",
    body: JSON.stringify({ cv_structured: cv })
  });

  return parseJsonResponse<OwnerProfile>(response);
}

export async function getJobs(filters: JobFilters = {}): Promise<{ jobs: Job[] }> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const response = await apiFetch(`/api/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  return parseJsonResponse<{ jobs: Job[] }>(response);
}

export async function scrapeJobs(): Promise<ScrapeSummary> {
  const response = await apiFetch("/api/jobs/scrape", { method: "POST" });
  return parseJsonResponse<ScrapeSummary>(response);
}

export async function updateJobStatus(id: string, status: JobStatus): Promise<Job> {
  const response = await apiFetch(`/api/jobs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });

  return parseJsonResponse<Job>(response);
}

export async function getApplications(filters: { status?: string; platform?: string; q?: string } = {}): Promise<{ applications: Application[] }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const response = await apiFetch(`/api/applications${params.toString() ? `?${params.toString()}` : ""}`);
  return parseJsonResponse<{ applications: Application[] }>(response);
}

export async function getApplicationStats(): Promise<ApplicationStats> {
  const response = await apiFetch("/api/applications/stats");
  return parseJsonResponse<ApplicationStats>(response);
}

export async function createApplicationDraft(input: { job_id: string; status?: ApplicationStatus; notes?: string }): Promise<Application> {
  const response = await apiFetch("/api/applications", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return parseJsonResponse<Application>(response);
}

export async function generateCoverLetter(jobId: string): Promise<{ cover_letter: string; application_id: string; warning?: string }> {
  const response = await apiFetch("/api/applications/generate-cover-letter", {
    method: "POST",
    body: JSON.stringify({ job_id: jobId })
  });
  return parseJsonResponse<{ cover_letter: string; application_id: string; warning?: string }>(response);
}

export async function updateApplication(id: string, input: Partial<Pick<Application, "cover_letter_used" | "status" | "notes" | "follow_up_date" | "form_platform" | "cv_version_used" | "auto_applied">>): Promise<Application> {
  const response = await apiFetch(`/api/applications/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
  return parseJsonResponse<Application>(response);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<Application> {
  const response = await apiFetch(`/api/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  return parseJsonResponse<Application>(response);
}

export async function markApplicationApplied(id: string): Promise<Application> {
  const response = await apiFetch(`/api/applications/${id}/mark-applied`, { method: "POST" });
  return parseJsonResponse<Application>(response);
}

export async function getInterviewSessions(): Promise<{ sessions: InterviewSessionSummary[] }> {
  const response = await apiFetch("/api/interview/sessions");
  return parseJsonResponse<{ sessions: InterviewSessionSummary[] }>(response);
}

export async function getInterviewSession(id: string): Promise<InterviewSession> {
  const response = await apiFetch(`/api/interview/sessions/${id}`);
  return parseJsonResponse<InterviewSession>(response);
}

export async function startInterviewSession(input: { mode: InterviewMode; language: InterviewLanguage }): Promise<{ session: InterviewSession; assistantMessage: InterviewMessage }> {
  const response = await apiFetch("/api/interview/sessions", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return parseJsonResponse<{ session: InterviewSession; assistantMessage: InterviewMessage }>(response);
}

export async function sendInterviewMessage(id: string, content: string): Promise<{ session: InterviewSession; assistantMessage: InterviewMessage }> {
  const response = await apiFetch(`/api/interview/sessions/${id}/message`, {
    method: "POST",
    body: JSON.stringify({ content })
  });
  return parseJsonResponse<{ session: InterviewSession; assistantMessage: InterviewMessage }>(response);
}

export async function endInterviewSession(id: string): Promise<{ session: InterviewSession }> {
  const response = await apiFetch(`/api/interview/sessions/${id}/end`, { method: "POST" });
  return parseJsonResponse<{ session: InterviewSession }>(response);
}
