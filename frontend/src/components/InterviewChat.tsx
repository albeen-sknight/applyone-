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
import { useI18n } from "../lib/i18n";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function FeedbackBlock({ feedback }: { feedback?: string }) {
  const { t } = useI18n();
  if (!feedback) return null;

  return (
    <div className="mt-3 rounded-md border border-copper/30 bg-[#fff8ed] px-3 py-2 text-sm leading-6 text-ink">
      <p className="text-xs font-semibold uppercase text-copper">{t("interviews.feedback")}</p>
      <p className="mt-1">{feedback}</p>
    </div>
  );
}

function MessageBubble({ message }: { message: InterviewMessage }) {
  const { t } = useI18n();
  const isUser = message.role === "user";

  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-6 ${isUser ? "bg-ink text-white" : "border border-black/10 bg-white text-ink"}`}>
        <p className="text-xs font-semibold uppercase opacity-70">{isUser ? t("interviews.yourAnswer") : t("interviews.interviewer")}</p>
        <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
        {!isUser ? <FeedbackBlock feedback={message.feedback} /> : null}
      </div>
    </article>
  );
}

export default function InterviewChat() {
  const { t } = useI18n();
  const modeLabels: Record<InterviewMode, string> = {
    hr: t("interviews.hrMode"),
    technical: t("interviews.technicalMode")
  };
  const languageLabels: Record<InterviewLanguage, string> = {
    es: t("interviews.spanish"),
    en: t("interviews.english")
  };
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

  function statusLabel(nextSession: InterviewSessionSummary | InterviewSession) {
    return nextSession.ended_at ? t("interviews.finished") : t("interviews.inProgress");
  }

  async function refreshHistory() {
    const result = await getInterviewSessions();
    setSessions(result.sessions);
  }

  useEffect(() => {
    refreshHistory().catch((err: unknown) => setError(err instanceof Error ? err.message : t("interviews.historyError")));
  }, [t]);

  async function handleStart() {
    setLoading(true);
    setError("");
    try {
      const result = await startInterviewSession({ mode, language });
      setSession(result.session);
      setAnswer("");
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("interviews.startError"));
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
      setError(err instanceof Error ? err.message : t("interviews.sendError"));
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
      setError(err instanceof Error ? err.message : t("interviews.endError"));
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
      setError(err instanceof Error ? err.message : t("interviews.openError"));
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
              <span>{t("interviews.mode")}</span>
              <select value={mode} onChange={(event) => setMode(event.target.value as InterviewMode)} disabled={hasActiveSession || loading} className="h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm outline-none focus:border-copper">
                <option value="hr">{t("interviews.hrMode")}</option>
                <option value="technical">{t("interviews.technicalMode")}</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-ink">
              <span>{t("interviews.language")}</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value as InterviewLanguage)} disabled={hasActiveSession || loading} className="h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm outline-none focus:border-copper">
                <option value="es">{t("interviews.spanish")}</option>
                <option value="en">{t("interviews.english")}</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={handleStart} disabled={loading || hasActiveSession} className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {t("interviews.start")}
            </button>
            <button type="button" onClick={handleEnd} disabled={loading || !hasActiveSession} className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50">
              {t("interviews.end")}
            </button>
            <button type="button" onClick={newSession} disabled={loading} className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-ink">
              {t("interviews.newSession")}
            </button>
            <button type="button" onClick={() => setHistoryOpen((value) => !value)} className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-ink xl:hidden">
              {t("interviews.showHistory")}
            </button>
          </div>
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="rounded-lg border border-black/10 bg-[#fbfbf7]">
          <div className="border-b border-black/10 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{t("interviews.simulation")}</h3>
                <p className="mt-1 text-sm text-olive">
                  {session ? `${modeLabels[session.mode]} · ${languageLabels[session.language]} · ${statusLabel(session)}` : t("interviews.chooseToStart")}
                </p>
              </div>
              {session?.overall_score ? (
                <span className="rounded-md bg-skyglass px-3 py-1 text-sm font-semibold text-ink">
                  {t("interviews.score")} {session.overall_score}/10
                </span>
              ) : null}
            </div>
          </div>

          <div className="min-h-[360px] space-y-4 px-5 py-5">
            {session?.transcript.length ? (
              session.transcript.map((message, index) => <MessageBubble key={`${message.role}-${index}`} message={message} />)
            ) : (
              <div className="rounded-lg border border-dashed border-black/15 bg-white px-4 py-8 text-center text-sm text-olive">{t("interviews.noActive")}</div>
            )}
            {loading ? <div className="text-sm font-medium text-copper">{t("interviews.geminiThinking")}</div> : null}
          </div>

          {session?.overall_feedback ? (
            <div className="border-t border-black/10 bg-white px-5 py-4">
              <p className="text-sm font-semibold">{t("interviews.overallFeedback")}</p>
              <p className="mt-2 text-sm leading-6 text-olive">{session.overall_feedback}</p>
            </div>
          ) : null}

          <div className="border-t border-black/10 bg-white px-5 py-4">
            <label className="block text-sm font-medium text-ink" htmlFor="interview-answer">
              {t("interviews.sendAnswer")}
            </label>
            <textarea
              id="interview-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={!hasActiveSession || loading}
              rows={5}
              placeholder={latestAssistantQuestion ? t("interviews.answerPlaceholder") : t("interviews.startPlaceholder")}
              className="mt-2 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-copper disabled:bg-black/5"
            />
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={handleSend} disabled={!hasActiveSession || loading || !answer.trim()} className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {t("interviews.sendAnswer")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className={`${historyOpen ? "block" : "hidden"} xl:block`}>
        <section className="rounded-lg border border-black/10 bg-white">
          <div className="border-b border-black/10 px-4 py-3">
            <h3 className="text-base font-semibold">{t("interviews.history")}</h3>
            <p className="mt-1 text-sm text-olive">{t("interviews.historyDescription")}</p>
          </div>
          <div className="max-h-[720px] space-y-3 overflow-auto p-4">
            {sessions.length ? (
              sessions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openSession(item.id)}
                  className={`w-full rounded-md border p-3 text-left transition hover:border-copper ${session?.id === item.id ? "border-copper bg-[#fff8ed]" : "border-black/10 bg-white"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{modeLabels[item.mode]}</span>
                    <span className="text-xs text-olive">{languageLabels[item.language]}</span>
                  </div>
                  <p className="mt-1 text-xs text-olive">{formatDate(item.started_at || item.created_at)}</p>
                  <p className="mt-2 text-xs font-semibold text-copper">{statusLabel(item)}</p>
                  {item.overall_score ? (
                    <p className="mt-2 text-sm font-medium">
                      {t("interviews.score")} {item.overall_score}/10
                    </p>
                  ) : null}
                  {item.overall_feedback ? <p className="mt-1 line-clamp-3 text-sm leading-5 text-olive">{item.overall_feedback}</p> : null}
                </button>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-black/15 px-3 py-4 text-sm text-olive">{t("interviews.noHistory")}</p>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
