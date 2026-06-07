import { useEffect, useMemo, useState } from "react";
import { getJobs, scrapeJobs, updateJobStatus, type Job, type JobFilters, type ScrapeSummary } from "../lib/api";

const platforms = [
  { value: "", label: "Todas" },
  { value: "infojobs", label: "InfoJobs" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tecnoempleo", label: "Tecnoempleo" },
  { value: "indeed", label: "Indeed" },
  { value: "manual", label: "Manual" }
];

const statuses = [
  { value: "", label: "No omitidas" },
  { value: "new", label: "Nuevas" },
  { value: "reviewed", label: "Revisadas" },
  { value: "applied", label: "Aplicadas" },
  { value: "skipped", label: "Omitidas" }
];

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}

function statusLabel(status: Job["status"]) {
  return {
    new: "Nueva",
    reviewed: "Revisada",
    applied: "Aplicada",
    skipped: "Omitida"
  }[status];
}

function JobCard({ job, onStatusChange }: { job: Job; onStatusChange: (id: string, status: Job["status"]) => void }) {
  const description = job.description_parsed || job.description_raw || "Sin descripción disponible.";

  return (
    <article className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-skyglass px-2 py-1 text-xs font-semibold uppercase text-ink">{job.platform}</span>
            <span className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium text-olive">{statusLabel(job.status)}</span>
            <span className="rounded-md bg-copper px-2 py-1 text-xs font-semibold text-white">{formatScore(job.match_score)}</span>
          </div>
          <h3 className="mt-3 text-xl font-semibold">{job.title}</h3>
          <p className="mt-1 text-sm font-medium text-olive">{job.company}</p>
          <p className="mt-1 text-sm text-olive">{job.location}</p>
        </div>
        <a href={job.url} target="_blank" rel="noreferrer" className="h-10 rounded-md border border-black/10 px-3 py-2 text-center text-sm font-semibold text-ink hover:bg-black/[0.04]">
          Ver original
        </a>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-olive">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onStatusChange(job.id, "reviewed")} className="h-9 rounded-md bg-ink px-3 text-sm font-medium text-white">
          Marcar como revisada
        </button>
        <button type="button" onClick={() => onStatusChange(job.id, "skipped")} className="h-9 rounded-md bg-black/[0.06] px-3 text-sm font-medium text-ink">
          Omitir
        </button>
        <details className="w-full rounded-md border border-black/10 bg-black/[0.02] p-3">
          <summary className="cursor-pointer text-sm font-semibold">Ver detalles</summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-olive">{description}</p>
        </details>
      </div>
    </article>
  );
}

export default function JobFeed() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<JobFilters>({ minScore: "0.5" });
  const [summary, setSummary] = useState<ScrapeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformErrors = useMemo(() => summary?.errors || [], [summary]);

  async function loadJobs(nextFilters = filters) {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getJobs(nextFilters);
      setJobs(data.jobs);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron cargar las ofertas.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadJobs();
  }, []);

  async function handleFilterChange(nextFilters: JobFilters) {
    setFilters(nextFilters);
    await loadJobs(nextFilters);
  }

  async function handleScrape() {
    setIsScraping(true);
    setError(null);
    setSummary(null);

    try {
      const result = await scrapeJobs();
      setSummary(result);
      await loadJobs(filters);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo buscar nuevas ofertas.");
    } finally {
      setIsScraping(false);
    }
  }

  async function handleStatusChange(id: string, status: Job["status"]) {
    try {
      await updateJobStatus(id, status);
      await loadJobs(filters);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo actualizar el estado.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-copper">Job Feed</p>
          <h2 className="mt-1 text-3xl font-semibold">Ofertas recomendadas</h2>
        </div>
        <button
          type="button"
          onClick={handleScrape}
          disabled={isScraping}
          className="h-11 rounded-md bg-copper px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isScraping ? "Buscando..." : "Buscar nuevas ofertas"}
        </button>
      </section>

      <section className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-sm md:grid-cols-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive">Platform</span>
          <select
            value={filters.platform || ""}
            onChange={(event) => void handleFilterChange({ ...filters, platform: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm"
          >
            {platforms.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive">Status</span>
          <select
            value={filters.status || ""}
            onChange={(event) => void handleFilterChange({ ...filters, status: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive">Minimum match score</span>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={filters.minScore || "0.5"}
            onChange={(event) => void handleFilterChange({ ...filters, minScore: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-olive">Search text</span>
          <input
            value={filters.q || ""}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            onBlur={() => void loadJobs(filters)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void loadJobs(filters);
              }
            }}
            className="mt-1 h-10 w-full rounded-md border border-black/10 bg-white px-3 text-sm"
          />
        </label>
      </section>

      {summary ? (
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-ink">
            Resultado: {summary.inserted} insertadas, {summary.updated} actualizadas, {summary.skippedDuplicates} duplicadas omitidas.
          </p>
          {platformErrors.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-red-800">
              {platformErrors.map((item) => (
                <li key={item.platform}>
                  {item.platform}: {item.error}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}

      {isLoading ? <p className="rounded-lg bg-white p-4 text-sm text-olive">Cargando ofertas...</p> : null}

      <section className="space-y-4">
        {!isLoading && jobs.length === 0 ? (
          <p className="rounded-lg bg-white p-5 text-sm text-olive">No hay ofertas por encima del umbral actual.</p>
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} />)
        )}
      </section>
    </div>
  );
}
