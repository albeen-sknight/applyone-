import type { CliOptions } from "./types";

export function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = { confirmSubmit: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--job-id") options.jobId = args[index + 1];
    if (arg === "--application-id") options.applicationId = args[index + 1];
    if (arg === "--url") options.url = args[index + 1];
    if (arg === "--confirm-submit") options.confirmSubmit = true;
    if (!arg.startsWith("--") && /^https?:\/\//i.test(arg)) options.url = arg;
    if (!arg.startsWith("--") && /^file:\/\//i.test(arg)) options.url = arg;
  }

  return options;
}
