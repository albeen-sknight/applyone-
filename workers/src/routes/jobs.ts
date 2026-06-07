import type { ApplyOneEnv } from "../env";
import { json } from "../index";

export function handleJobs(_request: Request, _env: ApplyOneEnv) {
  return json({ jobs: [], status: "placeholder" });
}
