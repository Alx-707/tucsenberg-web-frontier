/**
 * WhatsApp API 模板相关请求类型
 * WhatsApp API Template Request Types
 */

/**
 * 模板创建请求
 * Template creation request
 */
export interface TemplateCreateRequest {
  name: string;
  language: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
    text?: string;
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
    example?: {
      header_text?: string[];
      body_text?: string[][];
    };
  }>;
}

/**
 * 模板删除请求
 * Template deletion request
 */
export interface TemplateDeleteRequest {
  name: string;
  hsm_id?: string;
}

/**
 * 模板状态更新请求
 * Template status update request
 */
export interface TemplateStatusUpdateRequest {
  messaging_product: 'whatsapp';
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
}
