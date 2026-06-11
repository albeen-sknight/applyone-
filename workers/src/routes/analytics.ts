import type { ApplyOneEnv } from "../env";
import { json } from "../index";

const publicPaths = new Set(["/", "/self-host", "/cv/Aboulfazl_Saeedi_CV_English.pdf", "/login"]);

type VisitBody = {
  path?: unknown;
  referrer?: unknown;
};

type CountRow = {
  count: number;
};

type NamedCountRow = {
  name: string | null;
  count: number;
};

type DayCountRow = {
  day: string;
  views: number;
};

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function cleanPath(value: unknown) {
  if (typeof value !== "string") return null;

  try {
    const url = value.startsWith("http://") || value.startsWith("https://") ? new URL(value) : new URL(value, "https://applyone.pages.dev");
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return publicPaths.has(pathname) ? pathname : null;
  } catch {
    return null;
  }
}

function referrerOrigin(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

function deviceType(userAgent: string | null) {
  const agent = userAgent?.toLowerCase() || "";
  if (!agent) return "unknown";
  if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|linkedinbot/.test(agent)) return "bot";
  if (/ipad|tablet|kindle|silk/.test(agent)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(agent)) return "mobile";
  if (/windows|macintosh|linux|cros/.test(agent)) return "desktop";
  return "unknown";
}

function requestIp(request: Request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function dailyVisitorHash(request: Request, env: ApplyOneEnv, date: string) {
  if (!env.SESSION_SECRET) return null;

  const ip = requestIp(request);
  const userAgent = request.headers.get("user-agent") || "";
  if (!ip && !userAgent) return null;

  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${date}|${ip}|${userAgent}`));
  return hex(signature);
}

function countryFromRequest(request: Request) {
  const country = request.cf?.country;
  return typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : null;
}

function normalizeRows(rows: NamedCountRow[], fallbackName = "Desconocido") {
  return rows.map((row) => ({
    name: row.name || fallbackName,
    count: row.count
  }));
}

export async function handlePublicVisit(request: Request, env: ApplyOneEnv) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  const body = await readJson<VisitBody>(request);
  const path = cleanPath(body?.path);
  if (!path) {
    return json({ error: "Invalid path." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const day = createdAt.slice(0, 10);

  try {
    await env.applyone_db
      .prepare(
        `INSERT INTO visitor_events (created_at, path, referrer_origin, country, device_type, daily_visitor_hash)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(createdAt, path, referrerOrigin(body?.referrer), countryFromRequest(request), deviceType(request.headers.get("user-agent")), await dailyVisitorHash(request, env, day))
      .run();
  } catch (error) {
    console.warn("Visitor analytics insert failed.", error instanceof Error ? error.message : "Unknown error.");
    return json({ ok: true });
  }

  return json({ ok: true });
}

async function count(env: ApplyOneEnv, query: string) {
  const row = await env.applyone_db.prepare(query).first<CountRow>();
  return Number(row?.count || 0);
}

async function grouped(env: ApplyOneEnv, query: string) {
  const result = await env.applyone_db.prepare(query).all<NamedCountRow>();
  return normalizeRows(result.results || []);
}

async function groupedWithFallback(env: ApplyOneEnv, query: string, fallbackName: string) {
  const result = await env.applyone_db.prepare(query).all<NamedCountRow>();
  return normalizeRows(result.results || [], fallbackName);
}

export async function handleAnalyticsSummary(request: Request, env: ApplyOneEnv) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  const [
    totalViews,
    viewsToday,
    viewsLast7Days,
    viewsLast30Days,
    approximateUniqueToday,
    approximateUniqueLast7Days,
    topPaths,
    topReferrers,
    countries,
    deviceTypes,
    viewsByDayResult
  ] = await Promise.all([
    count(env, "SELECT COUNT(*) AS count FROM visitor_events"),
    count(env, "SELECT COUNT(*) AS count FROM visitor_events WHERE date(created_at) = date('now')"),
    count(env, "SELECT COUNT(*) AS count FROM visitor_events WHERE datetime(created_at) >= datetime('now', '-6 days')"),
    count(env, "SELECT COUNT(*) AS count FROM visitor_events WHERE datetime(created_at) >= datetime('now', '-29 days')"),
    count(env, "SELECT COUNT(DISTINCT daily_visitor_hash) AS count FROM visitor_events WHERE daily_visitor_hash IS NOT NULL AND date(created_at) = date('now')"),
    count(env, "SELECT COUNT(DISTINCT daily_visitor_hash) AS count FROM visitor_events WHERE daily_visitor_hash IS NOT NULL AND datetime(created_at) >= datetime('now', '-6 days')"),
    grouped(env, "SELECT path AS name, COUNT(*) AS count FROM visitor_events GROUP BY path ORDER BY count DESC, path ASC LIMIT 10"),
    groupedWithFallback(env, "SELECT referrer_origin AS name, COUNT(*) AS count FROM visitor_events GROUP BY referrer_origin ORDER BY count DESC LIMIT 10", "Directo"),
    groupedWithFallback(env, "SELECT country AS name, COUNT(*) AS count FROM visitor_events GROUP BY country ORDER BY count DESC LIMIT 10", "Desconocido"),
    grouped(env, "SELECT device_type AS name, COUNT(*) AS count FROM visitor_events GROUP BY device_type ORDER BY count DESC LIMIT 10"),
    env.applyone_db
      .prepare(
        `SELECT date(created_at) AS day, COUNT(*) AS views
         FROM visitor_events
         WHERE datetime(created_at) >= datetime('now', '-29 days')
         GROUP BY date(created_at)
         ORDER BY day ASC`
      )
      .all<DayCountRow>()
  ]);

  return json({
    totalViews,
    viewsToday,
    viewsLast7Days,
    viewsLast30Days,
    approximateUniqueToday,
    approximateUniqueLast7Days,
    topPaths,
    topReferrers,
    viewsByDay: viewsByDayResult.results || [],
    countries,
    deviceTypes
  });
}
