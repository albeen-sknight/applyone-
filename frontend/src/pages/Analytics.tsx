import { useEffect, useState } from "react";
import { getAnalyticsSummary, type AnalyticsSummary } from "../lib/api";
import { useI18n } from "../lib/i18n";

const emptySummary: AnalyticsSummary = {
  totalViews: 0,
  viewsToday: 0,
  viewsLast7Days: 0,
  viewsLast30Days: 0,
  approximateUniqueToday: 0,
  approximateUniqueLast7Days: 0,
  topPaths: [],
  topReferrers: [],
  viewsByDay: [],
  countries: [],
  deviceTypes: []
};

function NumberCard({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-copper">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value.toLocaleString("es-ES")}</p>
      {detail ? <p className="mt-2 text-sm text-olive">{detail}</p> : null}
    </section>
  );
}

function CountTable({ title, rows, emptyLabel, nameLabel, viewsLabel }: { title: string; rows: Array<{ name: string; count: number }>; emptyLabel: string; nameLabel: string; viewsLabel: string }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-olive">
            <tr>
              <th className="py-3 pr-3">{nameLabel}</th>
              <th className="py-3 text-right">{viewsLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.name}`} className="border-b border-black/5">
                <td className="py-3 pr-3">{row.name}</td>
                <td className="py-3 text-right font-semibold">{row.count.toLocaleString("es-ES")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="py-5 text-sm text-olive">{emptyLabel}</p> : null}
      </div>
    </section>
  );
}

export default function Analytics() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<AnalyticsSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalyticsSummary()
      .then((result) => setSummary(result))
      .catch((reason) => setError(reason instanceof Error ? reason.message : t("analytics.loadError")))
      .finally(() => setIsLoading(false));
  }, [t]);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-copper">{t("analytics.kicker")}</p>
        <h2 className="mt-1 text-3xl font-semibold">{t("analytics.title")}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-olive">{t("analytics.description")}</p>
      </section>

      {isLoading ? <p className="rounded-lg bg-white p-4 text-sm text-olive shadow-sm">{t("analytics.loading")}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <NumberCard label={t("analytics.totalViews")} value={summary.totalViews} />
        <NumberCard label={t("analytics.viewsToday")} value={summary.viewsToday} detail={`${summary.approximateUniqueToday.toLocaleString("es-ES")} ${t("analytics.approxVisitors")}`} />
        <NumberCard label={t("analytics.last7Days")} value={summary.viewsLast7Days} detail={`${summary.approximateUniqueLast7Days.toLocaleString("es-ES")} ${t("analytics.approxVisitors")}`} />
        <NumberCard label={t("analytics.last30Days")} value={summary.viewsLast30Days} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CountTable title={t("analytics.topPaths")} rows={summary.topPaths} emptyLabel={t("analytics.empty")} nameLabel={t("common.name")} viewsLabel={t("analytics.views")} />
        <CountTable title={t("analytics.referrers")} rows={summary.topReferrers} emptyLabel={t("analytics.empty")} nameLabel={t("common.name")} viewsLabel={t("analytics.views")} />
        <CountTable title={t("analytics.countries")} rows={summary.countries} emptyLabel={t("analytics.empty")} nameLabel={t("common.name")} viewsLabel={t("analytics.views")} />
        <CountTable title={t("analytics.devices")} rows={summary.deviceTypes} emptyLabel={t("analytics.empty")} nameLabel={t("common.name")} viewsLabel={t("analytics.views")} />
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">{t("analytics.dailyTrend")}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-olive">
              <tr>
                <th className="py-3 pr-3">{t("analytics.day")}</th>
                <th className="py-3 text-right">{t("analytics.views")}</th>
              </tr>
            </thead>
            <tbody>
              {summary.viewsByDay.map((row) => (
                <tr key={row.day} className="border-b border-black/5">
                  <td className="py-3 pr-3">{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(`${row.day}T00:00:00Z`))}</td>
                  <td className="py-3 text-right font-semibold">{row.views.toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.viewsByDay.length === 0 ? <p className="py-5 text-sm text-olive">{t("analytics.empty")}</p> : null}
        </div>
      </section>
    </div>
  );
}
