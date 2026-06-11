import { useI18n } from "../lib/i18n";

type CoverLetterPreviewProps = {
  letter: string;
  onClose?: () => void;
};

export default function CoverLetterPreview({ letter, onClose }: CoverLetterPreviewProps) {
  const { t } = useI18n();

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{t("coverLetter.title")}</h3>
        {onClose ? (
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-black/10 px-3 text-sm font-medium">
            {t("common.close")}
          </button>
        ) : null}
      </div>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-6 text-olive">{letter || t("coverLetter.empty")}</pre>
    </section>
  );
}
