import type { ApplyOneEnv } from "../env";
import { json } from "../index";

export function handleAuth(_request: Request, _env: ApplyOneEnv) {
  return json({ status: "placeholder", feature: "LinkedIn OAuth se implementara en una fase posterior." }, { status: 501 });
}
