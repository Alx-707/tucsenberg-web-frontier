---
type: "auto"
description: "Security implementation for a B2B website: path traversal prevention, CSP & security headers, Semgrep + eslint-plugin-security, dependency scanning, secrets handling"
---

# Security Implementation

- File system safety: normalize and validate paths, block `..` traversal; ensure access stays inside allowed roots.
- HTTP security headers & CSP: configure in next.config.ts; include X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, and a strict CSP.
- Dependency scanning: enable CI jobs for `pnpm audit`, Dependabot, and run Semgrep along with eslint security plugins.
- Secrets/env: never commit .env.* files; restrict access and rotate secrets as needed.
- Optional: implement simple rate limiting via Next.js Middleware for critical API routes.
- Optional: when rendering user-provided HTML, ensure proper sanitization is applied.

