import type { ApplyOneEnv } from "../env";
import { json } from "../index";
import { clearSessionCookie, createSessionCookie, hasValidSession, passwordMatches } from "../lib/auth";

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function handleAuth(request: Request, env: ApplyOneEnv) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/auth/session") {
    return json({ authenticated: await hasValidSession(request, env) });
  }

  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJson<{ password?: unknown }>(request);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!password) {
      return json({ error: "Password is required." }, { status: 400 });
    }

    try {
      if (!(await passwordMatches(password, env))) {
        return json({ error: "Invalid password." }, { status: 401 });
      }

      return json(
        { authenticated: true },
        {
          headers: {
            "set-cookie": await createSessionCookie(env, request)
          }
        }
      );
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Authentication is not configured." }, { status: 503 });
    }
  }

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    return json(
      { authenticated: false },
      {
        headers: {
          "set-cookie": clearSessionCookie(request)
        }
      }
    );
  }

  return json({ error: "Not found" }, { status: 404 });
}
