import { useEffect, useState } from "react";
import { getAnalyticsSummary, type AnalyticsSummary } from "../lib/api";

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

function CountTable({ title, rows, emptyLabel = "Sin datos todavia." }: { title: string; rows: Array<{ name: string; count: number }>; emptyLabel?: string }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-olive">
            <tr>
              <th className="py-3 pr-3">Nombre</th>
              <th className="py-3 text-right">Visitas</th>
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
  const [summary, setSummary] = useState<AnalyticsSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalyticsSummary()
      .then((result) => setSummary(result))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudo cargar la analítica."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-copper">Analítica</p>
        <h2 className="mt-1 text-3xl font-semibold">Visitas del portfolio público.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-olive">Conteos agregados de primera parte, sin cookies de analítica, sin IPs en bruto y sin servicios externos.</p>
      </section>

      {isLoading ? <p className="rounded-lg bg-white p-4 text-sm text-olive shadow-sm">Cargando analítica...</p> : null}
      {error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <NumberCard label="Visitas totales" value={summary.totalViews} />
        <NumberCard label="Visitas hoy" value={summary.viewsToday} detail={`${summary.approximateUniqueToday.toLocaleString("es-ES")} visitantes aprox.`} />
        <NumberCard label="Últimos 7 días" value={summary.viewsLast7Days} detail={`${summary.approximateUniqueLast7Days.toLocaleString("es-ES")} visitantes aprox.`} />
        <NumberCard label="Últimos 30 días" value={summary.viewsLast30Days} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CountTable title="Rutas principales" rows={summary.topPaths} />
        <CountTable title="Referencias" rows={summary.topReferrers} />
        <CountTable title="Países" rows={summary.countries} />
        <CountTable title="Dispositivos" rows={summary.deviceTypes} />
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">Tendencia diaria</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-olive">
              <tr>
                <th className="py-3 pr-3">Día</th>
                <th className="py-3 text-right">Visitas</th>
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
          {summary.viewsByDay.length === 0 ? <p className="py-5 text-sm text-olive">Sin datos todavia.</p> : null}
        </div>
      </section>
    </div>
  );
}
