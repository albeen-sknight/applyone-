# ApplyOne

ApplyOne is a private job application assistant for one owner. Phase 1 set up the foundation. Phase 2 added browser PDF CV text extraction, Gemini-powered CV parsing in the Worker, and editable structured profile data stored in D1. Phase 3 added a local-first Job Feed with respectful public-page scraping, deterministic match scoring, and review/skip workflow. Phase 4A adds safe application drafts, Gemini cover letters, manual applied tracking, notes, follow-up dates, and dashboard statistics.

## Requirements

- Node.js 22+
- npm 10+
- Git
- Wrangler 4+
- Cloudflare account with D1 database `applyone-db`

## Environment Values

Copy the example file when you need local environment values:

```powershell
Copy-Item .env.example .env
```

Do not commit `.env`. Add the real Gemini key only to `.env` or to Cloudflare Worker secrets.

Phase 2 local values:

```powershell
AI_PROVIDER=gemini
GEMINI_API_KEY=your-local-key
GEMINI_MODEL=gemini-2.5-flash
```

Required later-phase values:

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `PLAYWRIGHT_HEADLESS`

## Install Dependencies

From `C:\Users\PC\OneDrive\Documentos\GitHub\applyone-`:

```powershell
npm install
```

## Run Frontend Locally

```powershell
npm run dev:frontend
```

The frontend runs at `http://localhost:5173`.

## Run Worker Locally

```powershell
npm run dev:worker
```

The Worker runs at `http://localhost:8787`.

Useful endpoints:

- `GET /health`
- `GET /api/profile`
- `GET /api/profile/cv`
- `POST /api/profile/cv/parse`
- `PUT /api/profile`
- `GET /api/jobs`
- `POST /api/jobs/scrape`
- `PATCH /api/jobs/:id/status`
- `POST /api/jobs/import`
- `GET /api/applications`
- `GET /api/applications/stats`
- `POST /api/applications`
- `POST /api/applications/generate-cover-letter`
- `PUT /api/applications/:id`
- `PATCH /api/applications/:id/status`
- `POST /api/applications/:id/mark-applied`

## Apply D1 Schema

Local D1:

```powershell
npx wrangler d1 execute applyone-db --local --file ./workers/src/db/schema.sql
```

Remote D1:

```powershell
npx wrangler d1 execute applyone-db --remote --file ./workers/src/db/schema.sql
```

## Test CV Upload Locally

1. Start the Worker:

```powershell
npm run dev:worker
```

2. Start the frontend:

```powershell
npm run dev:frontend
```

3. Open `http://127.0.0.1:5173/perfil`.
4. Confirm the default profile loads.
5. Use `Subir CV` to select a PDF.
6. Click `Extraer y analizar CV`.
7. Confirm `Texto extraído` is populated.
8. Confirm `Perfil estructurado` shows parsed Gemini JSON.
9. Edit a field and click `Guardar cambios`.
10. Check `GET http://127.0.0.1:8787/api/profile` includes `cv_raw_text` and `cv_structured`.

If `GEMINI_API_KEY` is missing, the Worker returns a clear error and the frontend shows it in the upload section.

## Test Job Feed Locally

1. Start the Worker:

```powershell
npm run dev:worker
```

2. Start the frontend:

```powershell
npm run dev:frontend
```

3. Open `http://127.0.0.1:5173/empleos`.
4. Click `Buscar nuevas ofertas`.
5. Confirm the summary shows inserted, updated, duplicate, and platform error counts.
6. Confirm jobs with `match_score > 0.5` appear by default.
7. Use `Omitir` to mark a job as skipped.
8. Confirm skipped jobs disappear from the default list.

PowerShell API checks:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8787/api/jobs
Invoke-RestMethod -Uri http://127.0.0.1:8787/api/jobs/scrape -Method Post
```

Manual import fallback:

```powershell
$body = @{
  title = "Técnico de soporte IT junior"
  company = "Empresa manual"
  location = "Madrid híbrido"
  platform = "manual"
  url = "https://example.com/jobs/manual-soporte-it"
  description_raw = "Helpdesk, Microsoft 365, Windows, ticket handling, soporte usuarios, junior"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://127.0.0.1:8787/api/jobs/import -Method Post -ContentType "application/json" -Body $body
```

Scraper limitations:

- Phase 3 uses public pages and normal `fetch` only.
- No login, captcha bypass, private APIs, Playwright, or auto-apply.
- LinkedIn, Indeed, InfoJobs, or Tecnoempleo may block or change markup; the Worker reports those platform errors and continues.
- Manual import is available when a platform requires manual checking.

## Test Application Drafts and Cover Letters Locally

Phase 4A does not automate browser submissions. It only creates internal drafts, cover letters, tracking records, and manual status workflows. Playwright-assisted form filling is reserved for Phase 4B.

1. Start the Worker:

```powershell
npm run dev:worker
```

2. Start the frontend:

```powershell
npm run dev:frontend
```

3. Open `http://127.0.0.1:5173/empleos`.
4. Pick a saved job and click `Generar carta`.
5. Review the generated `Carta de presentación`.
6. Edit the text if needed.
7. Click `Guardar borrador` or `Marcar como lista para aplicar`.
8. Use `Marcar como aplicada` only after applying manually outside ApplyOne.
9. Open the Dashboard at `http://127.0.0.1:5173/`.
10. Confirm the application appears in the table and the stats update.

PowerShell API checks:

```powershell
$jobs = Invoke-RestMethod -Uri http://127.0.0.1:8787/api/jobs
$jobId = $jobs.jobs[0].id

Invoke-RestMethod -Uri http://127.0.0.1:8787/api/applications/generate-cover-letter `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{ job_id = $jobId } | ConvertTo-Json)

Invoke-RestMethod -Uri http://127.0.0.1:8787/api/applications
Invoke-RestMethod -Uri http://127.0.0.1:8787/api/applications/stats
```

Draft workflow:

- `draft`: saved but not ready.
- `ready_to_apply`: reviewed and ready for manual submission.
- `manual_required`: needs manual site-specific action.
- `applied`: user confirms it was submitted manually.
- Later follow-up states: `viewed`, `interview`, `offer`, `rejected`, `no_reply`.

When an application is marked as applied, ApplyOne sets `auto_applied` to `false` and updates the linked job status to `applied`.

## Build and Type Check

```powershell
npm run typecheck
npm run build
```

## Future Deployment Notes

The public Pages project exists at `https://applyone.pages.dev`.

Frontend Pages project:

```powershell
npx wrangler pages project create applyone
npm run build --workspace frontend
npx wrangler pages deploy ./frontend/dist --project-name applyone --branch main
```

Worker deployment:

```powershell
npx wrangler secret put GEMINI_API_KEY --config ./wrangler.toml
npx wrangler deploy
```

Production API wiring and deployment automation are not part of Phase 4A.

Future phases will add LinkedIn OAuth, Playwright automation, interview preparation, and GitHub Actions. Those features are intentionally not implemented in Phase 4A.
