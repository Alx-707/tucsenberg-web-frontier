/**
 * Airtable Service - Main Operations Tests
 *
 * 主要操作集成测试，包括：
 * - 核心服务导出验证
 * - 基本操作集成测试
 * - 错误处理验证
 * 
 * 详细测试请参考：
 * - airtable-crud.test.ts - CRUD操作专门测试
 * - airtable-configuration.test.ts - 配置功能测试
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

describe('Airtable Service - Main Operations Tests', () => {
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

  const validFormData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    company: 'Test Company',
    message: 'This is a test message',
    acceptPrivacy: true,
    website: '',
  };

  describe('核心服务导出验证', () => {
    it('should export AirtableService class', () => {
      expect(AirtableService).toBeDefined();
      expect(typeof AirtableService).toBe('function');
    });

    it('should create AirtableService instance', () => {
      const service = new AirtableService();
      expect(service).toBeInstanceOf(AirtableService);
    });
  });

  describe('基本操作集成测试', () => {
    it('should handle basic contact creation', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as AirtableServicePrivate).isConfigured = true;
      (service as AirtableServicePrivate).base = {
        table: mockTable,
      };

      // Mock successful creation
      mockCreate.mockResolvedValue([
        {
          id: 'rec123456',
          fields: validFormData,
          createdTime: '2023-01-01T00:00:00Z',
        },
      ]);

      const result = await service.createContact(validFormData);

      expect(result).toEqual({ id: 'rec123456' });
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should handle basic contact retrieval', async () => {
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

    it('should handle contact status updates', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      mockUpdate.mockResolvedValue([
        {
          id: 'rec123456',
          fields: { Status: 'Contacted' },
          createdTime: '2023-01-01T00:00:00Z',
        },
      ]);

      const result = await service.updateContactStatus('rec123456', 'Contacted');

      expect(result).toEqual({ id: 'rec123456' });
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle contact deletion', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      mockDestroy.mockResolvedValue([{ id: 'rec123456', deleted: true }]);

      const result = await service.deleteContact('rec123456');

      expect(result).toEqual({ id: 'rec123456', deleted: true });
      expect(mockDestroy).toHaveBeenCalledWith(['rec123456']);
    });

    it('should check service readiness correctly', () => {
      const service = new AirtableService();

      // Test with missing configuration
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      expect(service.isReady()).toBe(false);

      // Test with valid configuration
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };
      expect(service.isReady()).toBe(true);
    });
  });

  describe('错误处理验证', () => {
    it('should handle missing configuration gracefully', async () => {
      const service = new AirtableService();

      // Ensure service is not configured
      (service as AirtableServicePrivate).isConfigured = false;
      (service as AirtableServicePrivate).base = null;

      await expect(service.createContact(validFormData)).rejects.toThrow(
        'Airtable service is not configured',
      );
    });

    it('should handle API errors gracefully', async () => {
      const service = new AirtableService();

      (service as AirtableServicePrivate).isConfigured = true;
      (service as AirtableServicePrivate).base = {
        table: mockTable,
      };

      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(service.createContact(validFormData)).rejects.toThrow(
        'API Error',
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

    it('should handle update errors gracefully', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      mockUpdate.mockRejectedValue(new Error('Update failed'));

      await expect(
        service.updateContactStatus('rec123456', 'Contacted'),
      ).rejects.toThrow('Update failed');
    });

    it('should handle deletion errors gracefully', async () => {
      const service = new AirtableService();

      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      mockDestroy.mockRejectedValue(new Error('Deletion failed'));

      await expect(service.deleteContact('rec123456')).rejects.toThrow(
        'Deletion failed',
      );
    });
  });

  describe('Mock验证', () => {
    it('should have proper mock setup', () => {
      expect(mockCreate).toBeDefined();
      expect(mockSelect).toBeDefined();
      expect(mockUpdate).toBeDefined();
      expect(mockDestroy).toBeDefined();
      expect(mockTable).toBeDefined();
      expect(mockBase).toBeDefined();
      expect(mockConfigure).toBeDefined();
    });

    it('should reset mocks between tests', () => {
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockSelect).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockDestroy).not.toHaveBeenCalled();
    });
  });

  describe('服务状态检查', () => {
    it('should return true when properly configured', () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: mockTable,
      };

      expect(service.isReady()).toBe(true);
    });

    it('should return false when not configured', async () => {
      const service = new AirtableService();

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      expect(service.isReady()).toBe(false);
    });
  });
});
