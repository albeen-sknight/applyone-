# ApplyOne

ApplyOne is Alberto Saeedi's public IT support portfolio and private single-owner job application workspace.

The public site at `https://applyone.pages.dev` shows Alberto's profile and CV. The private workspace is password protected and keeps CV parsing, job matching, application drafts, assisted local Playwright scripts, and interview practice behind owner authentication.

ApplyOne is not a hosted multi-user SaaS. To use it for yourself, fork it and self-host your own private instance.

## Public Security Notice

This repository is public.

Never commit `.env`, API keys, passwords, password hashes generated from a real password, session secrets, job-site credentials, private tokens, local CV paths, screenshots, logs, or Playwright run output.

The public CV at `frontend/public/cv/Aboulfazl_Saeedi_CV_English.pdf` is intentional. Replace it before publishing your own fork.

## Features

- Public portfolio landing page with CV links and contact links.
- Password-protected private ApplyOne workspace.
- Gemini CV parsing and editable structured profile.
- Job feed, matching, and application status tracking.
- Cover letter draft generation.
- Assisted local Playwright scripts that stop before submission.
- Text interview preparation with saved session history.
- Cloudflare Worker API, D1 database, and Pages frontend.

## Requirements

- Node.js 22+
- npm
- Cloudflare Wrangler
- Cloudflare account with D1, Workers, and Pages
- Gemini API key

## Local Setup

```powershell
npm install
npx playwright install chromium
npx wrangler d1 execute applyone-db --local --file .\workers\src\db\schema.sql
```

Run the Worker and frontend in separate terminals:

```powershell
npm run dev:worker
```

```powershell
$env:VITE_API_BASE_URL="http://127.0.0.1:8787"
npm run dev:frontend
Remove-Item Env:VITE_API_BASE_URL
```

Open:

```text
http://127.0.0.1:5173
```

Useful routes:

- `/` public portfolio
- `/login` owner login
- `/app` private dashboard
- `/app/perfil` profile and CV parsing
- `/app/empleos` job feed
- `/app/entrevistas` interview prep
- `/app/ajustes` settings

## Worker Secrets

Required Worker secrets:

- `GEMINI_API_KEY`
- `OWNER_PASSWORD_HASH`
- `SESSION_SECRET`
- `ALLOWED_ORIGINS`

Set them interactively. Do not pass secret values on the command line.

```powershell
npx wrangler secret put GEMINI_API_KEY --config .\wrangler.toml
npx wrangler secret put OWNER_PASSWORD_HASH --config .\wrangler.toml
npx wrangler secret put SESSION_SECRET --config .\wrangler.toml
npx wrangler secret put ALLOWED_ORIGINS --config .\wrangler.toml
```

For local development, use `.dev.vars` or your shell environment and keep those files out of git.

## Generate OWNER_PASSWORD_HASH

Use this Windows PowerShell-compatible SHA-256 helper. It prompts locally and does not require pasting the password into Codex or committing it.

```powershell
$plain = Read-Host "Enter owner password" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($plain)
try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $bytes = [Text.Encoding]::UTF8.GetBytes($password)

  $sha256 = [Security.Cryptography.SHA256]::Create()
  try {
    $hash = $sha256.ComputeHash($bytes)
    -join ($hash | ForEach-Object { $_.ToString("x2") })
  } finally {
    $sha256.Dispose()
  }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
```

Then set the printed hash as a Worker secret:

```powershell
npx wrangler secret put OWNER_PASSWORD_HASH --config .\wrangler.toml
```

## Generate SESSION_SECRET

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx wrangler secret put SESSION_SECRET --config .\wrangler.toml
```

## Cloudflare Setup

Create your own D1 database and update `wrangler.toml`:

```powershell
npx wrangler d1 create applyone-db
```

Apply the schema:

```powershell
npx wrangler d1 execute applyone-db --remote --file .\workers\src\db\schema.sql
```

Deploy the Worker:

```powershell
npx wrangler deploy --config .\wrangler.toml
```

Set the Pages environment variable:

```text
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

Build and deploy Pages:

