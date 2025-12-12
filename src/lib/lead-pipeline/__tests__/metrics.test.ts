/**
 * Lead Pipeline Metrics Tests
 * Tests for metrics collection, failure tracking, and alerting
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  categorizeError,
  createLatencyTimer,
  ERROR_TYPES,
  LeadPipelineMetrics,
  METRIC_SERVICES,
  METRIC_TYPES,
} from '../metrics';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('categorizeError', () => {
  it('should categorize timeout errors', () => {
    const error = new Error('Operation timed out');
    expect(categorizeError(error)).toBe(ERROR_TYPES.TIMEOUT);
  });

  it('should categorize network errors', () => {
    const errors = [
      new Error('Network error occurred'),
      new Error('ECONNREFUSED'),
      new Error('ENOTFOUND'),
      new Error('fetch failed'),
    ];

    for (const error of errors) {
      expect(categorizeError(error)).toBe(ERROR_TYPES.NETWORK);
    }
  });

  it('should categorize rate limit errors', () => {
    const error = new Error('Rate limit exceeded');
    expect(categorizeError(error)).toBe(ERROR_TYPES.RATE_LIMIT);
  });

  it('should categorize auth errors', () => {
    const errors = [
      new Error('Unauthorized access'),
      new Error('Authentication failed'),
      new Error('Invalid API key'),
    ];

    for (const error of errors) {
      expect(categorizeError(error)).toBe(ERROR_TYPES.AUTH);
    }
  });

  it('should categorize validation errors', () => {
    const error = new Error('Validation failed: invalid email');
    expect(categorizeError(error)).toBe(ERROR_TYPES.VALIDATION);
  });

  it('should return unknown for unrecognized errors', () => {
    const error = new Error('Something went wrong');
    expect(categorizeError(error)).toBe(ERROR_TYPES.UNKNOWN);
  });

  it('should return unknown for non-Error values', () => {
    expect(categorizeError('string error')).toBe(ERROR_TYPES.UNKNOWN);
    expect(categorizeError(null)).toBe(ERROR_TYPES.UNKNOWN);
    expect(categorizeError(undefined)).toBe(ERROR_TYPES.UNKNOWN);
  });
});

describe('createLatencyTimer', () => {
  it('should measure elapsed time', async () => {
    const timer = createLatencyTimer();
    const delayMs = 50;

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const elapsed = timer.stop();
    expect(elapsed).toBeGreaterThanOrEqual(delayMs - 10);
    expect(elapsed).toBeLessThan(delayMs + 50);
  });

  it('should return consistent results on multiple calls', () => {
    const timer = createLatencyTimer();
    const first = timer.stop();
    const second = timer.stop();

    // Both calls should return similar values (within margin)
    expect(Math.abs(second - first)).toBeLessThan(10);
  });
});

describe('LeadPipelineMetrics', () => {
  let metrics: LeadPipelineMetrics;

  beforeEach(() => {
    vi.clearAllMocks();
    metrics = new LeadPipelineMetrics();
  });

  describe('recordSuccess', () => {
    it('should emit success metric with latency', async () => {
      const { logger } = await import('@/lib/logger');

      metrics.recordSuccess(METRIC_SERVICES.RESEND, 150);

      expect(logger.info).toHaveBeenCalledWith(
        'Lead pipeline metric',
        expect.objectContaining({
          event: 'lead_pipeline_metric',
          service: METRIC_SERVICES.RESEND,
          type: METRIC_TYPES.SUCCESS,
          latencyMs: 150,
        }),
      );
    });

    it('should reset failure count on success', async () => {
      // Simulate some failures first
      metrics.recordFailure(METRIC_SERVICES.RESEND, 100, new Error('test'));
      metrics.recordFailure(METRIC_SERVICES.RESEND, 100, new Error('test'));

      const stateBeforeSuccess = metrics.getFailureState(
        METRIC_SERVICES.RESEND,
      );
      expect(stateBeforeSuccess.consecutiveFailures).toBe(2);

      // Record success
      metrics.recordSuccess(METRIC_SERVICES.RESEND, 150);

      const stateAfterSuccess = metrics.getFailureState(METRIC_SERVICES.RESEND);
      expect(stateAfterSuccess.consecutiveFailures).toBe(0);
    });
  });

  describe('recordFailure', () => {
    it('should emit failure metric with error details', async () => {
      const { logger } = await import('@/lib/logger');
      const error = new Error('Connection timed out');

      metrics.recordFailure(METRIC_SERVICES.AIRTABLE, 200, error);

      expect(logger.error).toHaveBeenCalledWith(
        'Lead pipeline metric',
        expect.objectContaining({
          event: 'lead_pipeline_metric',
          service: METRIC_SERVICES.AIRTABLE,
          type: METRIC_TYPES.FAILURE,
          latencyMs: 200,
          errorType: ERROR_TYPES.TIMEOUT,
          errorMessage: 'Connection timed out',
        }),
      );
    });

    it('should increment consecutive failure count', () => {
      metrics.recordFailure(METRIC_SERVICES.RESEND, 100, new Error('test'));
      expect(
        metrics.getFailureState(METRIC_SERVICES.RESEND).consecutiveFailures,
      ).toBe(1);

      metrics.recordFailure(METRIC_SERVICES.RESEND, 100, new Error('test'));
      expect(
        metrics.getFailureState(METRIC_SERVICES.RESEND).consecutiveFailures,
      ).toBe(2);
    });
  });

  describe('alerting', () => {
    it('should trigger alert after consecutive failures threshold', async () => {
      const { logger } = await import('@/lib/logger');
      const alertConfig = {
        consecutiveFailureThreshold: 3,
        alertCooldownMs: 0,
      };
      const alertMetrics = new LeadPipelineMetrics(alertConfig);

      // Record failures up to threshold
      for (let i = 0; i < 3; i++) {
        alertMetrics.recordFailure(
          METRIC_SERVICES.RESEND,
          100,
          new Error('test'),
        );
      }

      expect(logger.error).toHaveBeenCalledWith(
        'Lead pipeline alert: consecutive failures',
        expect.objectContaining({
          event: 'lead_pipeline_alert',
          service: METRIC_SERVICES.RESEND,
          consecutiveFailures: 3,
          threshold: 3,
        }),
      );
    });

    it('should not trigger alert before threshold', async () => {
      const { logger } = await import('@/lib/logger');
      const alertConfig = {
        consecutiveFailureThreshold: 5,
        alertCooldownMs: 0,
      };
      const alertMetrics = new LeadPipelineMetrics(alertConfig);

      // Record failures below threshold
      for (let i = 0; i < 4; i++) {
        alertMetrics.recordFailure(
          METRIC_SERVICES.RESEND,
          100,
          new Error('test'),
        );
      }

      // Should not have alert log
      const alertCalls = vi
        .mocked(logger.error)
        .mock.calls.filter(
          (call) => call[0] === 'Lead pipeline alert: consecutive failures',
        );
      expect(alertCalls.length).toBe(0);
    });

    it('should respect cooldown period between alerts', async () => {
      const { logger } = await import('@/lib/logger');
      const alertConfig = {
        consecutiveFailureThreshold: 2,
        alertCooldownMs: 10000,
      };
      const alertMetrics = new LeadPipelineMetrics(alertConfig);

      // First batch of failures - should trigger alert
      alertMetrics.recordFailure(
        METRIC_SERVICES.RESEND,
        100,
        new Error('test'),
      );
      alertMetrics.recordFailure(
        METRIC_SERVICES.RESEND,
        100,
        new Error('test'),
      );

      // More failures immediately - should not trigger due to cooldown
      alertMetrics.recordFailure(
        METRIC_SERVICES.RESEND,
        100,
        new Error('test'),
      );
      alertMetrics.recordFailure(
        METRIC_SERVICES.RESEND,
        100,
        new Error('test'),
      );

      const alertCalls = vi
        .mocked(logger.error)
        .mock.calls.filter(
          (call) => call[0] === 'Lead pipeline alert: consecutive failures',
        );
      expect(alertCalls.length).toBe(1);
    });

    it('should track failures independently per service', () => {
      const alertConfig = {
        consecutiveFailureThreshold: 3,
        alertCooldownMs: 0,
      };
      const alertMetrics = new LeadPipelineMetrics(alertConfig);

      // Failures on Resend
      alertMetrics.recordFailure(
        METRIC_SERVICES.RESEND,
        100,
        new Error('test'),
      );
      alertMetrics.recordFailure(
        METRIC_SERVICES.RESEND,
        100,
        new Error('test'),
      );

      // Failures on Airtable
      alertMetrics.recordFailure(
        METRIC_SERVICES.AIRTABLE,
        100,
        new Error('test'),
      );

      expect(
        alertMetrics.getFailureState(METRIC_SERVICES.RESEND)
          .consecutiveFailures,
      ).toBe(2);
      expect(
        alertMetrics.getFailureState(METRIC_SERVICES.AIRTABLE)
          .consecutiveFailures,
      ).toBe(1);
    });
  });

  describe('logPipelineSummary', () => {
    it('should log success summary with info level', async () => {
      const { logger } = await import('@/lib/logger');

      metrics.logPipelineSummary({
        leadId: 'CON-123',
        leadType: 'contact',
        totalLatencyMs: 500,
        resend: { success: true, latencyMs: 200 },
        airtable: { success: true, latencyMs: 300 },
        overallSuccess: true,
        timestamp: '2025-01-01T00:00:00.000Z',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Lead pipeline completed',
        expect.objectContaining({
          event: 'lead_pipeline_summary',
          leadId: 'CON-123',
          overallSuccess: true,
        }),
      );
    });

    it('should log failure summary with error level', async () => {
      const { logger } = await import('@/lib/logger');

      metrics.logPipelineSummary({
        leadId: 'CON-456',
        leadType: 'contact',
        totalLatencyMs: 500,
        resend: {
          success: false,
          latencyMs: 200,
          errorType: ERROR_TYPES.TIMEOUT,
        },
        airtable: {
          success: false,
          latencyMs: 300,
          errorType: ERROR_TYPES.NETWORK,
        },
        overallSuccess: false,
        timestamp: '2025-01-01T00:00:00.000Z',
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Lead pipeline completed',
        expect.objectContaining({
          event: 'lead_pipeline_summary',
          leadId: 'CON-456',
          overallSuccess: false,
        }),
      );
    });
  });

  describe('resetAllStates', () => {
    it('should reset all failure states', () => {
      metrics.recordFailure(METRIC_SERVICES.RESEND, 100, new Error('test'));
      metrics.recordFailure(METRIC_SERVICES.AIRTABLE, 100, new Error('test'));

      metrics.resetAllStates();

      expect(
        metrics.getFailureState(METRIC_SERVICES.RESEND).consecutiveFailures,
      ).toBe(0);
      expect(
        metrics.getFailureState(METRIC_SERVICES.AIRTABLE).consecutiveFailures,
      ).toBe(0);
    });
  });
});
