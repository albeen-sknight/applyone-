import ApplicationCard from "../components/ApplicationCard";
import CoverLetterPreview from "../components/CoverLetterPreview";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-ink p-6 text-white">
        <p className="text-sm font-medium text-skyglass">Panel principal</p>
        <h2 className="mt-2 text-3xl font-semibold">Base lista para organizar candidaturas.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
          Phase 1 prepara la estructura del producto: perfil, ofertas, candidaturas, Worker API y D1.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ApplicationCard company="Deloitte Madrid" role="Junior SOC Analyst" status="Referencia de perfil" />
        <ApplicationCard company="Madrid" role="IT Support" status="Mercado objetivo" />
        <ApplicationCard company="Cloudflare D1" role="Base de datos" status="Schema preparado" />
      </section>

      <CoverLetterPreview />
    </div>
  );
}
