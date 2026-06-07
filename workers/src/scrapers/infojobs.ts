import { absoluteUrl, cleanText, fetchPublicPage, searchVariants, unavailable, uniqueJobs } from "./common";
import type { ScrapedJob, ScraperResult } from "../types/job";

function parseInfoJobsCards(html: string) {
  const jobs: ScrapedJob[] = [];
  const cards = html.match(/<article[\s\S]*?<\/article>/gi) || [];

  for (const card of cards) {
    const href = card.match(/href="([^"]*ofertas-trabajo[^"]+)"/i)?.[1] || card.match(/href="([^"]*\/ofertas\/[^"]+)"/i)?.[1];
    const title = cleanText(card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || "");
    const company = cleanText(card.match(/data-testid="company-name"[^>]*>([\s\S]*?)</i)?.[1] || "");
    const location = cleanText(card.match(/Madrid[^<]*/i)?.[0] || "Madrid");

    if (href && title) {
      jobs.push({
        title,
        company: company || "Empresa no indicada",
        location: location || "Madrid",
        platform: "infojobs",
        url: absoluteUrl(href, "https://www.infojobs.net"),
        description_raw: cleanText(card),
        description_parsed: `${title} ${company} ${location}`
      });
    }
  }

  return uniqueJobs(jobs).slice(0, 20);
}

export async function scrapeInfoJobs(): Promise<ScraperResult> {
  try {
    const html = await fetchPublicPage("https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=helpdesk&provinceIds=33");
    const jobs = parseInfoJobsCards(html);

    if (jobs.length === 0) {
      throw new Error("InfoJobs public page did not expose parseable job cards.");
    }

    return { platform: "infojobs", jobs };
  } catch (error) {
    return unavailable("infojobs", error);
  }
}

export function infoJobsSearchUrls() {
  return searchVariants.map((query) => `https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=${encodeURIComponent(query)}&provinceIds=33`);
}
