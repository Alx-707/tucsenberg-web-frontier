import { vi } from 'vitest';

/**
 * Mock logger for testing
 * 测试用日志模块 Mock
 */
export const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};
