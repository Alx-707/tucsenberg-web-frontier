/**
 * WhatsApp API 用户和质量请求类型
 * WhatsApp API User and Quality Request Types
 */

/**
 * 用户阻止请求
 * User blocking request
 */
export interface UserBlockRequest {
  messaging_product: 'whatsapp';
  action: 'block' | 'unblock';
}

/**
 * 质量评级请求
 * Quality rating request
 */
export interface QualityRatingRequest {
  messaging_product: 'whatsapp';
  phone_number_id: string;
}
