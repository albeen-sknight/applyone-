import InterviewChat from "../components/InterviewChat";

export default function InterviewPrep() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-copper">Entrevistas</p>
        <h2 className="mt-1 text-3xl font-semibold">Preparacion de entrevistas</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-olive">
          Practica una entrevista de RRHH o una tecnica tipo SOC Lead con preguntas de una en una, feedback despues de cada respuesta e historial guardado localmente.
        </p>
      </section>
      <InterviewChat />
    </div>
  );
}
