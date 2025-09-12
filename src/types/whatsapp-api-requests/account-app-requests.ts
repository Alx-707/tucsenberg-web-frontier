/**
 * WhatsApp API 账户和应用设置请求类型
 * WhatsApp API Account and App Settings Request Types
 */

/**
 * 账户信息请求
 * Account info request
 */
export interface AccountInfoRequest {
  fields?: string[];
}

/**
 * 应用设置请求
 * App settings request
 */
export interface AppSettingsRequest {
  messaging_product: 'whatsapp';
  settings: {
    webhooks?: {
      url: string;
      fields: string[];
    };
    application?: {
      name: string;
      description?: string;
    };
  };
}
