## 1. Metrics Definition
- [x] 1.1 Define metrics: resend_success, resend_failure, airtable_success, airtable_failure
- [x] 1.2 Add latency metrics for each service
- [x] 1.3 Create `src/lib/lead-pipeline/metrics.ts`

## 2. Pipeline Instrumentation
- [x] 2.1 Update `process-lead.ts` to emit metrics
- [x] 2.2 Log structured outcomes (JSON format)
- [x] 2.3 Include service-specific error details

## 3. Alerting Setup
- [x] 3.1 Define alerting thresholds (e.g., 5 consecutive failures)
- [x] 3.2 Integrate with logging/monitoring system
- [x] 3.3 Document alert response procedures

## 4. Validation
- [x] 4.1 Test metrics emission
- [x] 4.2 Simulate failures and verify logging
- [x] 4.3 Verify alerts trigger correctly
