import JobCard from "../components/JobCard";

export default function JobFeed() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-copper">Ofertas</p>
        <h2 className="mt-1 text-3xl font-semibold">Feed preparado para próximas fuentes.</h2>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <JobCard title="Junior SOC Analyst" company="Placeholder Madrid" source="Manual" />
        <JobCard title="Helpdesk / IT Support" company="Placeholder Madrid" source="Manual" />
      </div>
    </div>
  );
}