```powershell
$env:VITE_API_BASE_URL="https://your-worker.your-subdomain.workers.dev"
npm run build --workspace frontend
npx wrangler pages deploy .\frontend\dist --project-name applyone
Remove-Item Env:VITE_API_BASE_URL
```

This deployment currently uses:

- Worker: `https://applyone-worker.natsu-dragneel13576.workers.dev`
- Pages: `https://applyone.pages.dev`
- Public CV: `https://applyone.pages.dev/cv/Aboulfazl_Saeedi_CV_English.pdf`

## Gemini Model

Default Worker variable:

```toml
GEMINI_MODEL = "gemini-2.5-flash"
```

If Gemini returns `This model is currently experiencing high demand`, retry later or set:

```toml
GEMINI_MODEL = "gemini-2.5-flash-lite"
```

`GEMINI_API_KEY` must be a Worker secret. It is never used in frontend code.

## Safety Notes

- Private API routes require the signed owner session cookie.
- CORS allows credentials only for configured origins.
- The public page does not read private D1 data.
- Scraper output is treated as plain text, not executable HTML.
- The frontend does not use `dangerouslySetInnerHTML` for scraped job content.
- Playwright scripts run locally, do not store credentials, do not bypass CAPTCHA, and stop before final submission.
- ApplyOne does not implement registration, OAuth login, password reset, or hosted multi-user accounts.

For extra protection on a public deployment, put the Worker and/or private `/app` routes behind Cloudflare Access.

## Assisted Applications

Run the local Worker first:

```powershell
npm run dev:worker
```

Generic ATS from a saved job:

```powershell
npm run apply:generic -- --job-id <job-id>
```

InfoJobs from a saved job:

```powershell
npm run apply:infojobs -- --job-id <job-id>
```

LinkedIn from a saved job:

```powershell
npm run apply:linkedin -- --job-id <job-id>
```

The scripts save local run output under `playwright/.runs/`, which is ignored by git.

## Validation

```powershell
npm run typecheck
npm run build
```

Local smoke checks:

- Public landing loads without login.
- `/login` loads.
- Wrong password fails.
- Correct password opens `/app`.
- `/api/profile` returns `401` without a session.
- Private routes load after login.
- CV parsing, job feed, applications, interview prep, and logout still work.
- Public CV link opens.
- Favicon files are linked in `frontend/index.html`.
- No secrets appear in `git diff`.

## Troubleshooting

- Gemini high demand: switch `GEMINI_MODEL` to `gemini-2.5-flash-lite` or retry later.
- CORS or cookie issues: verify `ALLOWED_ORIGINS` includes the exact Pages origin and local dev origins.
- Pages cannot reach Worker: verify `VITE_API_BASE_URL` in Cloudflare Pages and rebuild.
- D1 local vs remote data: local `--local` data and deployed `--remote` data are separate.
- Missing secrets: use `npx wrangler secret put <NAME> --config .\wrangler.toml`.
- Pages disconnected from Git: reconnect in Cloudflare UI or use manual `wrangler pages deploy`.
- Large PDF.js chunk warning: expected from the PDF parser dependency unless you choose to tune bundling later.
- CodeQL scraper alerts: `workers/src/scrapers/common.ts` uses conservative plain-text extraction and avoids returning executable HTML.

## Public Assets

- `frontend/public/favicon.svg`
- `frontend/public/favicon.ico`
- `frontend/public/apple-touch-icon.png`
- `frontend/public/site.webmanifest`
- `frontend/public/cv/Aboulfazl_Saeedi_CV_English.pdf`

Replace the profile copy, links, icons, and CV when publishing a fork for another person.

## GitHub Security

Repository security settings should be maintained in GitHub Settings:

- Security policy enabled
- Security advisories enabled
- Private vulnerability reporting enabled
- Dependabot alerts enabled
- Code scanning alerts enabled
- Secret scanning alerts enabled

Default CodeQL/code scanning is enabled through GitHub settings; this repo does not add a duplicate workflow or require `GEMINI_API_KEY` in GitHub Actions.
