/**
 * WhatsApp API 类型定义 - 主入口
 * WhatsApp API Type Definitions - Main Entry Point
 *
 * 统一的WhatsApp Business API类型入口，整合所有API相关类型定义
 */

// 重新导出所有模块的功能 - 类型导出
export type { SendMessageRequest, MediaUploadRequest, AnalyticsRequest, BatchRequest, BusinessProfileUpdateRequest, TemplateCreateRequest, TemplateDeleteRequest, TemplateStatusUpdateRequest, PhoneNumberRegistrationRequest, PhoneNumberVerificationRequest, WebhookSubscriptionRequest, MessageMarkRequest, UserBlockRequest, QualityRatingRequest, AccountInfoRequest, AppSettingsRequest, MessageReactionRequest, MessageForwardRequest, GroupMessageRequest, ApiRequestOptions, ApiRequest, WhatsAppApiRequest } from './whatsapp-api-requests';

// 函数导出
export { isSendMessageRequest, isMediaUploadRequest, isAnalyticsRequest, isBatchRequest } from './whatsapp-api-requests';

export type { SendMessageResponse, WhatsAppApiResponse, WhatsAppServiceResponse, MediaUploadResponse, MediaRetrieveResponse, PhoneNumberInfo, PhoneNumbersResponse, BusinessProfile, BusinessProfileResponse, TemplateStatus, TemplatesResponse, AnalyticsDataPoint, AnalyticsResponse, BatchResponse, RateLimitInfo, AccountInfoResponse, AppSettingsResponse, QualityRatingResponse, MessageStatusResponse, UserBlockStatusResponse, WebhookVerificationResponse, PaginationCursors, PaginationInfo, PaginatedResponse, WhatsAppApiErrorResponse, WhatsAppApiError, WhatsAppApiResponseType } from './whatsapp-api-responses';

export { isSendMessageResponse, isMediaUploadResponse, isWhatsAppApiError, isSuccessResponse, isErrorResponse } from './whatsapp-api-responses';

export type { ApiConfig, ExtendedApiConfig, EnvironmentConfig, WebhookConfig, ClientConfig, ApiEndpoint, HttpMethod, ApiVersion, MessageType, MediaType, TemplateStatusType, QualityRating, ThroughputLevel, AnalyticsGranularity, AnalyticsMetricType, ErrorCode } from './whatsapp-api-config';

export { validateApiConfig, validateWebhookConfig } from './whatsapp-api-config';

export type { WhatsAppApiErrorResponse, WhatsAppApiError, NetworkError, ValidationError, AuthenticationError, RateLimitError, BusinessLogicError, ServerError, WhatsAppError, ErrorSeverity, ErrorCategory, ErrorContext, ErrorDetails, ErrorHandlingStrategy, ErrorStatistics, ErrorReport, ErrorHandlingConfig } from './whatsapp-api-errors';

export { isWhatsAppApiError, isNetworkError, isValidationError, isAuthenticationError, isRateLimitError, isBusinessLogicError, isServerError } from './whatsapp-api-errors';

// 向后兼容的重新导出
import type { TemplateMessage } from './whatsapp-template-types';
import type { WhatsAppContact, LocationData, ContactData } from './whatsapp-base-types';

import type {
  SendMessageRequest,
  MediaUploadRequest,
  AnalyticsRequest,
  BatchRequest,
  BusinessProfileUpdateRequest,
  TemplateCreateRequest,
  TemplateDeleteRequest,
  PhoneNumberRegistrationRequest,
  PhoneNumberVerificationRequest,
  WebhookSubscriptionRequest,
  MessageMarkRequest,
  UserBlockRequest,
  QualityRatingRequest,
  TemplateStatusUpdateRequest,
  AccountInfoRequest,
  AppSettingsRequest,
  MessageReactionRequest,
  MessageForwardRequest,
  GroupMessageRequest,
  ApiRequestOptions,
  ApiRequest,
  WhatsAppApiRequest,
  RequestBuilders } from
'./whatsapp-api-requests';

import type {
  SendMessageResponse,
  WhatsAppApiResponse,
  WhatsAppServiceResponse,
  MediaUploadResponse,
  MediaRetrieveResponse,
  PhoneNumberInfo,
  PhoneNumbersResponse,
  BusinessProfile,
  BusinessProfileResponse,
  TemplateStatus,
  TemplatesResponse,
  AnalyticsDataPoint,
  AnalyticsResponse,
  BatchResponse,
  RateLimitInfo,
  AccountInfoResponse,
  AppSettingsResponse,
  QualityRatingResponse,
  MessageStatusResponse,
  UserBlockStatusResponse,
  WebhookVerificationResponse,
  PaginationCursors,
  PaginationInfo,
  PaginatedResponse,
  ApiResponse,
  WhatsAppApiErrorResponse,
  WhatsAppApiError,
  WhatsAppApiResponseType,
  ResponseUtils } from
