## 1. Core Enhancement
- [x] 1.1 Review `whatsapp-core.ts` current implementation
- [x] 1.2 Add `WhatsAppClient` interface for dependency injection
- [x] 1.3 Create `MockWhatsAppClient` for dev/test environments
- [x] 1.4 Remove "non-production early return" - use mock instead

## 2. Webhook Migration
- [x] 2.1 Analyze old webhook handler in `src/app/api/whatsapp/webhook/route.ts`
- [x] 2.2 Extract auto-reply logic to `whatsapp-service.ts`
- [x] 2.3 Update webhook to use `whatsapp-core.ts` client
- [x] 2.4 Add webhook signature verification

## 3. Send Endpoint Verification
- [x] 3.1 Verify `/api/whatsapp/send` uses new core correctly
- [x] 3.2 Add retry logic with backoff
- [x] 3.3 Ensure consistent error responses

## 4. Old Implementation Removal
- [x] 4.1 Identify all imports of `src/lib/whatsapp.ts`
- [x] 4.2 Migrate each to new core
- [x] 4.3 Mark old file as deprecated (N/A - no legacy file existed)
- [x] 4.4 Remove after migration complete (N/A - no legacy file existed)

## 5. Environment Handling
- [x] 5.1 Define env variables for client selection
- [x] 5.2 Mock client returns success in dev
- [x] 5.3 Real client used in production
- [x] 5.4 Document environment setup

## 6. Validation
- [x] 6.1 Test send in dev environment (mock)
- [x] 6.2 Test webhook receives and processes messages
- [x] 6.3 Run WhatsApp-related unit tests
- [x] 6.4 Verify in preview environment
