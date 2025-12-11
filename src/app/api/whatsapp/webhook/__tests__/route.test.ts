import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../route';

// Mock dependencies
const mockVerifyWebhook = vi.hoisted(() => vi.fn());
const mockHandleIncomingMessage = vi.hoisted(() => vi.fn());

vi.mock('@/lib/whatsapp', () => ({
  getWhatsAppService: vi.fn(() => ({
    verifyWebhook: mockVerifyWebhook,
    handleIncomingMessage: mockHandleIncomingMessage,
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

function createMockGetRequest(
  searchParams: Record<string, string>,
): NextRequest {
  const url = new URL('http://localhost:3000/api/whatsapp/webhook');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString(), { method: 'GET' });
}

function createMockPostRequest(body: Record<string, unknown>): NextRequest {
  const url = 'http://localhost:3000/api/whatsapp/webhook';
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('WhatsApp Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyWebhook.mockReturnValue(null);
    mockHandleIncomingMessage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET - Webhook Verification', () => {
    it('should verify webhook with valid parameters', () => {
      mockVerifyWebhook.mockReturnValue('challenge-token-123');

      const request = createMockGetRequest({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'my-verify-token',
        'hub.challenge': 'challenge-token-123',
      });

      const response = GET(request);

      expect(response.status).toBe(200);
      expect(mockVerifyWebhook).toHaveBeenCalledWith(
        'subscribe',
        'my-verify-token',
        'challenge-token-123',
      );
    });

    it('should return challenge as plain text on successful verification', async () => {
      mockVerifyWebhook.mockReturnValue('challenge-token-123');

      const request = createMockGetRequest({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'my-verify-token',
        'hub.challenge': 'challenge-token-123',
      });

      const response = GET(request);
      const text = await response.text();

      expect(text).toBe('challenge-token-123');
      expect(response.headers.get('Content-Type')).toBe('text/plain');
    });

    it('should return 403 when verification fails', async () => {
      mockVerifyWebhook.mockReturnValue(null);

      const request = createMockGetRequest({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'invalid-token',
        'hub.challenge': 'challenge-123',
      });

      const response = GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Webhook verification failed');
    });

    it('should return 400 when hub.mode is missing', async () => {
      const request = createMockGetRequest({
        'hub.verify_token': 'my-token',
        'hub.challenge': 'challenge-123',
      });

      const response = GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required parameters');
    });

    it('should return 400 when hub.verify_token is missing', async () => {
      const request = createMockGetRequest({
        'hub.mode': 'subscribe',
        'hub.challenge': 'challenge-123',
      });

      const response = GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required parameters');
    });

    it('should return 400 when hub.challenge is missing', async () => {
      const request = createMockGetRequest({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'my-token',
      });

      const response = GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required parameters');
    });

    it('should return 400 when all parameters are missing', async () => {
      const request = createMockGetRequest({});

      const response = GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required parameters');
    });

    it('should return 500 when verification throws an error', async () => {
      mockVerifyWebhook.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const request = createMockGetRequest({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'my-token',
        'hub.challenge': 'challenge-123',
      });

      const response = GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST - Message Reception', () => {
    it('should process incoming message successfully', async () => {
      const messagePayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '1234567890',
                    phone_number_id: 'PHONE_NUMBER_ID',
                  },
                  messages: [
                    {
                      from: '9876543210',
                      id: 'wamid.abc123',
                      timestamp: '1234567890',
                      type: 'text',
                      text: { body: 'Hello' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const request = createMockPostRequest(messagePayload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockHandleIncomingMessage).toHaveBeenCalledWith(messagePayload);
    });

    it('should handle status update webhooks', async () => {
      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '1234567890',
                    phone_number_id: 'PHONE_NUMBER_ID',
                  },
                  statuses: [
                    {
                      id: 'wamid.abc123',
                      status: 'delivered',
                      timestamp: '1234567890',
                      recipient_id: '9876543210',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const request = createMockPostRequest(statusPayload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid JSON', async () => {
      const url = 'http://localhost:3000/api/whatsapp/webhook';
      const request = new NextRequest(url, {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(400);
    });

    it('should return 500 when message handler throws an error', async () => {
      mockHandleIncomingMessage.mockRejectedValue(new Error('Handler error'));

      const request = createMockPostRequest({
        object: 'whatsapp_business_account',
        entry: [],
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to process message');
    });

    it('should process empty entry array gracefully', async () => {
      const request = createMockPostRequest({
        object: 'whatsapp_business_account',
        entry: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle multiple entries', async () => {
      const multiEntryPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'ACCOUNT_1',
            changes: [{ value: {}, field: 'messages' }],
          },
          {
            id: 'ACCOUNT_2',
            changes: [{ value: {}, field: 'messages' }],
          },
        ],
      };

      const request = createMockPostRequest(multiEntryPayload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockHandleIncomingMessage).toHaveBeenCalledWith(multiEntryPayload);
    });
  });
});
