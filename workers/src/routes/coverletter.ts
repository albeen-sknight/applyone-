import type { ApplyOneEnv } from "../env";
import { json } from "../index";

export function handleCoverLetter(_request: Request, _env: ApplyOneEnv) {
  return json({ status: "placeholder", feature: "Generacion de cartas pendiente." }, { status: 501 });
}
