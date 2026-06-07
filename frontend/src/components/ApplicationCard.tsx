type ApplicationCardProps = {
  label: string;
  value: string | number;
  detail: string;
};

export default function ApplicationCard({ label, value, detail }: ApplicationCardProps) {
  return (
    <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-copper">{label}</p>
      <h3 className="mt-2 text-3xl font-semibold">{value}</h3>
      <p className="mt-2 text-sm text-olive">{detail}</p>
    </article>
  );
}
