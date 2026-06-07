export type JobPlatform = "infojobs" | "linkedin" | "tecnoempleo" | "indeed" | "manual";

export type JobStatus = "new" | "reviewed" | "applied" | "skipped";

export type ScrapedJob = {
  title: string;
  company: string;
  location: string;
  platform: JobPlatform;
  url: string;
  description_raw: string;
  description_parsed?: string;
  posted_at?: string;
};

export type StoredJob = ScrapedJob & {
  id: string;
  match_score: number;
  scraped_at: string;
  status: JobStatus;
};

export type ScraperResult = {
  platform: JobPlatform;
  jobs: ScrapedJob[];
  error?: string;
};
