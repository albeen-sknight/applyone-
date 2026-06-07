import { absoluteUrl, cleanText, fetchPublicPage, searchVariants, unavailable, uniqueJobs } from "./common";
import type { ScrapedJob, ScraperResult } from "../types/job";

function parseLinkedInCards(html: string) {
  const jobs: ScrapedJob[] = [];
  const cards = html.match(/<li[\s\S]*?<\/li>/gi) || [];

  for (const card of cards) {
    const href = card.match(/href="([^"]*\/jobs\/view\/[^"]+)"/i)?.[1];
    const title = cleanText(card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || "");
    const company = cleanText(card.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i)?.[1] || "");
    const location = cleanText(card.match(/class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] || "Madrid");

    if (href && title) {
      jobs.push({
        title,
        company: company || "Empresa no indicada",
        location: location || "Madrid",
        platform: "linkedin",
        url: absoluteUrl(href, "https://www.linkedin.com"),
        description_raw: cleanText(card),
        description_parsed: `${title} ${company} ${location}`
      });
    }
  }

  return uniqueJobs(jobs).slice(0, 20);
}

export async function scrapeLinkedInJobs(): Promise<ScraperResult> {
  try {
    const html = await fetchPublicPage("https://es.linkedin.com/jobs/helpdesk-empleos-madrid");
    const jobs = parseLinkedInCards(html);

    if (jobs.length === 0) {
      throw new Error("LinkedIn public page did not expose parseable job cards.");
    }

    return { platform: "linkedin", jobs };
  } catch (error) {
    return unavailable("linkedin", error);
  }
}

export function linkedInSearchUrls() {
  return searchVariants.map((query) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=Madrid%2C%20Comunidad%20de%20Madrid%2C%20Espa%C3%B1a`);
}
