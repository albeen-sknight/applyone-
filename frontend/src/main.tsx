import React, { FormEvent, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Github,
  LayoutDashboard,
  Linkedin,
  Lock,
  LogOut,
  Mail,
  MessageSquareText,
  Settings,
  ShieldCheck,
  UserRound
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import JobFeed from "./pages/JobFeed";
import InterviewPrep from "./pages/InterviewPrep";
import SettingsPage from "./pages/Settings";
import { getSession, login, logout } from "./lib/api";
import "./styles.css";

const cvPath = "/cv/Aboulfazl_Saeedi_CV_English.pdf";

const navItems = [
  { to: "/app", label: "Panel", icon: LayoutDashboard },
  { to: "/app/perfil", label: "Perfil", icon: UserRound },
  { to: "/app/empleos", label: "Ofertas", icon: BriefcaseBusiness },
  { to: "/app/entrevistas", label: "Entrevistas", icon: MessageSquareText },
  { to: "/app/ajustes", label: "Ajustes", icon: Settings }
];

const skills = ["Windows/Linux support", "Active Directory", "Endpoint troubleshooting", "SIEM basics", "KQL", "Elastic Stack", "Ticketing and documentation", "Customer support"];
const highlights = ["Technology Trainee on a CyberSOC track at Deloitte Madrid", "IT Technician internship experience in Malta", "Customer support experience with high-volume user requests", "Hands-on Windows Event Log and SIEM investigation labs"];
const projects = ["ApplyOne private job application workspace", "Windows Event Log attack simulation lab", "Elastic Stack failed logon analysis", "Deloitte final project internal web app"];

function PublicLanding() {
  return (
    <main className="min-h-screen bg-portfolio text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide">
          <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-md" />
          ApplyOne
        </Link>
        <Link to="/login" className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 px-3 text-sm font-semibold text-white hover:border-brand hover:text-brand">
          <Lock className="h-4 w-4" />
          Login
        </Link>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-16 lg:pt-12">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Madrid, Spain</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">Alberto Saeedi</h1>
          <p className="mt-4 text-lg font-semibold text-white/85">Aboulfazl Saeedi</p>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-white/78">IT Support Technician | Helpdesk L1 | Endpoint Support | SOC Training</p>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68">
            IT support professional focused on user-first troubleshooting, endpoint support, clean documentation, and a longer-term path into SOC analysis and cybersecurity operations.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={cvPath} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-black hover:bg-brandSoft">
              <FileText className="h-4 w-4" />
              View CV
            </a>
            <a href={cvPath} download className="inline-flex h-11 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-bold text-white hover:border-brand hover:text-brand">
              <Download className="h-4 w-4" />
              Download CV
            </a>
            <a href="https://linkedin.com/in/aboulfazl-saeedi-026716225" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-bold text-white hover:border-brand hover:text-brand">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
            <a href="https://github.com/albeen-sknight" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-bold text-white hover:border-brand hover:text-brand">
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>

        <aside className="rounded-lg border border-white/12 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand">ApplyOne Workspace</p>
              <h2 className="mt-1 text-2xl font-bold">Private career cockpit</h2>
            </div>
            <img src="/favicon-128.png" alt="" className="h-16 w-16 rounded-md" />
          </div>
          <div className="mt-5 grid gap-3">
            {["CV parsing and profile editing", "Job feed and match scoring", "Cover letter drafts", "Application tracker", "Interview preparation"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md bg-black/30 p-3 text-sm text-white/82">
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand" />
                {item}
              </div>
            ))}
          </div>
          <Link to="/login" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-black hover:bg-brand">
            <Lock className="h-4 w-4" />
            Login to ApplyOne
          </Link>
        </aside>
      </section>

      <section className="bg-white text-ink">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          <section>
            <p className="text-sm font-bold uppercase tracking-wide text-brandDark">Target Roles</p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-olive">
              {["IT Support", "Helpdesk", "Service Desk", "Junior System Administrator", "Junior Network Administrator", "Junior SOC Analyst / Cybersecurity"].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="text-sm font-bold uppercase tracking-wide text-brandDark">Key Skills</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((item) => (
                <span key={item} className="rounded-md bg-ink px-2.5 py-1.5 text-xs font-semibold text-white">
                  {item}
                </span>
              ))}
            </div>
          </section>
          <section>
            <p className="text-sm font-bold uppercase tracking-wide text-brandDark">Contact</p>
            <div className="mt-4 space-y-3 text-sm text-olive">
              <a href="mailto:albertosaeedi@gmail.com" className="flex items-center gap-2 hover:text-ink">
                <Mail className="h-4 w-4" />
                albertosaeedi@gmail.com
              </a>
              <a href="https://linkedin.com/in/aboulfazl-saeedi-026716225" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-ink">
                <ExternalLink className="h-4 w-4" />
                linkedin.com/in/aboulfazl-saeedi-026716225
              </a>
            </div>
          </section>
        </div>
      </section>

      <section className="bg-[#f4f6f1] text-ink">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          <ContentBlock title="Experience Highlights" items={highlights} />
          <ContentBlock title="Education" items={["ASIR, Network Systems Administration - IES Clara del Rey, 2025-2027", "SMR, Microcomputer Systems and Networks - IES Barajas, 2023-2025"]} />
          <ContentBlock title="Featured Projects" items={projects} />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
          <section className="rounded-lg bg-ink p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-brand">Use this tool yourself</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/75">
              ApplyOne is published as a self-hostable single-owner workspace. Fork the repository, replace the public profile and CV, create your own Cloudflare Worker, D1 database, Pages project, and configure your own secrets.
            </p>
            <a href="https://github.com/albeen-sknight/applyone-" target="_blank" rel="noreferrer" className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-black hover:bg-brandSoft">
              <Github className="h-4 w-4" />
              Open repository
            </a>
          </section>
        </div>
      </section>
    </main>
  );
}

function ContentBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-brandDark">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-olive">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(password);
      navigate("/app");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-portfolio px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/12 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
        <Link to="/" className="mb-8 flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-white/80">
          <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-md" />
          ApplyOne
        </Link>
        <p className="text-sm font-semibold text-brand">Private workspace</p>
        <h1 className="mt-2 text-3xl font-bold">Login</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-white/75">Owner password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-white/15 bg-black/35 px-3 text-sm text-white outline-none focus:border-brand"
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="rounded-md bg-red-500/15 p-3 text-sm text-red-100">{error}</p> : null}
          <button type="submit" disabled={isSubmitting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-60">
            <Lock className="h-4 w-4" />
            {isSubmitting ? "Checking..." : "Enter workspace"}
          </button>
        </form>
      </section>
    </main>
  );
}

function PrivateGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    getSession()
      .then((session) => setState(session.authenticated ? "allowed" : "denied"))
      .catch(() => setState("denied"));
  }, []);

  if (state === "loading") {
    return <main className="flex min-h-screen items-center justify-center bg-ink text-sm text-white/75">Loading ApplyOne...</main>;
  }

  if (state === "denied") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function WorkspaceShell() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout().catch(() => null);
    navigate("/login");
  }

  return (
    <PrivateGate>
      <div className="min-h-screen bg-[#f5f7f1] text-ink">
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-black/10 bg-ink px-4 py-5 text-white lg:block">
          <div className="mb-8 px-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">ApplyOne</p>
            <h1 className="mt-1 text-2xl font-semibold">Búsqueda laboral</h1>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/app"} className={({ isActive }) => `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${isActive ? "bg-brand text-black" : "text-white/72 hover:bg-white/8 hover:text-white"}`}>
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" onClick={handleLogout} className="mt-8 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/12 text-sm font-semibold text-white/80 hover:border-brand hover:text-brand">
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 border-b border-black/10 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">ApplyOne</span>
              <button type="button" onClick={handleLogout} aria-label="Salir" className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-3 grid grid-cols-5 gap-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === "/app"} aria-label={item.label} className={({ isActive }) => `flex h-10 items-center justify-center rounded-md transition ${isActive ? "bg-ink text-white" : "bg-black/5 text-olive"}`}>
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="perfil" element={<Profile />} />
              <Route path="empleos" element={<JobFeed />} />
              <Route path="entrevista" element={<InterviewPrep />} />
              <Route path="entrevistas" element={<InterviewPrep />} />
              <Route path="ajustes" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </PrivateGate>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLanding />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/*" element={<WorkspaceShell />} />
        <Route path="/perfil" element={<Navigate to="/app/perfil" replace />} />
        <Route path="/empleos" element={<Navigate to="/app/empleos" replace />} />
        <Route path="/entrevista" element={<Navigate to="/app/entrevistas" replace />} />
        <Route path="/entrevistas" element={<Navigate to="/app/entrevistas" replace />} />
        <Route path="/ajustes" element={<Navigate to="/app/ajustes" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