'./whatsapp-api-responses';

import type {
  ApiConfig,
  ExtendedApiConfig,
  EnvironmentConfig,
  WebhookConfig,
  ClientConfig,
  ApiEndpoint,
  HttpMethod,
  ApiVersion,
  MessageType,
  MediaType,
  TemplateCategory,
  TemplateStatusType,
  QualityRating,
  ThroughputLevel,
  AnalyticsGranularity,
  AnalyticsMetricType,
  ErrorCode,
  API_ENDPOINTS,
  HTTP_METHODS,
  API_VERSIONS,
  MESSAGE_TYPES,
  MEDIA_TYPES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUSES,
  QUALITY_RATINGS,
  THROUGHPUT_LEVELS,
  ANALYTICS_GRANULARITIES,
  ANALYTICS_METRIC_TYPES,
  DEFAULT_API_CONFIG,
  DEFAULT_WEBHOOK_CONFIG,
  DEFAULT_REQUEST_OPTIONS,
  ERROR_CODE_MESSAGES,
  RETRYABLE_ERROR_CODES,
  ConfigUtils } from
'./whatsapp-api-config';

import type {
  WhatsAppError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  BusinessLogicError,
  ServerError,
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  ErrorDetails,
  ErrorHandlingStrategy,
  ErrorStatistics,
  ErrorReport,
  ErrorHandlingConfig,
  ErrorUtils } from
'./whatsapp-api-errors';

// ==================== 向后兼容的类型别名 ====================

/**
 * 向后兼容的类型别名
 * Backward compatible type aliases
 */
export type {
  // 请求类型
  SendMessageRequest as SendRequest,
  MediaUploadRequest as UploadRequest,
  AnalyticsRequest as AnalyticsReq,
  BatchRequest as BatchReq,
  ApiRequest as Request,
  ApiRequestOptions as RequestOptions,

  // 响应类型
  SendMessageResponse as SendResponse,
  WhatsAppApiResponse as ApiResponse,
  WhatsAppServiceResponse as ServiceResponse,
  MediaUploadResponse as UploadResponse,
  MediaRetrieveResponse as RetrieveResponse,
  PhoneNumbersResponse as PhoneNumbersResp,
  BusinessProfileResponse as BusinessProfileResp,
  TemplatesResponse as TemplatesResp,
  AnalyticsResponse as AnalyticsResp,
  BatchResponse as BatchResp,
  ApiResponse as Response,

  // 配置类型
  ApiConfig as Config,
  ExtendedApiConfig as ExtendedConfig,
  WebhookConfig as WebhookConf,
  ClientConfig as ClientConf,

  // 错误类型
  WhatsAppApiError as ApiError,
  WhatsAppApiErrorResponse as ErrorResponse,
  WhatsAppError as Error,
  NetworkError as NetError,
  ValidationError as ValidError,
  AuthenticationError as AuthError,
  RateLimitError as RateLimitErr,
  BusinessLogicError as BusinessError,
  ServerError as ServError,

  // 工具类型
  ApiEndpoint as Endpoint,
  HttpMethod as Method,
  MessageType as MsgType,
  MediaType as MediaT,
  TemplateCategory,
  QualityRating as Quality,
  ErrorCode as ErrCode,

  // 分页类型
  PaginatedResponse as PagedResponse,
  PaginationInfo as PageInfo,
  PaginationCursors as PageCursors };


/**
 * 向后兼容的导出别名
 * Backward compatible export aliases
 */
export {
  // 常量
  API_ENDPOINTS,
  HTTP_METHODS,
  API_VERSIONS,
  MESSAGE_TYPES,
  MEDIA_TYPES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUSES,
  QUALITY_RATINGS,
  THROUGHPUT_LEVELS,
  ANALYTICS_GRANULARITIES,
  ANALYTICS_METRIC_TYPES,

  // 默认配置
  DEFAULT_API_CONFIG,
  DEFAULT_WEBHOOK_CONFIG,
  DEFAULT_REQUEST_OPTIONS,

  // 错误相关
  ERROR_CODE_MESSAGES,
  RETRYABLE_ERROR_CODES,

  // 工具函数
  ConfigUtils,
  ResponseUtils,
  ErrorUtils,
  RequestBuilders };
