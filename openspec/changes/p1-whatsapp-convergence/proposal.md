# Change: WhatsApp Integration Convergence

## Why
Two separate WhatsApp implementations exist: new `whatsapp-core.ts` (send) and old `whatsapp.ts` (webhook/auto-reply). This causes behavior inconsistency, maintenance overhead, and the non-production environment check may cause runtime failures.

## What Changes
- Consolidate to single `whatsapp-core.ts` Integration Layer
- Migrate webhook to use new core
- Fix non-production initialization (provide mock client instead of early return)
- Remove old `whatsapp.ts` package dependency

## Impact
- Affected specs: `whatsapp-integration` (new)
- Affected code:
  - `src/lib/whatsapp-core.ts`
  - `src/lib/whatsapp-service.ts`
  - `src/lib/whatsapp.ts` (to be deprecated)
  - `src/app/api/whatsapp/send/route.ts`
  - `src/app/api/whatsapp/webhook/route.ts`

## Success Criteria
- Single WhatsApp implementation
- Webhook and send use same core
- Dev/preview environments work (with mock)
- Old package link removed

## Dependencies
- None (can start independently)

## Rollback Strategy
- Keep old `whatsapp.ts` as fallback during transition
- Feature flag for new vs old implementation
- Per-endpoint gradual migration
