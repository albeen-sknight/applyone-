import { absoluteUrl, cleanText, fetchPublicPage, searchVariants, unavailable, uniqueJobs } from "./common";
import type { ScrapedJob, ScraperResult } from "../types/job";

function parseTecnoempleoCards(html: string) {
  const jobs: ScrapedJob[] = [];
  const cards = html.match(/<article[\s\S]*?<\/article>/gi) || html.match(/<div[^>]+class="[^"]*(?:oferta|job)[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi) || [];

  for (const card of cards) {
    const href = card.match(/href="([^"]*\/oferta-trabajo\/[^"]+)"/i)?.[1] || card.match(/href="([^"]*trabajo[^"]+\.html[^"]*)"/i)?.[1];
    const title = cleanText(card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || "");
    const company = cleanText(card.match(/class="[^"]*(?:empresa|company)[^"]*"[^>]*>([\s\S]*?)</i)?.[1] || "");
    const location = cleanText(card.match(/Madrid[^<]*/i)?.[0] || "Madrid");

    if (href && title) {
      jobs.push({
        title,
        company: company || "Empresa no indicada",
        location: location || "Madrid",
        platform: "tecnoempleo",
        url: absoluteUrl(href, "https://www.tecnoempleo.com"),
        description_raw: cleanText(card),
        description_parsed: `${title} ${company} ${location}`
      });
    }
  }

  return uniqueJobs(jobs).slice(0, 20);
}

export async function scrapeTecnoempleo(): Promise<ScraperResult> {
  try {
    const html = await fetchPublicPage("https://www.tecnoempleo.com/ofertas-trabajo/?te=helpdesk&pr=madrid");
    const jobs = parseTecnoempleoCards(html);

    if (jobs.length === 0) {
      throw new Error("Tecnoempleo public page did not expose parseable job cards.");
    }

    return { platform: "tecnoempleo", jobs };
  } catch (error) {
    return unavailable("tecnoempleo", error);
  }
}

export function tecnoempleoSearchUrls() {
  return searchVariants.map((query) => `https://www.tecnoempleo.com/ofertas-trabajo/?te=${encodeURIComponent(query)}&pr=madrid`);
}
