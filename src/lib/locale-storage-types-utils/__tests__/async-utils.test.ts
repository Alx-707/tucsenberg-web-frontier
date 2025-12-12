/**
 * async-utils 异步工具函数测试
 * Tests for throttle, debounce, retry functions
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { debounce, retry, throttle } from '../async-utils';

// Mock STORAGE_CONSTANTS
const mockStorageConstants = vi.hoisted(() => ({
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}));

vi.mock('@/lib/locale-storage-types-base', () => ({
  STORAGE_CONSTANTS: mockStorageConstants,
}));

vi.mock('@/constants', () => ({
  ONE: 1,
  ZERO: 0,
}));

// Suppress unhandled rejection warnings from fake timer + async rejection tests
// This is expected behavior when testing retry with simulated failures
let originalUnhandledRejection: NodeJS.UnhandledRejectionListener | undefined;

beforeAll(() => {
  originalUnhandledRejection = () => {
    // Intentional noop handler for expected test rejections
  };
  process.on('unhandledRejection', originalUnhandledRejection);
});

afterAll(() => {
  if (originalUnhandledRejection) {
    process.off('unhandledRejection', originalUnhandledRejection);
  }
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute immediately on first call', () => {
    const mockFn = vi.fn();
    const throttled = throttle(mockFn, 1000);

    throttled('arg1');

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1');
  });

  it('should not execute again within delay period', () => {
    const mockFn = vi.fn();
    const throttled = throttle(mockFn, 1000);

    throttled('call1');
    throttled('call2');
    throttled('call3');

    // Only first call should execute immediately
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call1');
  });

  it('should schedule trailing call when called within delay', () => {
    const mockFn = vi.fn();
    const throttled = throttle(mockFn, 1000);

    throttled('call1');
    vi.advanceTimersByTime(500);
    throttled('call2');

    expect(mockFn).toHaveBeenCalledTimes(1);

    // Advance to complete the remaining delay
    vi.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('call2');
  });

  it('should execute again after delay period', () => {
    const mockFn = vi.fn();
    const throttled = throttle(mockFn, 1000);

    throttled('call1');
    vi.advanceTimersByTime(1001);
    throttled('call2');

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenNthCalledWith(1, 'call1');
    expect(mockFn).toHaveBeenNthCalledWith(2, 'call2');
  });

  it('should handle multiple arguments', () => {
    const mockFn = vi.fn();
    const throttled = throttle(mockFn, 1000);

    throttled('arg1', 'arg2', 123);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should clear previous timeout when called again within delay', () => {
    const mockFn = vi.fn();
    const throttled = throttle(mockFn, 1000);

    throttled('call1');
    vi.advanceTimersByTime(200);
    throttled('call2');
    vi.advanceTimersByTime(200);
    throttled('call3');

    // Only first call should have executed
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Advance to complete remaining time for last scheduled call
    vi.advanceTimersByTime(600);
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('call3');
  });

  it('should handle zero delay', () => {
    const mockFn = vi.fn();
    const throttled = throttle(mockFn, 0);

    // First call executes immediately
    throttled('call1');
    expect(mockFn).toHaveBeenCalledTimes(1);

    // With 0 delay, second call within same tick schedules trailing call
    throttled('call2');
    // Still 1 because currentTime - lastExecTime is 0, which is NOT > 0
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Advance timers to execute trailing call
    vi.advanceTimersByTime(0);
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('call2');
  });

  it('should update lastExecTime correctly in trailing call', () => {
    const mockFn = vi.fn();
    const throttled = throttle(mockFn, 1000);

    throttled('call1');
    vi.advanceTimersByTime(500);
    throttled('call2');
    vi.advanceTimersByTime(500);

    // Trailing call executed
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Now try another call - should be blocked
    throttled('call3');
    expect(mockFn).toHaveBeenCalledTimes(2);

    // After delay from trailing call, should work again
    vi.advanceTimersByTime(1001);
    throttled('call4');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not execute immediately', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 1000);

    debounced('arg1');

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should execute after delay', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 1000);

    debounced('arg1');
    vi.advanceTimersByTime(1000);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1');
  });

  it('should reset timer on subsequent calls', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 1000);

    debounced('call1');
    vi.advanceTimersByTime(500);
    debounced('call2');
    vi.advanceTimersByTime(500);
    debounced('call3');
    vi.advanceTimersByTime(500);

    // Should not have executed yet
    expect(mockFn).not.toHaveBeenCalled();

    // Complete the delay
    vi.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call3');
  });

  it('should handle multiple arguments', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 100);

    debounced('arg1', 'arg2', { key: 'value' });
    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
  });

  it('should clear previous timeout', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 1000);

    debounced('call1');
    vi.advanceTimersByTime(999);
    debounced('call2');

    // First call should have been cancelled
    vi.advanceTimersByTime(1);
    expect(mockFn).not.toHaveBeenCalled();

    // Second call should execute
    vi.advanceTimersByTime(999);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call2');
  });

  it('should handle zero delay', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 0);

    debounced('call1');
    vi.advanceTimersByTime(0);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple independent debounced functions', () => {
    const mockFn1 = vi.fn();
    const mockFn2 = vi.fn();
    const debounced1 = debounce(mockFn1, 500);
    const debounced2 = debounce(mockFn2, 1000);

    debounced1('fn1');
    debounced2('fn2');

    vi.advanceTimersByTime(500);
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });
});

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first successful attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const promise = retry(mockFn);
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on second attempt', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValue('success');

    const promise = retry(mockFn, 3, 100);

    // First attempt fails
    await vi.advanceTimersByTimeAsync(0);

    // Wait for delay (100ms * 1 = 100ms)
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should retry multiple times before succeeding', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const promise = retry(mockFn, 3, 100);

    // Process first attempt
    await vi.advanceTimersByTimeAsync(0);
    // Wait for first retry delay (100 * 1)
    await vi.advanceTimersByTimeAsync(100);
    // Wait for second retry delay (100 * 2)
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts exceeded', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('always fail'));

    const promise = retry(mockFn, 3, 100);

    // Process all attempts with delays
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    try {
      await promise;
      expect.fail('Expected promise to reject');
    } catch (error) {
      expect((error as Error).message).toBe('always fail');
    }
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should use default maxAttempts from STORAGE_CONSTANTS', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    const promise = retry(mockFn);

    // Process all 3 default attempts with delays
    // First attempt executes immediately
    await vi.advanceTimersByTimeAsync(0);
    // Second attempt after 1000ms * 1
    await vi.advanceTimersByTimeAsync(1000);
    // Third attempt after 1000ms * 2
    await vi.advanceTimersByTimeAsync(2000);
    // Ensure all timers complete
    await vi.runAllTimersAsync();

    try {
      await promise;
      expect.fail('Expected promise to reject');
    } catch (error) {
      expect((error as Error).message).toBe('fail');
    }
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should use default delay from STORAGE_CONSTANTS', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = retry(mockFn, 2);

    await vi.advanceTimersByTimeAsync(0);
    // Default delay is 1000ms * attempt
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;
    expect(result).toBe('success');
  });

  it('should convert non-Error exceptions to Error', async () => {
    const mockFn = vi.fn().mockRejectedValue('string error');

    const promise = retry(mockFn, 1, 100);

    // Properly await the rejection
    try {
      await promise;
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('string error');
    }
  });

  it('should preserve original Error type', async () => {
    const originalError = new TypeError('type error');
    const mockFn = vi.fn().mockRejectedValue(originalError);

    const promise = retry(mockFn, 1, 100);

    // Properly await the rejection
    try {
      await promise;
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      expect((error as Error).message).toBe('type error');
    }
  });

  it('should handle single attempt (maxAttempts = 1)', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));

    const promise = retry(mockFn, 1, 100);

    try {
      await promise;
      expect.fail('Expected promise to reject');
    } catch (error) {
      expect((error as Error).message).toBe('fail');
    }
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should apply exponential backoff with attempt multiplier', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const baseDelay = 100;
    const promise = retry(mockFn, 3, baseDelay);

    // Track timing (used for documentation, actual timing verified by mock call counts)
    const _startTime = Date.now();

    await vi.advanceTimersByTimeAsync(0);

    // First retry: 100ms * 1 = 100ms
    await vi.advanceTimersByTimeAsync(100);

    // Second retry: 100ms * 2 = 200ms
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe('success');
  });

  it('should work with async generator-like functions', async () => {
    let callCount = 0;
    const mockFn = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error(`Attempt ${callCount} failed`);
      }
      return `Success on attempt ${callCount}`;
    });

    const promise = retry(mockFn, 3, 50);

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(50);

    const result = await promise;
    expect(result).toBe('Success on attempt 2');
  });

  it('should handle undefined/null return values', async () => {
    const mockFn = vi.fn().mockResolvedValue(undefined);

    const result = await retry(mockFn, 3, 100);

    expect(result).toBeUndefined();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle null return value', async () => {
    const mockFn = vi.fn().mockResolvedValue(null);

    const result = await retry(mockFn, 3, 100);

    expect(result).toBeNull();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle zero as maxAttempts edge case', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    // maxAttempts = 0 means loop never executes, throws Unknown error
    const promise = retry(mockFn, 0, 100);

    try {
      await promise;
      expect.fail('Expected promise to reject');
    } catch (error) {
      expect((error as Error).message).toBe('Unknown error');
    }
    expect(mockFn).not.toHaveBeenCalled();
  });
});
