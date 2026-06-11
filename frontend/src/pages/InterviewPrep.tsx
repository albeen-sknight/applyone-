import InterviewChat from "../components/InterviewChat";
import { useI18n } from "../lib/i18n";

export default function InterviewPrep() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-copper">{t("interviews.kicker")}</p>
        <h2 className="mt-1 text-3xl font-semibold">{t("interviews.title")}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-olive">{t("interviews.description")}</p>
      </section>
      <InterviewChat />
    </div>
  );
}
