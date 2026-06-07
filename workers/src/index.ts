import { handleApply } from "./routes/apply";
import { handleAuth } from "./routes/auth";
import { handleCoverLetter } from "./routes/coverletter";
import { handleInterview } from "./routes/interview";
import { handleJobs } from "./routes/jobs";
import { handleProfile, handleProfileCv, handleProfileCvParse } from "./routes/profile";
import type { ApplyOneEnv } from "./env";

type RouteHandler = (request: Request, env: ApplyOneEnv) => Response | Promise<Response>;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
  "access-control-allow-headers": "content-type"
};

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init.headers
    }
  });
}

function notFound() {
  return json({ error: "Not found" }, { status: 404 });
}

const routes: Record<string, RouteHandler> = {
  "/api/profile": handleProfile,
  "/api/profile/cv": handleProfileCv,
  "/api/profile/cv/parse": handleProfileCvParse,
  "/api/auth": handleAuth,
  "/api/jobs": handleJobs,
  "/api/apply": handleApply,
  "/api/coverletter": handleCoverLetter,
  "/api/interview": handleInterview
};

export default {
  async fetch(request: Request, env: ApplyOneEnv): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: jsonHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "applyone-worker" });
    }

    const handler = routes[url.pathname];

    if (!handler && url.pathname.startsWith("/api/jobs")) {
      return handleJobs(request, env);
    }

    if (!handler) {
      return notFound();
    }

    return handler(request, env);
  }
};
