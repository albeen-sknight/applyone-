# Security Policy

## Supported Versions

ApplyOne is currently a personal, single-owner project. Security fixes are applied to the `main` branch.

| Version / Branch | Supported |
| --- | --- |
| `main` | Yes |
| older commits / forks | No |

## Reporting a Vulnerability

If you find a security issue, please **do not open a public GitHub issue**.

Use GitHub's private vulnerability reporting for this repository if it is enabled, or contact the maintainer privately through the contact information listed on the public portfolio page.

Please include:

- A clear description of the issue.
- Steps to reproduce it.
- Affected route, file, endpoint, or deployment area.
- Whether any secret, token, CV data, or private application data may be exposed.
- Suggested fix, if you have one.

## Sensitive Data

This repository is public. Do not submit or commit:

- `.env` files
- API keys
- Cloudflare tokens
- Gemini API keys
- owner passwords
- password hashes from real passwords
- session secrets
- job-site credentials
- private CVs or screenshots
- Playwright run output

The public CV file in `frontend/public/cv/` is intentionally published as part of the public portfolio.

## Private Workspace

ApplyOne includes a password-protected private workspace. The following areas should not be accessible without authentication:

- profile/CV parsing
- job feed
- applications
- cover letters
- interview prep sessions
- private D1 data
- Gemini-powered private API routes

If you find a way to access private workspace data without authentication, report it privately.

## Expected Response

I will try to acknowledge valid reports as soon as practical and prioritize fixes based on impact.

High-risk issues include:

- exposed secrets
- authentication bypass
- private D1 data exposure
- Gemini key exposure
- unauthorized access to CV/application/interview data
- credential leakage

## Scope

In scope:

- Cloudflare Worker API
- Cloudflare Pages frontend
- D1 database access paths
- authentication/session handling
- CORS configuration
- secret handling
- public/private route separation

Out of scope:

- attacks requiring access to the maintainer's local machine
- denial-of-service testing
- spam, phishing, or social engineering
- automated scraping or load testing of the public deployment
