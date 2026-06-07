CREATE TABLE IF NOT EXISTS profile (
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
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  platform TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source TEXT,
  source_url TEXT,
  description_raw TEXT,
  description_parsed TEXT,
  description TEXT,
  match_score REAL NOT NULL DEFAULT 0,
  fit_score INTEGER,
  posted_at TEXT,
  scraped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'new',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  applied_at TEXT,
  cover_letter TEXT,
  cover_letter_used TEXT,
  cv_version_used TEXT,
  form_platform TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  follow_up_date TEXT,
  auto_applied INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interview_sessions (
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
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_application_id ON interview_sessions(application_id);
