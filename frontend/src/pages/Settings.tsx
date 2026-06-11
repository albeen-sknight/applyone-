import { getLinkedInStatus, linkedInCallbackUrl } from "../lib/linkedin";
import { useI18n, type TranslationKey } from "../lib/i18n";

const settingRows: Array<[TranslationKey, string | TranslationKey]> = [
  ["settings.minimumVisibleScore", "0.5"],
  ["settings.autoApplyThreshold", "settings.autoApplyValue"],
  ["settings.mainTargetFamily", "IT Support / Helpdesk / Service Desk"],
  ["settings.secondaryTargetFamily", "Junior Cybersecurity / SOC"],
  ["settings.location", "Madrid"],
  ["settings.locationTypes", "On-site / Hybrid"],
  ["settings.employmentTypes", "Full-time / Part-time"]
];

export default function Settings() {
  const { t } = useI18n();
  const linkedIn = getLinkedInStatus();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-copper">{t("settings.kicker")}</p>
        <h2 className="mt-1 text-3xl font-semibold">{t("settings.title")}</h2>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">Job Feed</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {settingRows.map(([labelKey, value]) => (
            <div key={labelKey} className="rounded-md bg-black/[0.03] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-copper">{t(labelKey)}</p>
              <p className="mt-1 text-sm text-olive">{value.startsWith("settings.") ? t(value as TranslationKey) : value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">LinkedIn OAuth</h3>
        <p className="mt-2 text-sm text-olive">{linkedIn.message}</p>
        <p className="mt-3 break-all text-sm text-olive">
          {t("settings.futureCallback")}: {linkedInCallbackUrl}
        </p>
        <p className="mt-3 text-sm font-medium text-copper">
          {t("settings.configured")}: {linkedIn.configured ? t("common.yes") : t("common.no")}
        </p>
      </section>
    </div>
  );
}
