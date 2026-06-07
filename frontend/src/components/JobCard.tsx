type JobCardProps = {
  title: string;
  company: string;
  source: string;
};

export default function JobCard({ title, company, source }: JobCardProps) {
  return (
    <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-olive">{company}</p>
        </div>
        <span className="rounded-md bg-skyglass px-2 py-1 text-xs font-medium">{source}</span>
      </div>
    </article>
  );
}
