import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import ApplicationCard from "../components/ApplicationCard";
import CoverLetterPreview from "../components/CoverLetterPreview";
import { getApplicationStats, getApplications, markApplicationApplied, updateApplication, updateApplicationStatus, type Application, type ApplicationStatus, type ApplicationStats } from "../lib/api";

const statusLabels: Record<ApplicationStatus, string> = {
  draft: "Borrador",
  ready_to_apply: "Lista para aplicar",
  manual_required: "Requiere aplicación manual",
  applied: "Aplicada",
  viewed: "Vista",
  interview: "Entrevista",
  offer: "Oferta",
  rejected: "Rechazada",
  no_reply: "Sin respuesta"
};

const statusOptions = Object.entries(statusLabels) as Array<[ApplicationStatus, string]>;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({ totalApplications: 0, responseRate: 0, interviewsScheduled: 0, thisWeekApplications: 0 });
  const [selectedLetter, setSelectedLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadDashboard() {
    setError(null);
    try {
      const [appsResult, statsResult] = await Promise.all([getApplications(), getApplicationStats()]);
      setApplications(appsResult.applications);
      setStats(statsResult);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cargar el dashboard.");
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function changeStatus(id: string, status: ApplicationStatus) {
    await updateApplicationStatus(id, status);
    await loadDashboard();
  }

  async function markApplied(id: string) {
    await markApplicationApplied(id);
    await loadDashboard();
    setSuccess("Aplicación marcada como aplicada manualmente.");
  }

  async function addNote(application: Application) {
    const note = window.prompt("Añadir nota", application.notes || "");
    if (note === null) return;
    await updateApplication(application.id, { notes: note });
    await loadDashboard();
  }

  async function setFollowUp(application: Application) {
    const date = window.prompt("Seguimiento", application.follow_up_date || new Date().toISOString().slice(0, 10));
    if (date === null) return;
    await updateApplication(application.id, { follow_up_date: date });
    await loadDashboard();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-ink p-6 text-white">
        <p className="text-sm font-medium text-skyglass">Panel principal</p>
        <h2 className="mt-2 text-3xl font-semibold">Seguimiento de candidaturas.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
          Phase 4A crea borradores, cartas y estados internos. No envía candidaturas externas automáticamente.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <ApplicationCard label="Total applications sent" value={stats.totalApplications} detail="Aplicadas o con respuesta" />
        <ApplicationCard label="Response rate %" value={`${Math.round(stats.responseRate * 100)}%`} detail="Vista, entrevista, oferta o rechazo" />
        <ApplicationCard label="Interviews scheduled" value={stats.interviewsScheduled} detail="Estado entrevista" />
        <ApplicationCard label="This week's applications" value={stats.thisWeekApplications} detail="Creadas o aplicadas esta semana" />
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-copper">Analítica</p>
            <h3 className="mt-1 text-base font-semibold">Visitas del portfolio público</h3>
            <p className="mt-2 text-sm text-olive">Conteos agregados privados para saber cuantas personas abren el sitio.</p>
          </div>
          <Link to="/app/analytics" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-copper">
            <BarChart3 className="h-4 w-4" />
            Ver analítica
          </Link>
        </div>
      </section>

      {success ? <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{success}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">Candidaturas</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-olive">
              <tr>
                <th className="py-3 pr-3">Company</th>
                <th className="py-3 pr-3">Role</th>
                <th className="py-3 pr-3">Platform</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Date</th>
                <th className="py-3 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id} className="border-b border-black/5 align-top">
                  <td className="py-3 pr-3 font-medium">{application.job.company}</td>
                  <td className="py-3 pr-3">{application.job.title}</td>
                  <td className="py-3 pr-3">{application.job.platform}</td>
                  <td className="py-3 pr-3">
                    <select value={application.status} onChange={(event) => void changeStatus(application.id, event.target.value as ApplicationStatus)} className="rounded-md border border-black/10 bg-white px-2 py-1">
                      {statusOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-3">{formatDate(application.applied_at || application.created_at)}</td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSelectedLetter(application.cover_letter_used)} className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        Ver carta
                      </button>
                      <a href={application.job.url} target="_blank" rel="noreferrer" className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        Ver oferta
                      </a>
                      <button type="button" onClick={() => void addNote(application)} className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        Añadir nota
                      </button>
                      <button type="button" onClick={() => void setFollowUp(application)} className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        Seguimiento
                      </button>
                      <button type="button" onClick={() => void navigator.clipboard.writeText(application.cover_letter_used)} className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        Copiar carta
                      </button>
                      <button type="button" onClick={() => void markApplied(application.id)} className="rounded-md bg-copper px-2 py-1 text-xs font-medium text-white">
                        Aplicada
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {applications.length === 0 ? <p className="py-6 text-sm text-olive">Todavía no hay candidaturas guardadas.</p> : null}
        </div>
      </section>

      {selectedLetter ? <CoverLetterPreview letter={selectedLetter} onClose={() => setSelectedLetter("")} /> : null}
    </div>
  );
}
