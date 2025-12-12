/**
 * Lead Pipeline Metrics and Observability
 * Provides structured metrics, latency tracking, and failure alerting
 */

import { logger } from '@/lib/logger';
import { COUNT_FIVE, TEN_SECONDS_MS } from '@/constants';

/**
 * Service identifiers for metrics
 */
export const METRIC_SERVICES = {
  RESEND: 'resend',
  AIRTABLE: 'airtable',
} as const;

export type MetricService =
  (typeof METRIC_SERVICES)[keyof typeof METRIC_SERVICES];

/**
 * Metric event types
 */
export const METRIC_TYPES = {
  SUCCESS: 'success',
  FAILURE: 'failure',
} as const;

export type MetricType = (typeof METRIC_TYPES)[keyof typeof METRIC_TYPES];

/**
 * Error categories for failure metrics
 */
export const ERROR_TYPES = {
  TIMEOUT: 'timeout',
  NETWORK: 'network',
  VALIDATION: 'validation',
  RATE_LIMIT: 'rate_limit',
  AUTH: 'auth',
  UNKNOWN: 'unknown',
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

/**
 * Service metric data structure
 */
export interface ServiceMetric {
  service: MetricService;
  type: MetricType;
  latencyMs: number;
  timestamp: string;
  errorType?: ErrorType;
  errorMessage?: string;
}

/**
 * Pipeline processing summary log structure
 */
export interface PipelineSummary {
  leadId: string;
  leadType: string;
  totalLatencyMs: number;
  resend: { success: boolean; latencyMs: number; errorType?: ErrorType };
  airtable: { success: boolean; latencyMs: number; errorType?: ErrorType };
  overallSuccess: boolean;
  timestamp: string;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  consecutiveFailureThreshold: number;
  alertCooldownMs: number;
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  consecutiveFailureThreshold: COUNT_FIVE,
  alertCooldownMs: TEN_SECONDS_MS,
};

/**
 * Failure tracker for consecutive failure detection
 */
interface FailureState {
  consecutiveFailures: number;
  lastAlertTimestamp: number;
}

/**
 * Type-safe failure state storage using Map
 */
type FailureStateMap = Map<MetricService, FailureState>;

/**
 * Categorize error into known error types
 */
export function categorizeError(error: Error | unknown): ErrorType {
  if (!(error instanceof Error)) {
    return ERROR_TYPES.UNKNOWN;
  }

  const message = error.message.toLowerCase();

  if (message.includes('timeout') || message.includes('timed out')) {
    return ERROR_TYPES.TIMEOUT;
  }

  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('fetch failed')
  ) {
    return ERROR_TYPES.NETWORK;
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return ERROR_TYPES.RATE_LIMIT;
  }

  if (
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('api key')
  ) {
    return ERROR_TYPES.AUTH;
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return ERROR_TYPES.VALIDATION;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * Create initial failure state
 */
function createInitialFailureState(): FailureState {
  return { consecutiveFailures: 0, lastAlertTimestamp: 0 };
}

/**
 * Lead Pipeline Metrics Collector
 * Handles metric emission, latency tracking, and failure alerting
 */
export class LeadPipelineMetrics {
  private failureState: FailureStateMap;
  private alertConfig: AlertConfig;

  constructor(config?: Partial<AlertConfig>) {
    this.alertConfig = { ...DEFAULT_ALERT_CONFIG, ...config };
    this.failureState = new Map<MetricService, FailureState>([
      [METRIC_SERVICES.RESEND, createInitialFailureState()],
      [METRIC_SERVICES.AIRTABLE, createInitialFailureState()],
    ]);
  }

  /**
   * Emit a service metric
   */
  emitMetric(metric: ServiceMetric): void {
    const metricLog = {
      event: 'lead_pipeline_metric',
      ...metric,
    };

    if (metric.type === METRIC_TYPES.SUCCESS) {
      logger.info('Lead pipeline metric', metricLog);
      this.resetFailureCount(metric.service);
    } else {
      logger.error('Lead pipeline metric', metricLog);
      this.incrementFailureCount(metric.service, metric.errorType);
    }
  }

  /**
   * Record a success metric with latency
   */
  recordSuccess(service: MetricService, latencyMs: number): void {
    this.emitMetric({
      service,
      type: METRIC_TYPES.SUCCESS,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Record a failure metric with error details
   */
  recordFailure(
    service: MetricService,
    latencyMs: number,
    error: Error | unknown,
  ): void {
    const errorType = categorizeError(error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.emitMetric({
      service,
      type: METRIC_TYPES.FAILURE,
      latencyMs,
      timestamp: new Date().toISOString(),
      errorType,
      errorMessage,
    });
  }

  /**
   * Log pipeline processing summary
   */
  logPipelineSummary(summary: PipelineSummary): void {
    const level = summary.overallSuccess ? 'info' : 'error';
    const logData = {
      event: 'lead_pipeline_summary',
      ...summary,
    };

    if (level === 'info') {
      logger.info('Lead pipeline completed', logData);
    } else {
      logger.error('Lead pipeline completed', logData);
    }
  }

  /**
   * Reset consecutive failure count for a service
   */
  private resetFailureCount(service: MetricService): void {
    const state = this.failureState.get(service);
    if (state) {
      state.consecutiveFailures = 0;
    }
  }

  /**
   * Increment failure count and check for alert threshold
   */
  private incrementFailureCount(
    service: MetricService,
    errorType?: ErrorType,
  ): void {
    const state = this.failureState.get(service);
    if (!state) return;

    state.consecutiveFailures += 1;

    if (this.shouldTriggerAlert(service)) {
      this.triggerAlert(service, state.consecutiveFailures, errorType);
      state.lastAlertTimestamp = Date.now();
    }
  }

  /**
   * Check if alert should be triggered
   */
  private shouldTriggerAlert(service: MetricService): boolean {
    const state = this.failureState.get(service);
    if (!state) return false;

    const meetsThreshold =
      state.consecutiveFailures >= this.alertConfig.consecutiveFailureThreshold;
    const cooldownExpired =
      Date.now() - state.lastAlertTimestamp >= this.alertConfig.alertCooldownMs;

    return meetsThreshold && cooldownExpired;
  }

  /**
   * Trigger an alert for consecutive failures
   */
  private triggerAlert(
    service: MetricService,
    failureCount: number,
    errorType?: ErrorType,
  ): void {
    logger.error('Lead pipeline alert: consecutive failures', {
      event: 'lead_pipeline_alert',
      service,
      consecutiveFailures: failureCount,
      threshold: this.alertConfig.consecutiveFailureThreshold,
      lastErrorType: errorType ?? ERROR_TYPES.UNKNOWN,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current failure state (for testing/monitoring)
   */
  getFailureState(service: MetricService): FailureState {
    const state = this.failureState.get(service);
    return state ? { ...state } : createInitialFailureState();
  }

  /**
   * Reset all failure states (for testing)
   */
  resetAllStates(): void {
    this.failureState.set(METRIC_SERVICES.RESEND, createInitialFailureState());
    this.failureState.set(
      METRIC_SERVICES.AIRTABLE,
      createInitialFailureState(),
    );
  }
}

/**
 * Singleton metrics instance for application-wide use
 */
export const leadPipelineMetrics = new LeadPipelineMetrics();

/**
 * Timer utility for measuring operation latency
 */
export function createLatencyTimer(): { stop: () => number } {
  const startTime = Date.now();
  return {
    stop: () => Date.now() - startTime,
  };
}
