## 1. Core Enhancement
- [ ] 1.1 Review `whatsapp-core.ts` current implementation
- [ ] 1.2 Add `WhatsAppClient` interface for dependency injection
- [ ] 1.3 Create `MockWhatsAppClient` for dev/test environments
- [ ] 1.4 Remove "non-production early return" - use mock instead

## 2. Webhook Migration
- [ ] 2.1 Analyze old webhook handler in `src/app/api/whatsapp/webhook/route.ts`
- [ ] 2.2 Extract auto-reply logic to `whatsapp-service.ts`
- [ ] 2.3 Update webhook to use `whatsapp-core.ts` client
- [ ] 2.4 Add webhook signature verification

## 3. Send Endpoint Verification
- [ ] 3.1 Verify `/api/whatsapp/send` uses new core correctly
- [ ] 3.2 Add retry logic with backoff
- [ ] 3.3 Ensure consistent error responses

## 4. Old Implementation Removal
- [ ] 4.1 Identify all imports of `src/lib/whatsapp.ts`
- [ ] 4.2 Migrate each to new core
- [ ] 4.3 Mark old file as deprecated
- [ ] 4.4 Remove after migration complete

## 5. Environment Handling
- [ ] 5.1 Define env variables for client selection
- [ ] 5.2 Mock client returns success in dev
- [ ] 5.3 Real client used in production
- [ ] 5.4 Document environment setup

## 6. Validation
- [ ] 6.1 Test send in dev environment (mock)
- [ ] 6.2 Test webhook receives and processes messages
- [ ] 6.3 Run WhatsApp-related unit tests
- [ ] 6.4 Verify in preview environment
