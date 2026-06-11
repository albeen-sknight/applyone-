import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import ApplicationCard from "../components/ApplicationCard";
import CoverLetterPreview from "../components/CoverLetterPreview";
import { getApplicationStats, getApplications, markApplicationApplied, updateApplication, updateApplicationStatus, type Application, type ApplicationStatus, type ApplicationStats } from "../lib/api";
import { useI18n, type TranslationKey } from "../lib/i18n";

const statusLabelKeys: Record<ApplicationStatus, TranslationKey> = {
  draft: "status.draft",
  ready_to_apply: "status.readyToApply",
  manual_required: "status.manualRequired",
  applied: "status.applied",
  viewed: "status.viewed",
  interview: "status.interview",
  offer: "status.offer",
  rejected: "status.rejected",
  no_reply: "status.noReply"
};

const statusOptions = Object.keys(statusLabelKeys) as ApplicationStatus[];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

export default function Dashboard() {
  const { t } = useI18n();
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
      setError(reason instanceof Error ? reason.message : t("dashboard.loadError"));
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
    setSuccess(t("dashboard.markAppliedSuccess"));
  }

  async function addNote(application: Application) {
    const note = window.prompt(t("dashboard.notePrompt"), application.notes || "");
    if (note === null) return;
    await updateApplication(application.id, { notes: note });
    await loadDashboard();
  }

  async function setFollowUp(application: Application) {
    const date = window.prompt(t("dashboard.followUpPrompt"), application.follow_up_date || new Date().toISOString().slice(0, 10));
    if (date === null) return;
    await updateApplication(application.id, { follow_up_date: date });
    await loadDashboard();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-ink p-6 text-white">
        <p className="text-sm font-medium text-skyglass">{t("dashboard.kicker")}</p>
        <h2 className="mt-2 text-3xl font-semibold">{t("dashboard.title")}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">{t("dashboard.description")}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <ApplicationCard label={t("dashboard.totalApplications")} value={stats.totalApplications} detail={t("dashboard.totalApplicationsDetail")} />
        <ApplicationCard label={t("dashboard.responseRate")} value={`${Math.round(stats.responseRate * 100)}%`} detail={t("dashboard.responseRateDetail")} />
        <ApplicationCard label={t("dashboard.interviewsScheduled")} value={stats.interviewsScheduled} detail={t("dashboard.interviewsScheduledDetail")} />
        <ApplicationCard label={t("dashboard.thisWeekApplications")} value={stats.thisWeekApplications} detail={t("dashboard.thisWeekApplicationsDetail")} />
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-copper">{t("analytics.kicker")}</p>
            <h3 className="mt-1 text-base font-semibold">{t("dashboard.analyticsTitle")}</h3>
            <p className="mt-2 text-sm text-olive">{t("dashboard.analyticsDescription")}</p>
          </div>
          <Link to="/app/analytics" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-copper">
            <BarChart3 className="h-4 w-4" />
            {t("dashboard.analyticsCta")}
          </Link>
        </div>
      </section>

      {success ? <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">{success}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">{t("dashboard.applications")}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-olive">
              <tr>
                <th className="py-3 pr-3">{t("dashboard.company")}</th>
                <th className="py-3 pr-3">{t("dashboard.role")}</th>
                <th className="py-3 pr-3">{t("common.platform")}</th>
                <th className="py-3 pr-3">{t("common.status")}</th>
                <th className="py-3 pr-3">{t("common.date")}</th>
                <th className="py-3 pr-3">{t("common.actions")}</th>
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
                      {statusOptions.map((value) => (
                        <option key={value} value={value}>
                          {t(statusLabelKeys[value])}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-3">{formatDate(application.applied_at || application.created_at)}</td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSelectedLetter(application.cover_letter_used)} className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        {t("dashboard.viewLetter")}
                      </button>
                      <a href={application.job.url} target="_blank" rel="noreferrer" className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        {t("dashboard.viewJob")}
                      </a>
                      <button type="button" onClick={() => void addNote(application)} className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        {t("dashboard.addNote")}
                      </button>
                      <button type="button" onClick={() => void setFollowUp(application)} className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        {t("dashboard.followUp")}
                      </button>
                      <button type="button" onClick={() => void navigator.clipboard.writeText(application.cover_letter_used)} className="rounded-md bg-black/[0.06] px-2 py-1 text-xs font-medium">
                        {t("dashboard.copyLetter")}
                      </button>
                      <button type="button" onClick={() => void markApplied(application.id)} className="rounded-md bg-copper px-2 py-1 text-xs font-medium text-white">
                        {t("dashboard.applied")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {applications.length === 0 ? <p className="py-6 text-sm text-olive">{t("dashboard.emptyApplications")}</p> : null}
        </div>
      </section>

      {selectedLetter ? <CoverLetterPreview letter={selectedLetter} onClose={() => setSelectedLetter("")} /> : null}
    </div>
  );
}
