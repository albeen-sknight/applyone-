import type { ApplyOneApplication, ApplyOneJob, ApplyOneProfile, CliOptions } from "./types";
import { createApplication, getApplication, getJob, getProfile } from "./applyone-api";

export type RunData = {
  profile: ApplyOneProfile;
  job: ApplyOneJob;
  application: ApplyOneApplication | null;
  url: string;
};

export async function loadRunData(apiBase: string, options: CliOptions): Promise<RunData> {
  const profile = await getProfile(apiBase);

  if (options.applicationId) {
    const application = await getApplication(apiBase, options.applicationId);
    return { profile, application, job: application.job, url: application.job.url };
  }

  if (options.jobId) {
    const job = await getJob(apiBase, options.jobId);
    const application = await createApplication(apiBase, options.jobId);
    return { profile, application, job, url: job.url };
  }

  if (options.url) {
    return {
      profile,
      application: null,
      url: options.url,
      job: {
        id: "",
        title: "URL directa",
        company: "No indicada",
        platform: "generic",
        url: options.url,
        location: profile.location,
        description_raw: "",
        description_parsed: ""
      }
    };
  }

  throw new Error("Provide --job-id, --application-id, or --url.");
}
