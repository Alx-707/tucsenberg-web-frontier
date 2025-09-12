/**
 * WhatsApp API 批量和业务配置请求类型
 * WhatsApp API Batch and Business Configuration Request Types
 */

/**
 * 批量请求
 * Batch request
 */
export interface BatchRequest {
  requests: Array<{
    method: 'POST';
    relative_url: string;
    body: string;
  }>;
}

/**
 * 业务档案更新请求
 * Business profile update request
 */
export interface BusinessProfileUpdateRequest {
  messaging_product: 'whatsapp';
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_handle?: string;
  websites?: string[];
  vertical?: string;
}
