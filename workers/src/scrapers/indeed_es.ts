import { absoluteUrl, cleanText, fetchPublicPage, searchVariants, unavailable, uniqueJobs } from "./common";
import type { ScrapedJob, ScraperResult } from "../types/job";

function parseIndeedCards(html: string) {
  const jobs: ScrapedJob[] = [];
  const cards = html.match(/<div[^>]+class="[^"]*job_seen_beacon[^"]*"[\s\S]*?<\/table>/gi) || html.match(/<td[^>]*class="[^"]*resultContent[^"]*"[\s\S]*?<\/td>/gi) || [];

  for (const card of cards) {
    const href = card.match(/href="([^"]*(?:\/rc\/clk|\/pagead\/clk|\/viewjob)[^"]+)"/i)?.[1];
    const title = cleanText(card.match(/<span[^>]*title="([^"]+)"/i)?.[1] || card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "");
    const company = cleanText(card.match(/data-testid="company-name"[^>]*>([\s\S]*?)<\/span>/i)?.[1] || card.match(/class="[^"]*companyName[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] || "");
    const location = cleanText(card.match(/data-testid="text-location"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "Madrid");

    if (href && title) {
      jobs.push({
        title,
        company: company || "Empresa no indicada",
        location: location || "Madrid",
        platform: "indeed",
        url: absoluteUrl(href, "https://es.indeed.com"),
        description_raw: cleanText(card),
        description_parsed: `${title} ${company} ${location}`
      });
    }
  }

  return uniqueJobs(jobs).slice(0, 20);
}

export async function scrapeIndeedEs(): Promise<ScraperResult> {
  try {
    const html = await fetchPublicPage("https://es.indeed.com/jobs?q=helpdesk&l=Madrid%2C+Madrid");
    const jobs = parseIndeedCards(html);

    if (jobs.length === 0) {
      throw new Error("Indeed public page did not expose parseable job cards.");
    }

    return { platform: "indeed", jobs };
  } catch (error) {
    return unavailable("indeed", error);
  }
}

export function indeedSearchUrls() {
  return searchVariants.map((query) => `https://es.indeed.com/jobs?q=${encodeURIComponent(query)}&l=Madrid%2C%20Madrid`);
}
