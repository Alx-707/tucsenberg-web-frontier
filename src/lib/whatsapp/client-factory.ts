/**
 * WhatsApp Client Factory
 *
 * Factory function for creating WhatsApp clients based on environment.
 * Provides singleton management and environment-aware client selection.
 */

import { logger } from '@/lib/logger';
import type {
  WhatsAppClient,
  WhatsAppClientConfig,
  WhatsAppEnvironment,
} from '@/lib/whatsapp/client-interface';
import { MockWhatsAppClient } from '@/lib/whatsapp/mock-client';
import { RealWhatsAppClient } from '@/lib/whatsapp/real-client';

/**
 * Determine current environment for client selection
 */
function detectEnvironment(): WhatsAppEnvironment {
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;

  // Production: only when NODE_ENV is production AND Vercel env is production
  if (nodeEnv === 'production' && vercelEnv === 'production') {
    return 'production';
  }

  // Test environment
  if (nodeEnv === 'test') {
    return 'test';
  }

  // Development or preview deployments
  return 'development';
}

/**
 * Check if WhatsApp credentials are configured
 */
function hasValidCredentials(): boolean {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return Boolean(accessToken && phoneNumberId);
}

/**
 * Get WhatsApp client configuration from environment variables
 */
function getClientConfig(): WhatsAppClientConfig {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiVersion: 'v18.0',
  };
}

// Singleton instance
let clientInstance: WhatsAppClient | null = null;

/**
 * Create a WhatsApp client based on environment
 *
 * @param forceEnvironment - Override auto-detection
 * @returns WhatsApp client instance
 */
export function createWhatsAppClient(
  forceEnvironment?: WhatsAppEnvironment,
): WhatsAppClient {
  const environment = forceEnvironment || detectEnvironment();
  const hasCredentials = hasValidCredentials();

  logger.info(
    `[WhatsAppClientFactory] Environment: ${environment}, Has credentials: ${hasCredentials}`,
  );

  // Production requires real credentials
  if (environment === 'production') {
    if (!hasCredentials) {
      logger.error(
        '[WhatsAppClientFactory] Production requires valid WhatsApp credentials',
      );
      throw new Error('WhatsApp credentials not configured for production');
    }
    return new RealWhatsAppClient(getClientConfig());
  }

  // Development/test: use mock if no credentials, real if credentials exist
  if (hasCredentials) {
    logger.info(
      '[WhatsAppClientFactory] Using real client in non-production (credentials available)',
    );
    return new RealWhatsAppClient(getClientConfig());
  }

  logger.info(
    '[WhatsAppClientFactory] Using mock client (no credentials configured)',
  );
  return new MockWhatsAppClient();
}

/**
 * Get singleton WhatsApp client instance
 *
 * Creates client on first call, reuses on subsequent calls.
 * Use resetWhatsAppClient() to force re-creation.
 */
export function getWhatsAppClient(): WhatsAppClient {
  if (!clientInstance) {
    clientInstance = createWhatsAppClient();
  }
  return clientInstance;
}

/**
 * Reset the singleton client instance
 *
 * Useful for testing or when credentials change.
 */
export function resetWhatsAppClient(): void {
  clientInstance = null;
  logger.info('[WhatsAppClientFactory] Client instance reset');
}

/**
 * Check if the current environment uses mock client
 */
export function isMockClient(): boolean {
  const client = getWhatsAppClient();
  return client.getClientInfo().type === 'mock';
}

/**
 * Get client environment info for debugging
 */
export function getClientEnvironmentInfo(): {
  environment: WhatsAppEnvironment;
  clientType: 'real' | 'mock';
  hasCredentials: boolean;
} {
  const environment = detectEnvironment();
  const client = getWhatsAppClient();
  return {
    environment,
    clientType: client.getClientInfo().type,
    hasCredentials: hasValidCredentials(),
  };
}
