import type { AirtableServicePrivate } from '@/types/test-types';
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

describe('Airtable Error Handling Tests', () => {
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

    // Reset modules to ensure fresh imports
    vi.resetModules();

    // Import the service fresh for each test
    AirtableService = await import('../airtable');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Handling - createContact', () => {
    const validFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Test Company',
      message: 'This is a test message',
      acceptPrivacy: true,
      website: '',
    };

    it('should handle API errors during creation', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as AirtableServicePrivate).isConfigured = true;
      (service as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          create: mockCreate,
        }),
      };

      mockCreate.mockClear();
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(service.createContact(validFormData)).rejects.toThrow(
        'Failed to create contact record',
      );
    });

    it('should handle validation errors', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as AirtableServicePrivate).isConfigured = true;
      (service as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          create: mockCreate,
        }),
      };

      const invalidFormData = {
        ...validFormData,
        email: 'invalid-email', // Invalid email format
      };

      mockCreate.mockClear();
      mockCreate.mockRejectedValue(new Error('Invalid email format'));

      await expect(service.createContact(invalidFormData)).rejects.toThrow(
        'Failed to create contact record',
      );
    });

    it('should handle network timeouts', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as AirtableServicePrivate).isConfigured = true;
      (service as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          create: mockCreate,
        }),
      };

      mockCreate.mockClear();
      mockCreate.mockRejectedValue(new Error('Network timeout'));

      await expect(service.createContact(validFormData)).rejects.toThrow(
        'Failed to create contact record',
      );
    });
  });

  describe('Error Handling - getContacts', () => {
    it('should handle API errors during retrieval', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      };

      const mockSelectChain = {
        all: vi.fn().mockRejectedValue(new Error('API Error')),
      };
      mockSelect.mockClear();
      mockSelect.mockReturnValue(mockSelectChain);

      await expect(service.getContacts()).rejects.toThrow(
        'Failed to fetch contact records',
      );
    });

    it('should handle empty results gracefully', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      };

      const mockSelectChain = {
        all: vi.fn().mockResolvedValue([]),
      };
      mockSelect.mockClear();
      mockSelect.mockReturnValue(mockSelectChain);

      const result = await service.getContacts();

      expect(result).toEqual([]);
    });

    it('should handle malformed records', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      };

      const malformedRecords = [
        {
          id: 'rec1',
          fields: null, // Malformed fields
          get: vi.fn().mockReturnValue('2023-01-01T00:00:00Z'),
        },
        {
          id: 'rec2',
          // Missing fields property
          get: vi.fn().mockReturnValue('2023-01-02T00:00:00Z'),
        },
      ];

      const mockSelectChain = {
        all: vi.fn().mockResolvedValue(malformedRecords),
      };
      mockSelect.mockClear();
      mockSelect.mockReturnValue(mockSelectChain);

      const result = await service.getContacts();

      expect(result).toHaveLength(2);
      expect(result[0].fields).toBeNull();
      expect(result[1].fields).toBeUndefined();
    });
  });

  describe('Error Handling - updateContactStatus', () => {
    it('should handle update errors', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      };

      mockUpdate.mockClear();
      mockUpdate.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateContactStatus('rec123456', 'Contacted')).rejects.toThrow(
        'Failed to update contact status',
      );
    });

    it('should handle invalid record IDs', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      };

      mockUpdate.mockClear();
      mockUpdate.mockRejectedValue(new Error('Record not found'));

      await expect(service.updateContactStatus('invalid-id', 'Contacted')).rejects.toThrow(
        'Failed to update contact status',
      );
    });

    it('should handle invalid status values', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      };

      mockUpdate.mockClear();
      mockUpdate.mockRejectedValue(new Error('Invalid status value'));

      await expect(service.updateContactStatus('rec123456', 'InvalidStatus')).rejects.toThrow(
        'Failed to update contact status',
      );
    });

    it('should throw error when service is not configured', async () => {
      const service = new AirtableService();

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(service.updateContactStatus('rec123456', 'Contacted')).rejects.toThrow(
        'Airtable service is not configured',
      );
    });
  });

  describe('Error Handling - deleteContact', () => {
    it('should handle deletion errors', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          destroy: mockDestroy,
        }),
      };

      mockDestroy.mockClear();
      mockDestroy.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteContact('rec123456')).rejects.toThrow(
        'Failed to delete contact',
      );
    });

    it('should handle invalid record IDs for deletion', async () => {
      const service = new AirtableService();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          destroy: mockDestroy,
        }),
      };

      mockDestroy.mockClear();
      mockDestroy.mockRejectedValue(new Error('Record not found'));

      await expect(service.deleteContact('invalid-id')).rejects.toThrow(
        'Failed to delete contact',
      );
    });

    it('should throw error when service is not configured for deletion', async () => {
      const service = new AirtableService();

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(service.deleteContact('rec123456')).rejects.toThrow(
        'Airtable service is not configured',
      );
    });
  });
});
