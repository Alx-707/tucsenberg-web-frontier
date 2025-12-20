## MODIFIED Requirements

### Requirement: Lead Processing Observability
The lead pipeline SHALL emit metrics for all service interactions.

#### Scenario: Success metrics emitted
- **WHEN** Resend or Airtable call succeeds
- **THEN** a success metric is emitted with latency
- **AND** the metric identifies the service

#### Scenario: Failure metrics emitted
- **WHEN** Resend or Airtable call fails
- **THEN** a failure metric is emitted with error type
- **AND** consecutive failures can trigger alerts

#### Scenario: Structured logging
- **WHEN** lead processing completes
- **THEN** a structured log entry is written
- **AND** it includes: success/failure per service, total latency, lead ID

## ADDED Requirements

### Requirement: Alert Response Procedures
The system SHALL define clear response procedures for pipeline alerts.

#### Scenario: Consecutive failure alert triggered
- **WHEN** 5 or more consecutive failures occur for a service
- **THEN** an alert is logged with event type `lead_pipeline_alert`
- **AND** the log includes: service name, failure count, threshold, error type, timestamp

#### Scenario: Alert cooldown prevents spam
- **WHEN** an alert has been triggered within the cooldown period (10 seconds)
- **THEN** subsequent threshold breaches SHALL NOT trigger new alerts
- **AND** the cooldown resets after the period expires

#### Scenario: Service recovery resets failure tracking
- **WHEN** a service call succeeds after failures
- **THEN** the consecutive failure counter resets to zero
- **AND** future alerts require reaching threshold again

### Requirement: Alert Response Documentation
Operations team SHALL follow documented procedures when alerts occur.

#### Scenario: Resend service alert response
- **WHEN** lead_pipeline_alert is received for resend service
- **THEN** operator SHALL check Resend dashboard for service status
- **AND** verify API key validity if auth errors detected
- **AND** check rate limits if rate_limit errors detected
- **AND** verify network connectivity if network errors detected

#### Scenario: Airtable service alert response
- **WHEN** lead_pipeline_alert is received for airtable service
- **THEN** operator SHALL check Airtable status page for outages
- **AND** verify API key and base permissions if auth errors detected
- **AND** check table schema if validation errors detected
- **AND** verify network connectivity if network errors detected

#### Scenario: Escalation procedure
- **WHEN** alerts persist after initial troubleshooting
- **THEN** operator SHALL escalate to engineering team
- **AND** provide: alert logs, error types, duration of issue, attempted remediation steps
