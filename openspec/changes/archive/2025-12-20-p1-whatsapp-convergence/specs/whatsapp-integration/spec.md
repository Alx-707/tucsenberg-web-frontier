## ADDED Requirements

### Requirement: Unified WhatsApp Integration Layer
The system SHALL have a single WhatsApp client implementation for all operations.

#### Scenario: Send uses core client
- **WHEN** `/api/whatsapp/send` processes a request
- **THEN** it uses `whatsapp-core.ts` client
- **AND** not the deprecated `whatsapp.ts` package

#### Scenario: Webhook uses core client
- **WHEN** `/api/whatsapp/webhook` receives a message
- **THEN** it uses `whatsapp-core.ts` for any responses
- **AND** auto-reply logic is in `whatsapp-service.ts`

### Requirement: Environment-Safe Initialization
The WhatsApp client SHALL initialize safely in all environments.

#### Scenario: Development environment
- **WHEN** running in development
- **THEN** a mock client is used instead of real API calls
- **AND** no runtime errors occur

#### Scenario: Production environment
- **WHEN** running in production with valid credentials
- **THEN** the real WhatsApp API client is used
- **AND** messages are delivered

## REMOVED Requirements

### Requirement: Legacy WhatsApp Package
The old `whatsapp.ts` package-based implementation SHALL be deprecated.

**Reason**: Duplicate implementation causes inconsistency and maintenance burden.
**Migration**: All code migrates to `whatsapp-core.ts` client.
