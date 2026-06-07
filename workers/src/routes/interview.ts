import type { ApplyOneEnv } from "../env";
import { json } from "../index";

export function handleInterview(_request: Request, _env: ApplyOneEnv) {
  return json({ status: "placeholder", feature: "Preparacion de entrevistas pendiente." }, { status: 501 });
}
