/**
 * WhatsApp API 常量定义
 * WhatsApp API Constants
 */

export const API_ENDPOINTS = {
  MESSAGES: 'messages',
  MEDIA: 'media',
  PHONE_NUMBERS: 'phone_numbers',
  BUSINESS_PROFILE: 'business_profile',
  MESSAGE_TEMPLATES: 'message_templates',
  ANALYTICS: 'analytics',
  BATCH: 'batch',
  WEBHOOKS: 'webhooks',
  ACCOUNT: 'account',
  APPS: 'apps'
} as const;

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
} as const;

export const API_VERSIONS = {
  V17: 'v17.0',
  V18: 'v18.0',
  V19: 'v19.0',
  V20: 'v20.0',
  LATEST: 'v20.0'
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  TEMPLATE: 'template',
  IMAGE: 'image',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  VIDEO: 'video',
  LOCATION: 'location',
  CONTACTS: 'contacts',
  INTERACTIVE: 'interactive',
  REACTION: 'reaction',
  STICKER: 'sticker'
} as const;

export const MEDIA_TYPES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  VIDEO: 'video',
  STICKER: 'sticker'
} as const;

export const TEMPLATE_CATEGORIES = {
  AUTHENTICATION: 'AUTHENTICATION',
  MARKETING: 'MARKETING',
  UTILITY: 'UTILITY'
} as const;

export const TEMPLATE_STATUSES = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  DISABLED: 'DISABLED',
  PAUSED: 'PAUSED'
} as const;

export const QUALITY_RATINGS = {
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  RED: 'RED',
  UNKNOWN: 'UNKNOWN'
} as const;

export const THROUGHPUT_LEVELS = {
  STANDARD: 'STANDARD',
  HIGH: 'HIGH'
} as const;

export const ANALYTICS_GRANULARITIES = {
  HALF_HOUR: 'HALF_HOUR',
  DAY: 'DAY',
  MONTH: 'MONTH'
} as const;

export const ANALYTICS_METRIC_TYPES = {
  COST: 'cost',
  CONVERSATION: 'conversation',
  PHONE_NUMBER_QUALITY_SCORE: 'phone_number_quality_score'
} as const;
