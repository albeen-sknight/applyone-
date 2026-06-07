import type { ApplyOneApplication, ApplyOneJob, ApplyOneProfile } from "./types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => null)) as T | { error?: string } | null;

  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data ? data.error : `HTTP ${response.status}`;
    throw new Error(message || `HTTP ${response.status}`);
  }

  return data as T;
}

export async function getProfile(apiBase: string) {
  return requestJson<ApplyOneProfile>(`${apiBase}/api/profile`);
}

export async function getJob(apiBase: string, jobId: string) {
  return requestJson<ApplyOneJob>(`${apiBase}/api/jobs/${jobId}`);
}

export async function getApplication(apiBase: string, applicationId: string) {
  return requestJson<ApplyOneApplication>(`${apiBase}/api/applications/${applicationId}`);
}

export async function createApplication(apiBase: string, jobId: string) {
  return requestJson<ApplyOneApplication>(`${apiBase}/api/applications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ job_id: jobId, status: "draft" })
  });
}

export async function updateApplication(apiBase: string, applicationId: string, input: { status?: string; notes?: string; auto_applied?: boolean }) {
  return requestJson<ApplyOneApplication>(`${apiBase}/api/applications/${applicationId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function resolveApplication(apiBase: string, jobId?: string, applicationId?: string) {
  if (applicationId) {
    return getApplication(apiBase, applicationId);
  }
  if (jobId) {
    return createApplication(apiBase, jobId);
  }
  return null;
}
