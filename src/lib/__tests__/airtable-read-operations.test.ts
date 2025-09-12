/**
 * Airtable Service - Read Operations Tests
 *
 * 专门测试读取操作功能，包括：
 * - 获取联系人记录
 * - 查询选项处理
 * - 错误处理
 * - 空结果处理
 */

import type { AirtableServicePrivate, DynamicImportModule } from '@/types/test-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Airtable
const mockCreate = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDestroy = vi.fn();
const mockTable = vi.fn().mockReturnValue({
  create: mockCreate,
  select: mockSelect,
  update: mockUpdate,
  destroy: mockDestroy,
});
const mockBase = vi.fn().mockReturnValue({
  table: mockTable,
});
const mockConfigure = vi.fn();

vi.mock('airtable', () => ({
  default: {
    configure: mockConfigure,
    base: mockBase,
  },
}));

// Use TypeScript Mock modules to bypass Vite's special handling
vi.mock('@/../env.mjs', async () => {
  const mockEnv = await import('./mocks/airtable-env');
  return mockEnv;
});

vi.mock('./logger', async () => {
  const mockLogger = await import('./mocks/logger');
  return mockLogger;
});

vi.mock('./validations', async () => {
  const mockValidations = await import('./mocks/airtable-validations');
  return mockValidations;
});

describe('Airtable Service - Read Operations Tests', () => {
  let AirtableService: typeof import('../airtable');

  beforeEach(async () => {
    // Clear mocks but preserve the mock functions
    mockCreate.mockReset();
    mockSelect.mockReset();
    mockUpdate.mockReset();
    mockDestroy.mockReset();
    mockTable.mockClear();
    mockBase.mockClear();
    mockConfigure.mockClear();

    // Dynamically import the module to ensure fresh instance
    const module = await import('../airtable') as DynamicImportModule;
    AirtableService = module.AirtableService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('获取联系人记录', () => {
    it('should retrieve contact records successfully', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      const mockRecords = [
        {
          id: 'rec123456',
          fields: { 'First Name': 'John', 'Last Name': 'Doe' },
          createdTime: '2023-01-01T00:00:00Z',
        },
      ];

      mockSelect.mockReturnValue({
        all: vi.fn().mockResolvedValue(mockRecords),
      });

      const result = await service.getContacts();

      expect(result).toEqual(mockRecords);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should handle query options', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      const options = {
        maxRecords: 10,
        sort: [{ field: 'Created Time', direction: 'desc' as const }],
      };

      mockSelect.mockReturnValue({
        all: vi.fn().mockResolvedValue([]),
      });

      await service.getContacts(options);

      expect(mockSelect).toHaveBeenCalledWith(options);
    });

    it('should throw error when service is not configured', async () => {
      const service = new AirtableService();

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(service.getContacts()).rejects.toThrow(
        'Airtable service is not configured',
      );
    });

    it('should handle retrieval errors gracefully', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      mockSelect.mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('Retrieval failed')),
      });

      await expect(service.getContacts()).rejects.toThrow('Retrieval failed');
    });

    it('should handle empty results', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      mockSelect.mockReturnValue({
        all: vi.fn().mockResolvedValue([]),
      });

      const result = await service.getContacts();

      expect(result).toEqual([]);
    });

    it('should handle complex query options', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      const complexOptions = {
        maxRecords: 50,
        sort: [
          { field: 'Created Time', direction: 'desc' as const },
          { field: 'First Name', direction: 'asc' as const },
        ],
        filterByFormula: "AND({Status} = 'New', {Email} != '')",
        fields: ['First Name', 'Last Name', 'Email', 'Company'],
      };

      mockSelect.mockReturnValue({
        all: vi.fn().mockResolvedValue([]),
      });

      await service.getContacts(complexOptions);

      expect(mockSelect).toHaveBeenCalledWith(complexOptions);
    });

    it('should handle large result sets', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      // Create a large mock dataset
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: `rec${index.toString().padStart(6, '0')}`,
        fields: {
          'First Name': `User${index}`,
          'Last Name': `Test${index}`,
          Email: `user${index}@example.com`,
        },
        createdTime: '2023-01-01T00:00:00Z',
      }));

      mockSelect.mockReturnValue({
        all: vi.fn().mockResolvedValue(largeDataset),
      });

      const result = await service.getContacts();

      expect(result).toHaveLength(1000);
      expect(result[0].fields['First Name']).toBe('User0');
      expect(result[999].fields['First Name']).toBe('User999');
    });

    it('should handle pagination options', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      const paginationOptions = {
        maxRecords: 100,
        pageSize: 20,
        offset: 'recABC123',
      };

      mockSelect.mockReturnValue({
        all: vi.fn().mockResolvedValue([]),
      });

      await service.getContacts(paginationOptions);

      expect(mockSelect).toHaveBeenCalledWith(paginationOptions);
    });

    it('should handle network timeout during retrieval', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockSelect.mockReturnValue({
        all: vi.fn().mockRejectedValue(timeoutError),
      });

      await expect(service.getContacts()).rejects.toThrow('Request timeout');
    });

    it('should handle API rate limiting during retrieval', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';

      mockSelect.mockReturnValue({
        all: vi.fn().mockRejectedValue(rateLimitError),
      });

      await expect(service.getContacts()).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle malformed response data', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      // Mock malformed data (missing required fields)
      const malformedData = [
        {
          // Missing id field
          fields: { 'First Name': 'John' },
          createdTime: '2023-01-01T00:00:00Z',
        },
        {
          id: 'rec123456',
          // Missing fields property
          createdTime: '2023-01-01T00:00:00Z',
        },
      ];

      mockSelect.mockReturnValue({
        all: vi.fn().mockResolvedValue(malformedData),
      });

      const result = await service.getContacts();

      // Should still return the data as-is, letting the caller handle validation
      expect(result).toEqual(malformedData);
    });

    it('should handle view-based queries', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      const viewOptions = {
        view: 'Grid view',
        maxRecords: 25,
      };

      mockSelect.mockReturnValue({
        all: vi.fn().mockResolvedValue([]),
      });

      await service.getContacts(viewOptions);

      expect(mockSelect).toHaveBeenCalledWith(viewOptions);
    });
  });
});
