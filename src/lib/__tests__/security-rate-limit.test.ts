import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import {
  cleanupRateLimit,
  cleanupSlidingWindow,
  createRateLimitTier,
  getActiveLimits,
  getRateLimitStatus,
  rateLimit,
  rateLimitWithTier,
  resetRateLimit,
  slidingWindowRateLimit,
} from '../security-rate-limit';

describe('security-rate-limit', () => {
  let dateNowSpy: MockInstance;
  let currentTime: number;

  beforeEach(() => {
    currentTime = 1000000;
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(currentTime);
    // Reset all rate limit entries
    cleanupRateLimit();
    cleanupSlidingWindow();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rateLimit', () => {
    it('should allow first request', () => {
      const result = rateLimit('user-1');
      expect(result).toBe(true);
    });

    it('should allow requests within limit', () => {
      // Default is 10 requests per minute
      for (let i = 0; i < 10; i++) {
        expect(rateLimit('user-2')).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        rateLimit('user-3');
      }

      // 11th request should be blocked
      expect(rateLimit('user-3')).toBe(false);
    });

    it('should reset after window expires', () => {
      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        rateLimit('user-4');
      }
      expect(rateLimit('user-4')).toBe(false);

      // Advance time past the window (1 minute + 1ms)
      currentTime += 60001;
      dateNowSpy.mockReturnValue(currentTime);

      // Should be allowed again
      expect(rateLimit('user-4')).toBe(true);
    });

    it('should support custom maxRequests', () => {
      for (let i = 0; i < 5; i++) {
        expect(rateLimit('user-5', 5)).toBe(true);
      }
      expect(rateLimit('user-5', 5)).toBe(false);
    });

    it('should support custom window duration', () => {
      // Use 100ms window
      rateLimit('user-6', 1, 100);
      expect(rateLimit('user-6', 1, 100)).toBe(false);

      // Advance time past 100ms window
      currentTime += 101;
      dateNowSpy.mockReturnValue(currentTime);

      expect(rateLimit('user-6', 1, 100)).toBe(true);
    });

    it('should track different identifiers separately', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit('user-7');
      }
      expect(rateLimit('user-7')).toBe(false);

      // Different user should not be affected
      expect(rateLimit('user-8')).toBe(true);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return full remaining for new identifier', () => {
      const status = getRateLimitStatus('new-user');

      expect(status.remaining).toBe(9); // default 10 - 1 (assuming first call)
      expect(status.isLimited).toBe(false);
    });

    it('should return correct remaining after some requests', () => {
      for (let i = 0; i < 5; i++) {
        rateLimit('status-user');
      }

      const status = getRateLimitStatus('status-user');
      expect(status.remaining).toBe(5);
      expect(status.isLimited).toBe(false);
    });

    it('should indicate limited when exhausted', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit('exhausted-user');
      }

      const status = getRateLimitStatus('exhausted-user');
      expect(status.remaining).toBe(0);
      expect(status.isLimited).toBe(true);
    });

    it('should reset status after window expires', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit('expired-user');
      }

      // Advance past window
      currentTime += 60001;
      dateNowSpy.mockReturnValue(currentTime);

      const status = getRateLimitStatus('expired-user');
      expect(status.remaining).toBe(9);
      expect(status.isLimited).toBe(false);
    });
  });

  describe('cleanupRateLimit', () => {
    it('should remove expired entries', () => {
      rateLimit('cleanup-user-1');
      rateLimit('cleanup-user-2');

      // Advance time past window
      currentTime += 60001;
      dateNowSpy.mockReturnValue(currentTime);

      cleanupRateLimit();

      // Both should have fresh limits
      const status1 = getRateLimitStatus('cleanup-user-1');
      const status2 = getRateLimitStatus('cleanup-user-2');

      expect(status1.remaining).toBe(9);
      expect(status2.remaining).toBe(9);
    });

    it('should keep non-expired entries', () => {
      rateLimit('keep-user');

      // Advance time but not past window
      currentTime += 30000;
      dateNowSpy.mockReturnValue(currentTime);

      cleanupRateLimit();

      const activeLimits = getActiveLimits();
      expect(activeLimits.some((l) => l.identifier === 'keep-user')).toBe(true);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for specific identifier', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit('reset-user');
      }
      expect(rateLimit('reset-user')).toBe(false);

      resetRateLimit('reset-user');

      expect(rateLimit('reset-user')).toBe(true);
    });

    it('should not affect other identifiers', () => {
      for (let i = 0; i < 10; i++) {
        rateLimit('reset-a');
        rateLimit('reset-b');
      }

      resetRateLimit('reset-a');

      expect(rateLimit('reset-a')).toBe(true);
      expect(rateLimit('reset-b')).toBe(false);
    });
  });

  describe('getActiveLimits', () => {
    it('should return active limits for tracked identifiers', () => {
      const uniqueId1 = `get-active-limits-test-${Date.now()}-1`;
      const uniqueId2 = `get-active-limits-test-${Date.now()}-2`;
      rateLimit(uniqueId1);
      rateLimit(uniqueId2);

      const limits = getActiveLimits();
      expect(limits.some((l) => l.identifier === uniqueId1)).toBe(true);
      expect(limits.some((l) => l.identifier === uniqueId2)).toBe(true);
    });

    it('should not return expired entries', () => {
      rateLimit('will-expire');

      currentTime += 60001;
      dateNowSpy.mockReturnValue(currentTime);

      const limits = getActiveLimits();
      expect(limits.some((l) => l.identifier === 'will-expire')).toBe(false);
    });

    it('should include correct remaining count', () => {
      for (let i = 0; i < 3; i++) {
        rateLimit('partial-user');
      }

      const limits = getActiveLimits();
      const limit = limits.find((l) => l.identifier === 'partial-user');

      expect(limit).toBeDefined();
      expect(limit?.count).toBe(3);
      expect(limit?.remaining).toBe(7);
    });
  });

  describe('rateLimitWithTier', () => {
    it('should use normal tier by default', () => {
      // Normal tier: 10 requests
      for (let i = 0; i < 10; i++) {
        expect(rateLimitWithTier('tier-user-normal')).toBe(true);
      }
      expect(rateLimitWithTier('tier-user-normal')).toBe(false);
    });

    it('should apply strict tier (5 requests)', () => {
      for (let i = 0; i < 5; i++) {
        expect(rateLimitWithTier('tier-user-strict', 'strict')).toBe(true);
      }
      expect(rateLimitWithTier('tier-user-strict', 'strict')).toBe(false);
    });

    it('should apply relaxed tier (20 requests)', () => {
      for (let i = 0; i < 20; i++) {
        expect(rateLimitWithTier('tier-user-relaxed', 'relaxed')).toBe(true);
      }
      expect(rateLimitWithTier('tier-user-relaxed', 'relaxed')).toBe(false);
    });

    it('should apply premium tier (100 requests)', () => {
      for (let i = 0; i < 100; i++) {
        expect(rateLimitWithTier('tier-user-premium', 'premium')).toBe(true);
      }
      expect(rateLimitWithTier('tier-user-premium', 'premium')).toBe(false);
    });

    it('should fallback to normal for unknown tier', () => {
      for (let i = 0; i < 10; i++) {
        expect(rateLimitWithTier('tier-user-unknown', 'unknown')).toBe(true);
      }
      expect(rateLimitWithTier('tier-user-unknown', 'unknown')).toBe(false);
    });
  });

  describe('createRateLimitTier', () => {
    it('should create custom tier', () => {
      const tier = createRateLimitTier('custom', 50, 30000);

      expect(tier.name).toBe('custom');
      expect(tier.maxRequests).toBe(50);
      expect(tier.windowMs).toBe(30000);
    });

    it('should create tier with different parameters', () => {
      const tier = createRateLimitTier('api', 1000, 3600000);

      expect(tier.name).toBe('api');
      expect(tier.maxRequests).toBe(1000);
      expect(tier.windowMs).toBe(3600000);
    });
  });

  describe('slidingWindowRateLimit', () => {
    it('should allow first request', () => {
      expect(slidingWindowRateLimit('sliding-1')).toBe(true);
    });

    it('should allow requests within limit', () => {
      for (let i = 0; i < 10; i++) {
        expect(slidingWindowRateLimit('sliding-2')).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 10; i++) {
        slidingWindowRateLimit('sliding-3');
      }
      expect(slidingWindowRateLimit('sliding-3')).toBe(false);
    });

    it('should allow new requests as old ones expire (sliding window)', () => {
      // Make 10 requests at t=0
      for (let i = 0; i < 10; i++) {
        slidingWindowRateLimit('sliding-4', 10, 1000);
      }
      expect(slidingWindowRateLimit('sliding-4', 10, 1000)).toBe(false);

      // Advance time past window
      currentTime += 1001;
      dateNowSpy.mockReturnValue(currentTime);

      // Old timestamps should be expired, allowing new requests
      expect(slidingWindowRateLimit('sliding-4', 10, 1000)).toBe(true);
    });

    it('should support custom parameters', () => {
      for (let i = 0; i < 3; i++) {
        expect(slidingWindowRateLimit('sliding-5', 3, 500)).toBe(true);
      }
      expect(slidingWindowRateLimit('sliding-5', 3, 500)).toBe(false);
    });

    it('should track different identifiers separately', () => {
      for (let i = 0; i < 10; i++) {
        slidingWindowRateLimit('sliding-a');
      }
      expect(slidingWindowRateLimit('sliding-a')).toBe(false);

      // Different user should not be affected
      expect(slidingWindowRateLimit('sliding-b')).toBe(true);
    });
  });

  describe('cleanupSlidingWindow', () => {
    it('should remove old sliding window entries', () => {
      slidingWindowRateLimit('cleanup-sliding-1');

      // Advance time far past max age (2x default window)
      currentTime += 120001;
      dateNowSpy.mockReturnValue(currentTime);

      cleanupSlidingWindow();

      // Entry should be cleaned up, new request should succeed
      expect(slidingWindowRateLimit('cleanup-sliding-1')).toBe(true);
    });
  });
});
