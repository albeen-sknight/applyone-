# ApplyOne

ApplyOne is a private, single-user job application workspace. Phase 1 added the local Worker, D1 schema, and dashboard shell. Phase 2 added Gemini-powered CV parsing and profile editing. Phase 3 added the job feed, local search, and match scoring. Phase 4A added application drafts and cover letter generation. Phase 4B adds local Playwright-assisted application scripts that stop before submission. Phase 5 adds Gemini interview preparation with saved transcripts and session history.

## Requirements

- Node.js 20+
- npm
- Cloudflare Wrangler
- Gemini API key for CV parsing and cover letter generation

## Environment

Copy `.env.example` to `.env` and fill only local values:

```powershell
Copy-Item .env.example .env
```

Important values:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
PLAYWRIGHT_HEADLESS=true
APPLYONE_LOCAL_API=http://127.0.0.1:8787
APPLYONE_CV_PATH=
```

Do not commit `.env`, API keys, CV files, screenshots, or Playwright run output.

## Install

```powershell
npm install
npx playwright install chromium
```

## Local Development

Run the Worker API:

```powershell
npm run dev:worker
```

Run the frontend:

```powershell
npm run dev:frontend
```

Open the app:

```text
http://127.0.0.1:5173
```

Useful pages:

- `/` dashboard
- `/perfil` profile and CV upload
- `/empleos` job feed and matching
- `/` dashboard with application tracking
- `/entrevista` or `/entrevistas` interview preparation
- `/ajustes` local settings shell

## Local D1

Apply the schema when creating or resetting the local database:

```powershell
npx wrangler d1 execute applyone-db --local --file .\workers\src\db\schema.sql
```

The Worker API uses local D1 through Wrangler. The Playwright scripts read data through the local Worker API only; they do not read D1 directly.

## CV Parsing

1. Start the Worker and frontend.
2. Go to `http://127.0.0.1:5173/perfil`.
3. Upload a PDF or DOCX CV.
4. Review the parsed profile JSON and extracted text.
5. Edit the profile fields and save.

## Job Feed

1. Start the Worker and frontend.
2. Go to `http://127.0.0.1:5173/empleos`.
3. Add jobs manually or import from CSV.
4. Use platform, status, text search, remote-only, and minimum match filters.
5. Open a job card to review the match reasons and assisted application command.

CSV imports accept common columns such as `title`, `company`, `location`, `url`, `platform`, `description`, `salary`, and `remote`.

## Application Drafts

1. Start the Worker and frontend.
2. Go to `http://127.0.0.1:5173/`.
3. Create a draft from an existing job.
4. Generate a cover letter with Gemini.
5. Edit and save the cover letter before using it anywhere.

The app keeps drafts local and does not submit applications.

## Assisted Applications

Phase 4B scripts open application pages locally with Playwright, fill obvious fields from the local profile, save screenshots, and stop in review mode. They never click the final submit button. The optional `--confirm-submit` flag is accepted for future compatibility, but the current scripts still stop before submission.

Safety behavior:

- Dry-run/review mode is the default.
- No real applications are submitted.
- CAPTCHA and anti-bot checks are not bypassed.
- Credentials are not stored.
- LinkedIn login is not automated.
- Each run is saved under `playwright/.runs/<timestamp>-<platform>/`.
- If `APPLYONE_CV_PATH` is empty, the scripts log `No APPLYONE_CV_PATH configured; skipping CV upload.`

Run the local Worker first when using `--job-id` or `--application-id`:

```powershell
npm run dev:worker
```

Generic ATS from a saved job:

```powershell
npm run apply:generic -- --job-id <job-id>
```

Generic ATS from a direct URL:

```powershell
npm run apply:generic -- --url "https://example.com/apply"
```

InfoJobs from a saved job:

```powershell
npm run apply:infojobs -- --job-id <job-id>
```

LinkedIn from a saved job:

```powershell
npm run apply:linkedin -- --job-id <job-id>
```

Local harmless mock page:

```powershell
$mock = (Resolve-Path 'playwright\fixtures\mock-ats.html').Path.Replace('\','/')
$env:APPLYONE_CV_PATH=''
npm run apply:generic -- --url "file:///$mock"
```

To watch the browser while testing:

```powershell
$env:PLAYWRIGHT_HEADLESS='false'
```

## Interview Prep

Phase 5 adds text-only interview practice. Start the Worker and frontend, then open:

```text
http://127.0.0.1:5173/entrevista
```

The public Pages project is:

```text
https://applyone.pages.dev
```

Interview Prep modes:

- `RRHH / Reclutador`: a first-round HR screening for junior IT, helpdesk, systems, and future cybersecurity roles in Madrid.
- `Tecnica / SOC Lead`: a junior-level technical SOC/support interview with SIEM, Windows logs, KQL, Active Directory, support troubleshooting, and prioritization questions.

Language options:

- `Espanol`
- `English`

How it works:

1. Choose mode and language.
2. Click `Iniciar sesion`.
3. Gemini asks one question.
4. Write an answer and click `Enviar respuesta`.
5. Gemini returns feedback plus the next question.
6. Click `Finalizar sesion` to generate an overall score and feedback.
7. Open previous sessions from `Historial`.

Gemini calls happen only in the Worker when starting a session, sending an answer, or ending a session. The browser never receives raw system prompts and never calls Gemini directly.

Transcripts are saved to local D1 in `interview_sessions.transcript` as JSON:

```json
[
  {
    "role": "assistant",
    "content": "Question text",
    "feedback": "Optional feedback"
  },
  {
    "role": "user",
    "content": "Candidate answer"
  }
]
```

To configure Gemini, keep the key local in `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

To test missing key behavior, temporarily stop the Worker, remove or clear `GEMINI_API_KEY` in `.env`, restart the Worker, and try `Iniciar sesion`. The UI should show the Worker error without exposing any secret.

## API

Worker endpoints include:

- `GET /health`
- `POST /api/profile/upload-cv`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/jobs`
- `POST /api/jobs`
- `POST /api/jobs/import-csv`
- `GET /api/jobs/:id`
- `PATCH /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `POST /api/applications`
- `GET /api/applications`
- `GET /api/applications/:id`
- `PATCH /api/applications/:id`
- `DELETE /api/applications/:id`
- `POST /api/applications/generate-cover-letter`
- `GET /api/interview/sessions`
- `GET /api/interview/sessions/:id`
- `POST /api/interview/sessions`
- `POST /api/interview/sessions/:id/message`
- `POST /api/interview/sessions/:id/end`
- `DELETE /api/interview/sessions/:id`

## Validation

```powershell
npm run typecheck
npm run build
```

For a full local smoke test:

```powershell
npm run dev:worker
npm run dev:frontend
```

Then test the app pages and run the mock Playwright command above. Confirm that the script stops before submission and writes screenshots plus `summary.json` under `playwright/.runs/`.

Interview Prep smoke test:

1. Open `http://127.0.0.1:5173/entrevista`.
2. Start an HR session in Spanish.
3. Confirm Gemini asks one question.
4. Send an answer.
5. Confirm Gemini returns feedback and one next question.
6. End the session.
7. Confirm the score, feedback, transcript, and history entry are visible.
8. Start a technical session in English or Spanish.
9. Confirm the questions are junior-level and relevant.

## Future Deployment Notes

ApplyOne is intentionally local-first for now. Before deploying beyond local use, add authentication, secret management, production database migrations, rate limits, observability, and a clear privacy model for CV and application data.
