# Change: Lead Pipeline Observability

## Why
Lead Pipeline's "at least one success" semantics can mask persistent failures in Resend or Airtable. Failed operations only log to console, with no alerting or retry mechanism.

## What Changes
- Add failure metrics and alerts for Resend/Airtable
- Implement structured logging for pipeline outcomes
- Define alerting thresholds for consecutive failures

## Impact
- Affected specs: `contact-form`
- Affected code:
  - `src/lib/lead-pipeline/process-lead.ts`
  - New: `src/lib/lead-pipeline/metrics.ts`

## Success Criteria
- Failed service calls produce measurable metrics
- Consecutive failures trigger alerts
- Dashboard visibility into pipeline health

## Dependencies
- None (can start independently)

## Rollback Strategy
- Remove metrics collection
- Pipeline continues to function
