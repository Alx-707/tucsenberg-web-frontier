/**
 * 安全令牌生成工具
 * Security token generation utilities
 */

/**
 * Token generation constants
 */
const TOKEN_CONSTANTS = {
  // Token generation
  DEFAULT_TOKEN_LENGTH: 32,
  HEX_RADIX: 2,
  HEX_PAD_LENGTH: 2,
  HEX_BASE: 16,
} as const;

/**
 * Generate a secure random string
 */
export function generateSecureToken(
  length: number = TOKEN_CONSTANTS.DEFAULT_TOKEN_LENGTH,
): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Generate half the length in bytes since each byte becomes 2 hex characters
    const byteLength = Math.ceil(length / TOKEN_CONSTANTS.HEX_RADIX);
    const array = new Uint8Array(byteLength);
    crypto.getRandomValues(array);
    const hex = Array.from(array, (byte) =>
      byte
        .toString(TOKEN_CONSTANTS.HEX_BASE)
        .padStart(TOKEN_CONSTANTS.HEX_PAD_LENGTH, '0'),
    ).join('');
    return hex.substring(0, length);
  }

  // Fallback for environments without crypto.getRandomValues
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a secure random UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Set version (4) and variant bits
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;
    
    const hex = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32),
    ].join('-');
  }

  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a secure random API key
 */
export function generateApiKey(prefix: string = 'sk'): string {
  const randomPart = generateSecureToken(48);
  return `${prefix}_${randomPart}`;
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return generateSecureToken(64);
}

/**
 * Generate a secure CSRF token
 */
export function generateCsrfToken(): string {
  return generateSecureToken(32);
}

/**
 * Generate a secure nonce for CSP
 */
export function generateNonce(): string {
  return generateSecureToken(16);
}

/**
 * Generate a secure one-time password (OTP)
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += digits[array[i] % digits.length];
    }
  } else {
    // Fallback
    for (let i = 0; i < length; i++) {
      result += digits[Math.floor(Math.random() * digits.length)];
    }
  }
  
  return result;
}

/**
 * Generate a secure verification code (alphanumeric)
 */
export function generateVerificationCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Validate token format
 */
export function isValidToken(token: string, expectedLength?: number): boolean {
  if (typeof token !== 'string' || token.length === 0) {
    return false;
  }

  // Check if token contains only valid characters (alphanumeric and some special chars)
  const validTokenRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validTokenRegex.test(token)) {
    return false;
  }

  // Check length if specified
  if (expectedLength && token.length !== expectedLength) {
    return false;
  }

  return true;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a secure random salt for password hashing
 */
export function generateSalt(length: number = 16): string {
  return generateSecureToken(length * 2); // Double length for hex representation
}

/**
 * Token expiration utilities
 */
export interface TokenWithExpiry {
  token: string;
  expiresAt: number;
}

/**
 * Create a token with expiration
 */
export function createTokenWithExpiry(
  tokenLength: number = 32,
  expiryMinutes: number = 60,
): TokenWithExpiry {
  return {
    token: generateSecureToken(tokenLength),
    expiresAt: Date.now() + (expiryMinutes * 60 * 1000),
  };
}

/**
 * Check if token is expired
 */
export function isTokenExpired(tokenWithExpiry: TokenWithExpiry): boolean {
  return Date.now() > tokenWithExpiry.expiresAt;
}
