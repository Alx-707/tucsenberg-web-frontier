/**
 * Resend邮件服务 - 统一导出入口
 * Resend email service - unified export entry
 */

// 导出核心服务类
export { ResendService } from './resend-core';

// 导出工具类
export { ResendUtils } from './resend-utils';
export { ResendTemplates } from './resend-templates';

// 导出配置和类型
export { EMAIL_CONFIG } from './resend-utils';
export type { EmailTemplateData } from './validations';

// 创建单例实例
import { ResendService } from './resend-core';
export const resendService = new ResendService();




