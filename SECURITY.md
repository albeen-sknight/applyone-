# Security Policy

ApplyOne is a public repository for a personal portfolio and a private, self-hostable job application workspace.

## Reporting a Vulnerability

Please use GitHub private vulnerability reporting when possible.

Do not open public issues for:
- leaked secrets
- authentication bypasses
- session or cookie issues
- CORS/security misconfigurations
- private data exposure

If private vulnerability reporting is unavailable, contact the repository owner directly without sharing exploit details publicly.

## Secret Handling

Never commit:
- `.env` or `.dev.vars`
- API keys
- Gemini keys
- owner passwords
- password hashes generated from real passwords
- session secrets
- Cloudflare tokens
- job-site credentials
- screenshots or logs containing private data

Worker secrets must be configured externally through Cloudflare Wrangler or the Cloudflare dashboard.

## Public Data

The CV file under `frontend/public/cv/` is intentionally public for the portfolio landing page. Do not place private documents in `frontend/public/`.

## Self-Hosting

Forks should configure their own Cloudflare Worker, D1 database, Gemini key, `OWNER_PASSWORD_HASH`, and `SESSION_SECRET`. Do not reuse secrets from another deployment.
