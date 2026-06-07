import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { BriefcaseBusiness, ClipboardList, LayoutDashboard, Settings, UserRound, MessageSquareText } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import JobFeed from "./pages/JobFeed";
import InterviewPrep from "./pages/InterviewPrep";
import SettingsPage from "./pages/Settings";
import "./styles.css";

const navItems = [
  { to: "/", label: "Panel", icon: LayoutDashboard },
  { to: "/perfil", label: "Perfil", icon: UserRound },
  { to: "/empleos", label: "Ofertas", icon: BriefcaseBusiness },
  { to: "/entrevistas", label: "Entrevistas", icon: MessageSquareText },
  { to: "/ajustes", label: "Ajustes", icon: Settings }
];

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f7f7f1] text-ink">
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-black/10 bg-white/80 px-4 py-5 backdrop-blur lg:block">
          <div className="mb-8 px-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-copper">ApplyOne</p>
            <h1 className="mt-1 text-2xl font-semibold">Búsqueda laboral</h1>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                    isActive ? "bg-ink text-white" : "text-olive hover:bg-black/5 hover:text-ink"
                  }`
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 border-b border-black/10 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">ApplyOne</span>
              <span className="rounded-md bg-skyglass px-2 py-1 text-xs font-medium text-ink">Phase 1</span>
            </div>
            <nav className="mt-3 grid grid-cols-5 gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    `flex h-10 items-center justify-center rounded-md transition ${
                      isActive ? "bg-ink text-white" : "bg-black/5 text-olive"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/empleos" element={<JobFeed />} />
              <Route path="/entrevista" element={<InterviewPrep />} />
              <Route path="/entrevistas" element={<InterviewPrep />} />
              <Route path="/ajustes" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
