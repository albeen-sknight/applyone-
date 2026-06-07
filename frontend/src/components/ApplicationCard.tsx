type ApplicationCardProps = {
  company: string;
  role: string;
  status: string;
};

export default function ApplicationCard({ company, role, status }: ApplicationCardProps) {
  return (
    <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-copper">{company}</p>
      <h3 className="mt-1 text-base font-semibold">{role}</h3>
      <p className="mt-3 text-sm text-olive">{status}</p>
    </article>
  );
}
