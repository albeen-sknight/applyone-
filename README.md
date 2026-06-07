# ApplyOne

ApplyOne is a private job application assistant for one owner. Phase 1 only sets up the foundation: a React frontend, a Cloudflare Worker API, D1 schema, and placeholders for future features.

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

Do not commit `.env`. Phase 1 does not use real API secrets yet.

Required later-phase values:

- `ANTHROPIC_API_KEY`
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

## Apply D1 Schema

Local D1:

```powershell
npx wrangler d1 execute applyone-db --local --file ./workers/src/db/schema.sql
```

Remote D1:

```powershell
npx wrangler d1 execute applyone-db --remote --file ./workers/src/db/schema.sql
```

## Build and Type Check

```powershell
npm run typecheck
npm run build
```

## Future Deployment Notes

Frontend Pages project:

```powershell
npx wrangler pages project create applyone
npm run build --workspace frontend
npx wrangler pages deploy ./frontend/dist --project-name applyone --branch main
```

Worker deployment:

```powershell
npx wrangler deploy
```

Future phases will add LinkedIn OAuth, Claude-backed generation, scraping, Playwright automation, CV parsing, interview preparation, and GitHub Actions. Those features are intentionally not implemented in Phase 1.
