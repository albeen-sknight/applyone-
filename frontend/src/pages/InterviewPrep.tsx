import InterviewChat from "../components/InterviewChat";

export default function InterviewPrep() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-copper">Entrevistas</p>
        <h2 className="mt-1 text-3xl font-semibold">Preparación lista para futuras sesiones.</h2>
      </section>
      <InterviewChat />
    </div>
  );
}
