import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { emptyStructuredCv, getProfile, parseCv, saveStructuredCv, type OwnerProfile, type StructuredCv } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { extractPdfText } from "../lib/pdf";

type CvStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-copper">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-olive">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-olive">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm outline-none focus:border-copper" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-olive">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-1 w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-copper" />
    </label>
  );
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function StructuredCvEditor({ value, onChange }: { value: StructuredCv; onChange: (value: StructuredCv) => void }) {
  const { t } = useI18n();
  const update = <K extends keyof StructuredCv>(key: K, nextValue: StructuredCv[K]) => onChange({ ...value, [key]: nextValue });

  return (
    <div className="space-y-4">
      <SectionShell title={t("profile.experience")}>
        {value.experience.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-md bg-black/[0.03] p-3 md:grid-cols-2">
            <Field label={t("profile.company")} value={item.company} onChange={(company) => update("experience", value.experience.map((entry, i) => (i === index ? { ...entry, company } : entry)))} />
            <Field label={t("profile.role")} value={item.role} onChange={(role) => update("experience", value.experience.map((entry, i) => (i === index ? { ...entry, role } : entry)))} />
            <Field label={t("profile.location")} value={item.location} onChange={(location) => update("experience", value.experience.map((entry, i) => (i === index ? { ...entry, location } : entry)))} />
            <Field label={t("profile.start")} value={item.start} onChange={(start) => update("experience", value.experience.map((entry, i) => (i === index ? { ...entry, start } : entry)))} />
            <Field label={t("profile.end")} value={item.end} onChange={(end) => update("experience", value.experience.map((entry, i) => (i === index ? { ...entry, end } : entry)))} />
            <TextArea
              label={t("profile.bullets")}
              value={item.bullets.join("\n")}
              onChange={(bullets) => update("experience", value.experience.map((entry, i) => (i === index ? { ...entry, bullets: bullets.split("\n").filter(Boolean) } : entry)))}
            />
          </div>
        ))}
        <button type="button" onClick={() => update("experience", [...value.experience, { company: "", role: "", location: "", start: "", end: "", bullets: [] }])} className="h-10 rounded-md bg-ink px-3 text-sm font-medium text-white">
          {t("profile.addExperience")}
        </button>
      </SectionShell>

      <SectionShell title={t("profile.education")}>
        {value.education.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-md bg-black/[0.03] p-3 md:grid-cols-2">
            <Field label={t("profile.institution")} value={item.institution} onChange={(institution) => update("education", value.education.map((entry, i) => (i === index ? { ...entry, institution } : entry)))} />
            <Field label={t("profile.degree")} value={item.degree} onChange={(degree) => update("education", value.education.map((entry, i) => (i === index ? { ...entry, degree } : entry)))} />
            <Field label={t("profile.field")} value={item.field} onChange={(field) => update("education", value.education.map((entry, i) => (i === index ? { ...entry, field } : entry)))} />
            <Field label={t("profile.start")} value={item.start} onChange={(start) => update("education", value.education.map((entry, i) => (i === index ? { ...entry, start } : entry)))} />
            <Field label={t("profile.end")} value={item.end} onChange={(end) => update("education", value.education.map((entry, i) => (i === index ? { ...entry, end } : entry)))} />
          </div>
        ))}
        <button type="button" onClick={() => update("education", [...value.education, { institution: "", degree: "", field: "", start: "", end: "" }])} className="h-10 rounded-md bg-ink px-3 text-sm font-medium text-white">
          {t("profile.addEducation")}
        </button>
      </SectionShell>

      <SectionShell title={t("profile.skills")}>
        <TextArea label={t("profile.skills")} value={value.skills.join("\n")} onChange={(skills) => update("skills", skills.split("\n").filter(Boolean))} />
      </SectionShell>

      <SectionShell title={t("profile.certifications")}>
        {value.certifications.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-md bg-black/[0.03] p-3 md:grid-cols-3">
            <Field label={t("profile.name")} value={item.name} onChange={(name) => update("certifications", value.certifications.map((entry, i) => (i === index ? { ...entry, name } : entry)))} />
            <Field label={t("profile.issuer")} value={item.issuer} onChange={(issuer) => update("certifications", value.certifications.map((entry, i) => (i === index ? { ...entry, issuer } : entry)))} />
            <Field label={t("profile.date")} value={item.date} onChange={(date) => update("certifications", value.certifications.map((entry, i) => (i === index ? { ...entry, date } : entry)))} />
          </div>
        ))}
        <button type="button" onClick={() => update("certifications", [...value.certifications, { name: "", issuer: "", date: "" }])} className="h-10 rounded-md bg-ink px-3 text-sm font-medium text-white">
          {t("profile.addCertification")}
        </button>
      </SectionShell>

      <SectionShell title={t("profile.projects")}>
        {value.projects.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-md bg-black/[0.03] p-3 md:grid-cols-2">
            <Field label={t("profile.name")} value={item.name} onChange={(name) => update("projects", value.projects.map((entry, i) => (i === index ? { ...entry, name } : entry)))} />
            <TextArea label={t("profile.description")} value={item.description} onChange={(description) => update("projects", value.projects.map((entry, i) => (i === index ? { ...entry, description } : entry)))} />
          </div>
        ))}
        <button type="button" onClick={() => update("projects", [...value.projects, { name: "", description: "" }])} className="h-10 rounded-md bg-ink px-3 text-sm font-medium text-white">
          {t("profile.addProject")}
        </button>
      </SectionShell>

      <SectionShell title={t("profile.languages")}>
        {value.languages.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-md bg-black/[0.03] p-3 md:grid-cols-2">
            <Field label={t("profile.language")} value={item.language} onChange={(language) => update("languages", value.languages.map((entry, i) => (i === index ? { ...entry, language } : entry)))} />
            <Field label={t("profile.level")} value={item.level} onChange={(level) => update("languages", value.languages.map((entry, i) => (i === index ? { ...entry, level } : entry)))} />
          </div>
        ))}
        <button type="button" onClick={() => update("languages", [...value.languages, { language: "", level: "" }])} className="h-10 rounded-md bg-ink px-3 text-sm font-medium text-white">
          {t("profile.addLanguage")}
        </button>
      </SectionShell>
    </div>
  );
}

