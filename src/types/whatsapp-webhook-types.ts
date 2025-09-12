/**
 * WhatsApp Webhook 类型定义 - 主入口
 * WhatsApp Webhook Type Definitions - Main Entry Point
 *
 * 统一的WhatsApp Business API webhook类型入口，整合所有webhook相关类型定义
 */

// 重新导出所有模块的功能 - 类型导出
export type { WebhookEntry, WebhookPayload, MessageStatusUpdate, WebhookError, MessageContext, WebhookVerificationRequest, WebhookVerificationResponse, WebhookConfig, WebhookSubscription, WebhookProcessingResult, WebhookSecurityConfig, WebhookRetryConfig, WebhookMonitoringConfig, WebhookStatus, WebhookMetadata, WebhookBatchConfig, WebhookFilterConfig, WebhookTransformConfig, CompleteWebhookConfig, WebhookField, WebhookObjectType, WebhookChangeField } from './whatsapp-webhook-base';

// 常量和函数导出
export { WEBHOOK_FIELDS, WEBHOOK_OBJECT_TYPES, WEBHOOK_CHANGE_FIELDS, isWebhookPayload, isWebhookEntry, isMessageStatusUpdate, isWebhookError, isWebhookVerificationRequest } from './whatsapp-webhook-base';

export type { IncomingTextMessage, IncomingImageMessage, IncomingDocumentMessage, IncomingAudioMessage, IncomingVideoMessage, IncomingLocationMessage, IncomingContactsMessage, IncomingInteractiveMessage, IncomingReactionMessage, IncomingStickerMessage, IncomingOrderMessage, IncomingSystemMessage, IncomingButtonMessage, IncomingTemplateReply, IncomingWhatsAppMessage, IncomingMessageType, MediaMessageType, InteractiveMessageType } from './whatsapp-webhook-messages';

export { INCOMING_MESSAGE_TYPES, MEDIA_MESSAGE_TYPES, INTERACTIVE_MESSAGE_TYPES, isTextMessage, isImageMessage, isDocumentMessage, isAudioMessage, isVideoMessage, isLocationMessage, isContactsMessage, isInteractiveMessage, isReactionMessage, isStickerMessage, isOrderMessage, isSystemMessage, isButtonMessage, isTemplateReply, isMediaMessage, isInteractiveMessageType, getMessageText, getMessageMediaId, hasMessageContext } from './whatsapp-webhook-messages';

export type { MessageReceivedEvent, MessageStatusEvent, WebhookErrorEvent, MessageReadEvent, MessageDeliveryEvent, UserStatusChangeEvent, AccountUpdateEvent, TemplateStatusEvent, PhoneNumberQualityEvent, SecurityEvent, WebhookEvent, WebhookProcessor, EventFilter, EventProcessingConfig, EventStatistics, EventBatch, WebhookEventType, MessageEventType, SystemEventType } from './whatsapp-webhook-events';

export { WEBHOOK_EVENT_TYPES, MESSAGE_EVENT_TYPES, SYSTEM_EVENT_TYPES, isMessageReceivedEvent, isMessageStatusEvent, isMessageReadEvent, isMessageDeliveryEvent, isUserStatusChangeEvent, isAccountUpdateEvent, isTemplateStatusEvent, isPhoneNumberQualityEvent, isSecurityEvent, isWebhookErrorEvent, isMessageEvent, isSystemEvent, getEventPriority, shouldRetryEvent, getEventTimestamp, isEventExpired } from './whatsapp-webhook-events';

export type { WebhookParsingResult, WebhookValidationResult, SignatureVerificationConfig, WebhookProcessingContext, WebhookResponseConfig, DeduplicationConfig, RateLimitConfig, WebhookHealthCheck, WebhookDebugInfo, EventAggregationResult, WebhookUtils } from './whatsapp-webhook-utils';

