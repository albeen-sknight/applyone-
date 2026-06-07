import type { ApplyOneEnv } from "../env";
import { json } from "../index";

export function handleApply(_request: Request, _env: ApplyOneEnv) {
  return json({ status: "placeholder", feature: "Automatizacion de candidaturas pendiente." }, { status: 501 });
}
