# Security Implementation

## Security Principles

- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Minimum necessary permissions
- **Secure by Default**: Security enabled out of the box
- **Zero Trust**: Verify everything, trust no input

## XSS Prevention

- **Never** use unfiltered `dangerouslySetInnerHTML`
- Must use `DOMPurify.sanitize()` to filter user HTML
- URLs must validate protocol (only allow `https://` or `/`)

## Input Validation

- **All user input** must use Zod schema validation
- API routes must call `schema.parse(body)` before processing

### File Paths
- Never construct paths directly from user input
- Must use allowlist or `path.resolve()` + prefix check

## API Security

| Measure | Config |
|---------|--------|
| Rate Limiting | 5 requests/min/IP |
| CSRF | Cloudflare Turnstile |
| Headers | Configured in `src/config/security.ts` |

### Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Content Security Policy

- Config location: `src/config/security.ts`
- Mode: Report-only (monitoring)
- Report endpoint: `/api/csp-report`

## Sensitive Data

### Environment Variables (Never Commit)
- `AIRTABLE_API_KEY`
- `RESEND_API_KEY`
- `TURNSTILE_SECRET_KEY`

### Cookie Security Config
- `httpOnly: true` — Prevent XSS access
- `secure: true` — HTTPS only
- `sameSite: 'strict'` — Prevent CSRF

## Logging

- **Never log**: Passwords, API keys, PII
- Use `src/lib/logger.ts` for structured logging
- No `console.log` in production code

## Security Checklist

- [ ] All user input validated with Zod
- [ ] No unfiltered `dangerouslySetInnerHTML`
- [ ] API routes have Rate Limiting
- [ ] Sensitive cookies set httpOnly + secure
- [ ] Logs are sanitized
