import { getLinkedInStatus, linkedInCallbackUrl } from "../lib/linkedin";

export default function Settings() {
  const linkedIn = getLinkedInStatus();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-copper">Ajustes</p>
        <h2 className="mt-1 text-3xl font-semibold">Configuración base.</h2>
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
