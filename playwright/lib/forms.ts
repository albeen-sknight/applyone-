import { existsSync } from "node:fs";
import type { Page } from "playwright";
import { humanDelay } from "./delays";
import type { ApplyOneApplication, ApplyOneProfile } from "./types";

type FillResult = {
  fieldsFilled: string[];
  cvUploaded: boolean;
};

const fieldMatchers: Array<{ field: string; patterns: RegExp[]; value: (profile: ApplyOneProfile, application: ApplyOneApplication | null) => string }> = [
  { field: "full name", patterns: [/full.*name/i, /nombre.*completo/i, /^name$/i, /^nombre$/i], value: (profile) => profile.professionalName || profile.name },
  { field: "first name", patterns: [/first.*name/i, /nombre/i], value: (profile) => (profile.name || "").split(" ")[0] || profile.professionalName },
  { field: "last name", patterns: [/last.*name/i, /surname/i, /apellido/i], value: (profile) => (profile.name || "").split(" ").slice(1).join(" ") },
  { field: "email", patterns: [/email/i, /correo/i], value: (profile) => profile.email },
  { field: "phone", patterns: [/phone/i, /tel[eé]fono/i, /mobile/i], value: (profile) => profile.phone },
  { field: "location", patterns: [/location/i, /ubicaci[oó]n/i, /city/i, /ciudad/i], value: (profile) => profile.location },
  { field: "linkedin", patterns: [/linkedin/i], value: (profile) => profile.linkedin },
  { field: "github", patterns: [/github/i], value: (profile) => profile.github },
  { field: "cover letter", patterns: [/cover.*letter/i, /carta/i, /presentaci[oó]n/i], value: (_profile, application) => application?.cover_letter_used || "" }
];

async function fillByLocator(page: Page, label: RegExp, value: string) {
  if (!value) return false;
  const locators = [page.getByLabel(label), page.getByPlaceholder(label), page.locator(`input[name*="${label.source}" i]`), page.locator(`textarea[name*="${label.source}" i]`)];

  for (const locator of locators) {
    try {
      if ((await locator.count()) > 0) {
        await locator.first().fill(value, { timeout: 1500 });
        await humanDelay();
        return true;
      }
    } catch {
      // Try the next matching strategy.
    }
  }

  return false;
}

export async function fillSafeFields(page: Page, profile: ApplyOneProfile, application: ApplyOneApplication | null, cvPath: string): Promise<FillResult> {
  const fieldsFilled: string[] = [];

  for (const matcher of fieldMatchers) {
    for (const pattern of matcher.patterns) {
      if (await fillByLocator(page, pattern, matcher.value(profile, application))) {
        fieldsFilled.push(matcher.field);
        break;
      }
    }
  }

  let cvUploaded = false;
  const fileInputs = page.locator('input[type="file"]');
  if (!cvPath) {
    console.log("No APPLYONE_CV_PATH configured; skipping CV upload.");
  } else if (!existsSync(cvPath)) {
    console.log(`Configured APPLYONE_CV_PATH does not exist; skipping CV upload: ${cvPath}`);
  } else if ((await fileInputs.count()) > 0) {
    await fileInputs.first().setInputFiles(cvPath);
    cvUploaded = true;
    fieldsFilled.push("cv upload");
    await humanDelay();
  }

  return { fieldsFilled, cvUploaded };
}

export async function detectPlatform(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes("infojobs")) return "infojobs";
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("greenhouse")) return "greenhouse";
  if (lower.includes("lever.co")) return "lever";
  if (lower.includes("workday") || lower.includes("myworkdayjobs")) return "workday";
  return "generic";
}
