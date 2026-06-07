import { useEffect, useState } from "react";
import { getProfile, type OwnerProfile } from "../lib/api";

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-copper">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-olive">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile().then(setProfile).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Error desconocido.");
    });
  }, []);

  if (error) {
    return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  }

  if (!profile) {
    return <p className="rounded-lg bg-white p-4 text-sm text-olive">Cargando perfil...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/10">
        <p className="text-sm font-medium text-copper">{profile.name}</p>
        <h2 className="mt-1 text-3xl font-semibold">{profile.professionalName}</h2>
        <div className="mt-4 grid gap-3 text-sm text-olive sm:grid-cols-2 lg:grid-cols-3">
          <span>{profile.location}</span>
          <span>{profile.workPermit}</span>
          <span>{profile.email}</span>
          <span>{profile.phone}</span>
          <span>{profile.linkedin}</span>
          <span>{profile.github}</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ListBlock title="Roles objetivo" items={profile.targetRoles} />
        <ListBlock title="Idiomas" items={profile.languages} />
        <ListBlock title="Formación" items={profile.education} />
        <ListBlock title="Experiencia" items={profile.experience} />
        <ListBlock title="Skills técnicos" items={profile.technicalSkills} />
        <ListBlock title="Certificaciones" items={profile.certifications} />
        <ListBlock title="Proyectos" items={profile.projects} />
        <section className="rounded-lg border border-black/10 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-copper">Preferencias</h3>
          <p className="mt-3 text-sm leading-6 text-olive">Mercado: {profile.targetMarket}</p>
          <p className="mt-1 text-sm leading-6 text-olive">Idioma preferido: {profile.preferredLanguage}</p>
        </section>
      </section>
    </div>
  );
}