export default function Profile() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [structuredCv, setStructuredCv] = useState<StructuredCv>(emptyStructuredCv());
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CvStatus>({ type: "idle", message: "" });

  useEffect(() => {
    getProfile()
      .then((nextProfile) => {
        setProfile(nextProfile);
        setRawText(nextProfile.cv_raw_text || "");
        setStructuredCv(nextProfile.cv_structured || emptyStructuredCv());
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : t("profile.unknownError"));
      });
  }, [t]);

  const hasParsedCv = useMemo(
    () =>
      structuredCv.experience.length > 0 ||
      structuredCv.education.length > 0 ||
      structuredCv.skills.length > 0 ||
      structuredCv.certifications.length > 0 ||
      structuredCv.projects.length > 0 ||
      structuredCv.languages.length > 0,
    [structuredCv]
  );

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] || null);
    setStatus({ type: "idle", message: "" });
  }

  async function handleParseCv() {
    setStatus({ type: "idle", message: "" });

    if (!selectedFile) {
      setStatus({ type: "error", message: t("profile.selectPdf") });
      return;
    }

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ type: "error", message: t("profile.pdfOnly") });
      return;
    }

    setIsWorking(true);

    try {
      const extracted = await extractPdfText(selectedFile);

      if (!extracted) {
        throw new Error(t("profile.extractError"));
      }

      setRawText(extracted);
      const result = await parseCv(extracted);
      setStructuredCv(result.cv_structured);
      setProfile((current) => (current ? { ...current, cv_raw_text: result.cv_raw_text, cv_structured: result.cv_structured } : current));
      setStatus({ type: "success", message: t("profile.parseSuccess") });
    } catch (reason) {
      setStatus({ type: "error", message: reason instanceof Error ? reason.message : t("profile.parseError") });
    } finally {
      setIsWorking(false);
    }
  }

  async function handleSave() {
    setIsWorking(true);
    setStatus({ type: "idle", message: "" });

    try {
      const updated = await saveStructuredCv(structuredCv);
      setProfile(updated);
      setRawText(updated.cv_raw_text || rawText);
      setStructuredCv(updated.cv_structured || structuredCv);
      setStatus({ type: "success", message: t("profile.saveSuccess") });
    } catch (reason) {
      setStatus({ type: "error", message: reason instanceof Error ? reason.message : t("profile.saveError") });
    } finally {
      setIsWorking(false);
    }
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  }

  if (!profile) {
    return <p className="rounded-lg bg-white p-4 text-sm text-olive">{t("profile.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/10">
        <p className="text-sm font-medium text-copper">{profile.name}</p>
        <h2 className="mt-1 text-3xl font-semibold">{profile.professionalName}</h2>
        <div className="mt-4 grid gap-3 text-sm text-olive sm:grid-cols-2 lg:grid-cols-3">
          <span>{profile.location}</span>
          <span>{profile.workPermit}</span>
          <span>{profile.email}</span>
          <span>{profile.phone}</span>
          <span>{profile.linkedin}</span>
          <span>{profile.github}</span>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-copper">{t("profile.uploadCv")}</p>
            <h3 className="mt-1 text-xl font-semibold">{t("profile.extractCv")}</h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="max-w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm" />
            <button type="button" onClick={handleParseCv} disabled={isWorking} className="h-10 rounded-md bg-copper px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {isWorking ? t("profile.analyzing") : t("profile.extractCv")}
            </button>
          </div>
        </div>

        {status.message ? (
          <p className={`mt-4 rounded-md p-3 text-sm ${status.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
            {status.type === "error" ? `${t("profile.parseError")}: ` : ""}
            {status.message}
          </p>
        ) : null}

        <details className="mt-5 rounded-md border border-black/10 bg-black/[0.02] p-4" open={Boolean(rawText)}>
          <summary className="cursor-pointer text-sm font-semibold">{t("profile.extractedText")}</summary>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-sm leading-6 text-olive">{rawText || t("profile.noExtractedText")}</pre>
        </details>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ListBlock title={t("profile.targetRoles")} items={profile.targetRoles} />
        <ListBlock title={t("profile.defaultLanguages")} items={profile.languages} />
        <ListBlock title={t("profile.defaultEducation")} items={profile.education} />
        <ListBlock title={t("profile.defaultExperience")} items={profile.experience} />
        <ListBlock title={t("profile.defaultSkills")} items={profile.technicalSkills} />
        <ListBlock title={t("profile.defaultCertifications")} items={profile.certifications} />
        <ListBlock title={t("profile.defaultProjects")} items={profile.projects} />
        <section className="rounded-lg border border-black/10 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-copper">{t("profile.preferences")}</h3>
          <p className="mt-3 text-sm leading-6 text-olive">
            {t("profile.market")}: {profile.targetMarket}
          </p>
          <p className="mt-1 text-sm leading-6 text-olive">
            {t("profile.preferredLanguage")}: {profile.preferredLanguage}
          </p>
        </section>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-copper">{t("profile.structuredProfile")}</p>
            <h3 className="mt-1 text-2xl font-semibold">{hasParsedCv ? t("profile.editableParsedCv") : t("profile.noParsedCv")}</h3>
          </div>
          <button type="button" onClick={handleSave} disabled={isWorking} className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {t("profile.saveChanges")}
          </button>
        </div>

        <StructuredCvEditor value={structuredCv} onChange={setStructuredCv} />

        <details className="rounded-lg border border-black/10 bg-white p-5">
          <summary className="cursor-pointer text-sm font-semibold text-copper">{t("profile.jsonView")}</summary>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-olive">{JSON.stringify(structuredCv, null, 2)}</pre>
        </details>
      </section>
    </div>
  );
}
