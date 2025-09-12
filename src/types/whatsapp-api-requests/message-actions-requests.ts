/**
 * WhatsApp API 消息操作请求类型
 * WhatsApp API Message Actions Request Types
 */

/**
 * 消息反应请求
 * Message reaction request
 */
export interface MessageReactionRequest {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'reaction';
  reaction: {
    message_id: string;
    emoji: string;
  };
}

/**
 * 消息转发请求
 * Message forwarding request
 */
export interface MessageForwardRequest {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  context: {
    message_id: string;
  };
  text: {
    body: string;
  };
}

/**
 * 群组消息请求
 * Group message request
 */
export interface GroupMessageRequest {
  messaging_product: 'whatsapp';
  recipient_type: 'group';
  to: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  text?: {
    body: string;
  };
  image?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  document?: {
    id?: string;
    link?: string;
    caption?: string;
    filename?: string;
  };
  audio?: {
    id?: string;
    link?: string;
  };
  video?: {
    id?: string;
    link?: string;
    caption?: string;
  };
}
