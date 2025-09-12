/**
 * WhatsApp API 电话号码和Webhook请求类型
 * WhatsApp API Phone Number and Webhook Request Types
 */

/**
 * 电话号码注册请求
 * Phone number registration request
 */
export interface PhoneNumberRegistrationRequest {
  messaging_product: 'whatsapp';
  pin: string;
}

/**
 * 电话号码验证请求
 * Phone number verification request
 */
export interface PhoneNumberVerificationRequest {
  code: string;
}

/**
 * Webhook订阅请求
 * Webhook subscription request
 */
export interface WebhookSubscriptionRequest {
  object: 'whatsapp_business_account';
  callback_url: string;
  fields: string[];
  verify_token: string;
  access_token: string;
}

/**
 * 消息标记请求
 * Message marking request
 */
export interface MessageMarkRequest {
  messaging_product: 'whatsapp';
  status: 'read';
  message_id: string;
}
