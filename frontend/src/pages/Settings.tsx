import { getLinkedInStatus, linkedInCallbackUrl } from "../lib/linkedin";

const settings = [
  ["Minimum visible match score", "0.5"],
  ["Auto-apply threshold", "0.85 (solo referencia, Phase 3 no aplica automáticamente)"],
  ["Main target family", "IT Support / Helpdesk / Service Desk"],
  ["Secondary target family", "Junior Cybersecurity / SOC"],
  ["Location", "Madrid"],
  ["Location types", "On-site / Hybrid"],
  ["Employment types", "Full-time / Part-time"]
];

export default function Settings() {
  const linkedIn = getLinkedInStatus();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-copper">Ajustes</p>
        <h2 className="mt-1 text-3xl font-semibold">Configuración base.</h2>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">Job Feed</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {settings.map(([label, value]) => (
            <div key={label} className="rounded-md bg-black/[0.03] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-copper">{label}</p>
              <p className="mt-1 text-sm text-olive">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">LinkedIn OAuth</h3>
        <p className="mt-2 text-sm text-olive">{linkedIn.message}</p>
        <p className="mt-3 break-all text-sm text-olive">Callback futuro: {linkedInCallbackUrl}</p>
        <p className="mt-3 text-sm font-medium text-copper">Configurado: {linkedIn.configured ? "Sí" : "No"}</p>
      </section>
    </div>
  );
}
