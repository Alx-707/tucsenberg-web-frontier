/**
 * WhatsApp Module - Unified Entry Point
 *
 * Re-exports all WhatsApp client components for easy importing.
 * This module provides the unified WhatsApp integration layer.
 */

// Client interface
export type {
  WhatsAppClient,
  WhatsAppClientConfig,
  WhatsAppClientInfo,
  WhatsAppEnvironment,
} from '@/lib/whatsapp/client-interface';

// Client implementations
export { MockWhatsAppClient } from '@/lib/whatsapp/mock-client';
export { RealWhatsAppClient } from '@/lib/whatsapp/real-client';

// Factory and utilities
export {
  createWhatsAppClient,
  getWhatsAppClient,
  resetWhatsAppClient,
  isMockClient,
  getClientEnvironmentInfo,
} from '@/lib/whatsapp/client-factory';
