import { handleApply } from "./routes/apply";
import { handleApplications } from "./routes/applications";
import { handleAuth } from "./routes/auth";
import { handleCoverLetter } from "./routes/coverletter";
import { handleInterview } from "./routes/interview";
import { handleJobs } from "./routes/jobs";
import { handleProfile, handleProfileCv, handleProfileCvParse } from "./routes/profile";
import type { ApplyOneEnv } from "./env";
import { hasValidSession } from "./lib/auth";

type RouteHandler = (request: Request, env: ApplyOneEnv) => Response | Promise<Response>;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8"
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

function allowedOrigins(env: ApplyOneEnv) {
  const configured = env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) || [];
  return configured.length > 0 ? configured : ["http://127.0.0.1:5173", "http://localhost:5173"];
}

function corsHeaders(request: Request, env: ApplyOneEnv) {
  const origin = request.headers.get("origin") || "";
  const headers = new Headers({
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-allow-credentials": "true",
    vary: "Origin"
  });

  if (origin && allowedOrigins(env).includes(origin)) {
    headers.set("access-control-allow-origin", origin);
  }

  return headers;
}

function withCors(response: Response, request: Request, env: ApplyOneEnv) {
  const headers = new Headers(response.headers);
  corsHeaders(request, env).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function isPublicApi(pathname: string) {
  return pathname === "/api/auth/login" || pathname === "/api/auth/logout" || pathname === "/api/auth/session";
}

const routes: Record<string, RouteHandler> = {
  "/api/profile": handleProfile,
  "/api/profile/cv": handleProfileCv,
  "/api/profile/cv/parse": handleProfileCvParse,
  "/api/auth": handleAuth,
  "/api/auth/login": handleAuth,
  "/api/auth/logout": handleAuth,
  "/api/auth/session": handleAuth,
  "/api/jobs": handleJobs,
  "/api/apply": handleApply,
  "/api/coverletter": handleCoverLetter,
  "/api/interview": handleInterview
};

export default {
  async fetch(request: Request, env: ApplyOneEnv): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return withCors(json({ ok: true, service: "applyone-worker" }), request, env);
    }

    if (url.pathname.startsWith("/api/") && !isPublicApi(url.pathname) && !(await hasValidSession(request, env))) {
      return withCors(json({ error: "Authentication required." }, { status: 401 }), request, env);
    }

    const handler = routes[url.pathname];

    if (!handler && url.pathname.startsWith("/api/jobs")) {
      return withCors(await handleJobs(request, env), request, env);
    }

    if (!handler && url.pathname.startsWith("/api/applications")) {
      return withCors(await handleApplications(request, env), request, env);
    }

    if (!handler && url.pathname.startsWith("/api/interview")) {
      return withCors(await handleInterview(request, env), request, env);
    }

    if (!handler) {
      return withCors(notFound(), request, env);
    }

    return withCors(await handler(request, env), request, env);
  }
};
