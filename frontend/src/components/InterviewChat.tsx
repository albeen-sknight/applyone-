import { useEffect, useMemo, useState } from "react";
import {
  endInterviewSession,
  getInterviewSession,
  getInterviewSessions,
  sendInterviewMessage,
  startInterviewSession,
  type InterviewLanguage,
  type InterviewMessage,
  type InterviewMode,
  type InterviewSession,
  type InterviewSessionSummary
} from "../lib/api";

const modeLabels: Record<InterviewMode, string> = {
  hr: "RRHH / Reclutador",
  technical: "Tecnica / SOC Lead"
};

const languageLabels: Record<InterviewLanguage, string> = {
  es: "Espanol",
  en: "English"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusLabel(session: InterviewSessionSummary | InterviewSession) {
  return session.ended_at ? "Finalizada" : "En curso";
}

function FeedbackBlock({ feedback }: { feedback?: string }) {
  if (!feedback) return null;

  return (
    <div className="mt-3 rounded-md border border-copper/30 bg-[#fff8ed] px-3 py-2 text-sm leading-6 text-ink">
      <p className="text-xs font-semibold uppercase text-copper">Feedback</p>
      <p className="mt-1">{feedback}</p>
    </div>
  );
}

function MessageBubble({ message }: { message: InterviewMessage }) {
  const isUser = message.role === "user";

  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-6 ${isUser ? "bg-ink text-white" : "border border-black/10 bg-white text-ink"}`}>
        <p className="text-xs font-semibold uppercase opacity-70">{isUser ? "Tu respuesta" : "Entrevistador"}</p>
        <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
        {!isUser ? <FeedbackBlock feedback={message.feedback} /> : null}
      </div>
    </article>
  );
}

export default function InterviewChat() {
  const [mode, setMode] = useState<InterviewMode>("hr");
  const [language, setLanguage] = useState<InterviewLanguage>("es");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [error, setError] = useState("");

  const hasActiveSession = Boolean(session && !session.ended_at);
  const latestAssistantQuestion = useMemo(() => {
    return [...(session?.transcript || [])].reverse().find((message) => message.role === "assistant")?.content || "";
  }, [session]);

  async function refreshHistory() {
    const result = await getInterviewSessions();
    setSessions(result.sessions);
  }

  useEffect(() => {
    refreshHistory().catch((err: unknown) => setError(err instanceof Error ? err.message : "No se pudo cargar el historial."));
  }, []);

  async function handleStart() {
    setLoading(true);
    setError("");
    try {
      const result = await startInterviewSession({ mode, language });
      setSession(result.session);
      setAnswer("");
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar la sesion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!session || !answer.trim()) return;

    setLoading(true);
    setError("");
    try {
      const result = await sendInterviewMessage(session.id, answer.trim());
      setSession(result.session);
      setAnswer("");
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la respuesta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    if (!session) return;

    setLoading(true);
    setError("");
    try {
      const result = await endInterviewSession(session.id);
      setSession(result.session);
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo finalizar la sesion.");
    } finally {
      setLoading(false);
    }
  }

  async function openSession(id: string) {
    setLoading(true);
    setError("");
    try {
      const result = await getInterviewSession(id);
      setSession(result);
      setMode(result.mode);
      setLanguage(result.language);
      setAnswer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la sesion.");
    } finally {
      setLoading(false);
    }
  }

  function newSession() {
    setSession(null);
    setAnswer("");
    setError("");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-5">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Modo</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as InterviewMode)}
                disabled={hasActiveSession || loading}
                className="h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm outline-none focus:border-copper"
              >
                <option value="hr">RRHH / Reclutador</option>
                <option value="technical">Tecnica / SOC Lead</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Idioma</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as InterviewLanguage)}
                disabled={hasActiveSession || loading}
                className="h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm outline-none focus:border-copper"
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleStart}
              disabled={loading || hasActiveSession}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Iniciar sesion
            </button>
            <button
              type="button"
              onClick={handleEnd}
              disabled={loading || !hasActiveSession}
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Finalizar sesion
            </button>
            <button type="button" onClick={newSession} disabled={loading} className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-ink">
              Nueva sesion
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen((value) => !value)}
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-ink xl:hidden"
            >
              Ver historial
            </button>
          </div>
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="rounded-lg border border-black/10 bg-[#fbfbf7]">
          <div className="border-b border-black/10 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Simulacion de entrevista</h3>
                <p className="mt-1 text-sm text-olive">
                  {session ? `${modeLabels[session.mode]} · ${languageLabels[session.language]} · ${statusLabel(session)}` : "Elige modo e idioma para empezar."}
                </p>
              </div>
              {session?.overall_score ? (
                <span className="rounded-md bg-skyglass px-3 py-1 text-sm font-semibold text-ink">Puntuacion {session.overall_score}/10</span>
              ) : null}
            </div>
          </div>

          <div className="min-h-[360px] space-y-4 px-5 py-5">
            {session?.transcript.length ? (
              session.transcript.map((message, index) => <MessageBubble key={`${message.role}-${index}`} message={message} />)
            ) : (
              <div className="rounded-lg border border-dashed border-black/15 bg-white px-4 py-8 text-center text-sm text-olive">
                No hay una sesion activa todavia. Pulsa Iniciar sesion para pedir la primera pregunta a Gemini.
              </div>
            )}
            {loading ? <div className="text-sm font-medium text-copper">Gemini esta respondiendo...</div> : null}
          </div>

          {session?.overall_feedback ? (
            <div className="border-t border-black/10 bg-white px-5 py-4">
              <p className="text-sm font-semibold">Feedback general</p>
              <p className="mt-2 text-sm leading-6 text-olive">{session.overall_feedback}</p>
            </div>
          ) : null}

          <div className="border-t border-black/10 bg-white px-5 py-4">
            <label className="block text-sm font-medium text-ink" htmlFor="interview-answer">
              Enviar respuesta
            </label>
            <textarea
              id="interview-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={!hasActiveSession || loading}
              rows={5}
              placeholder={latestAssistantQuestion ? "Escribe tu respuesta a la pregunta actual..." : "Inicia una sesion para responder."}
              className="mt-2 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-copper disabled:bg-black/5"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSend}
                disabled={!hasActiveSession || loading || !answer.trim()}
                className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enviar respuesta
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className={`${historyOpen ? "block" : "hidden"} xl:block`}>
        <section className="rounded-lg border border-black/10 bg-white">
          <div className="border-b border-black/10 px-4 py-3">
            <h3 className="text-base font-semibold">Historial</h3>
            <p className="mt-1 text-sm text-olive">Sesiones guardadas en D1.</p>
          </div>
          <div className="max-h-[720px] space-y-3 overflow-auto p-4">
            {sessions.length ? (
              sessions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openSession(item.id)}
                  className={`w-full rounded-md border p-3 text-left transition hover:border-copper ${
                    session?.id === item.id ? "border-copper bg-[#fff8ed]" : "border-black/10 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{modeLabels[item.mode]}</span>
                    <span className="text-xs text-olive">{languageLabels[item.language]}</span>
                  </div>
                  <p className="mt-1 text-xs text-olive">{formatDate(item.started_at || item.created_at)}</p>
                  <p className="mt-2 text-xs font-semibold text-copper">{statusLabel(item)}</p>
                  {item.overall_score ? <p className="mt-2 text-sm font-medium">Puntuacion {item.overall_score}/10</p> : null}
                  {item.overall_feedback ? <p className="mt-1 line-clamp-3 text-sm leading-5 text-olive">{item.overall_feedback}</p> : null}
                </button>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-black/15 px-3 py-4 text-sm text-olive">Aun no hay sesiones guardadas.</p>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