export { isWebhookVerificationRequest, createWebhookVerificationResponse, createWebhookError, isRetryableError, isTimestampValid } from './whatsapp-webhook-utils';

// 向后兼容的重新导出
import type { WhatsAppContact, WhatsAppMessage, WhatsAppError, MessageStatus } from './whatsapp-base-types';

import type {
  WebhookEntry,
  WebhookPayload,
  MessageStatusUpdate,
  WebhookError,
  MessageContext,
  WebhookVerificationRequest,
  WebhookVerificationResponse,
  WebhookConfig,
  WebhookSubscription,
  WebhookProcessingResult,
  WebhookSecurityConfig,
  WebhookRetryConfig,
  WebhookMonitoringConfig,
  WebhookStatus,
  WebhookMetadata,
  WebhookBatchConfig,
  WebhookFilterConfig,
  WebhookTransformConfig,
  CompleteWebhookConfig,
  WEBHOOK_FIELDS } from
'./whatsapp-webhook-base';

import type {
  IncomingTextMessage,
  IncomingImageMessage,
  IncomingDocumentMessage,
  IncomingAudioMessage,
  IncomingVideoMessage,
  IncomingLocationMessage,
  IncomingContactsMessage,
  IncomingInteractiveMessage,
  IncomingReactionMessage,
  IncomingStickerMessage,
  IncomingOrderMessage,
  IncomingSystemMessage,
  IncomingButtonMessage,
  IncomingTemplateReply,
  IncomingWhatsAppMessage,
  INCOMING_MESSAGE_TYPES,
  MEDIA_MESSAGE_TYPES,
  INTERACTIVE_MESSAGE_TYPES } from
'./whatsapp-webhook-messages';

import type {
  MessageReceivedEvent,
  MessageStatusEvent,
  WebhookErrorEvent,
  MessageReadEvent,
  MessageDeliveryEvent,
  UserStatusChangeEvent,
  AccountUpdateEvent,
  TemplateStatusEvent,
  PhoneNumberQualityEvent,
  SecurityEvent,
  WebhookEvent,
  WebhookProcessor,
  EventFilter,
  EventProcessingConfig,
  EventStatistics,
  EventBatch,
  WEBHOOK_EVENT_TYPES } from
'./whatsapp-webhook-events';

import {
  WebhookUtils,
  isWebhookVerificationRequest,
  createWebhookVerificationResponse,
  createWebhookError,
  isRetryableError,
  isTimestampValid } from
'./whatsapp-webhook-utils';

// ==================== 向后兼容的类型别名 ====================

/**
 * 向后兼容的类型别名
 * Backward compatible type aliases
 */
export type {
  // 基础类型
  WebhookPayload as Webhook,
  WebhookEntry as Entry,
  MessageStatusUpdate as StatusUpdate,
  WebhookError as Error,

  // 消息类型
  IncomingWhatsAppMessage as IncomingMessage,
  IncomingTextMessage as TextMessage,
  IncomingImageMessage as ImageMessage,
  IncomingDocumentMessage as DocumentMessage,
  IncomingAudioMessage as AudioMessage,
  IncomingVideoMessage as VideoMessage,
  IncomingLocationMessage as LocationMessage,
  IncomingContactsMessage as ContactsMessage,
  IncomingInteractiveMessage as InteractiveMessage,
  IncomingReactionMessage as ReactionMessage,
  IncomingStickerMessage as StickerMessage,

  // 事件类型
  MessageReceivedEvent as MessageEvent,
  MessageStatusEvent as StatusEvent,
  WebhookErrorEvent as ErrorEvent,
  WebhookEvent as Event,

  // 配置类型
  WebhookConfig as Config,
  WebhookSubscription as Subscription,
  WebhookProcessor as Processor,
  WebhookProcessingResult as ProcessingResult,

  // 验证类型
  WebhookVerificationRequest as VerificationRequest,
  WebhookVerificationResponse as VerificationResponse };
