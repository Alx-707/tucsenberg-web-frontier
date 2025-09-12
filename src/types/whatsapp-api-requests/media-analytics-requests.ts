/**
 * WhatsApp API 媒体和分析请求类型
 * WhatsApp API Media and Analytics Request Types
 */

/**
 * 媒体上传请求
 * Media upload request
 */
export interface MediaUploadRequest {
  messaging_product: 'whatsapp';
  file: File | Buffer;
  type: 'image' | 'document' | 'audio' | 'video' | 'sticker';
}

/**
 * 分析数据请求
 * Analytics request
 */
export interface AnalyticsRequest {
  start: string; // UNIX timestamp
  end: string; // UNIX timestamp
  granularity: 'HALF_HOUR' | 'DAY' | 'MONTH';
  metric_types?: Array<'cost' | 'conversation' | 'phone_number_quality_score'>;
  phone_numbers?: string[];
}
