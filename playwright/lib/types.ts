export type CliOptions = {
  jobId?: string;
  applicationId?: string;
  url?: string;
  confirmSubmit: boolean;
};

export type ApplyOneProfile = {
  name: string;
  professionalName: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  cv_raw_text?: string;
};

export type ApplyOneJob = {
  id: string;
  title: string;
  company: string;
  platform: string;
  url: string;
  location: string;
  description_raw: string;
  description_parsed?: string;
};

export type ApplyOneApplication = {
  id: string;
  job_id: string;
  cover_letter_used: string;
  status: string;
  notes: string;
  job: ApplyOneJob;
};

export type RunSummary = {
  jobId?: string;
  applicationId?: string;
  url: string;
  platform: string;
  mode: "dry-run";
  status: "ready_to_apply" | "manual_required";
  fieldsFilled: string[];
  cvUploaded: boolean;
  stoppedBeforeSubmit: boolean;
  screenshots: string[];
  errors: string[];
};
