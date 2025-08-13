import { Resend } from 'resend';
import { env } from '@/../env.mjs';
import { 
  EmailTemplateData, 
  emailTemplateDataSchema,
  validationHelpers 
} from './validations';
import { logger } from './logger';

/**
 * Resend邮件服务配置
 * Resend email service configuration
 */
class ResendService {
  private resend: Resend | null = null;
  private isConfigured: boolean = false;
  private emailConfig: {
    from: string;
    replyTo: string;
    supportEmail: string;
  };

  constructor() {
    this.emailConfig = {
      from: env.EMAIL_FROM || 'noreply@tucsenberg.com',
      replyTo: env.EMAIL_REPLY_TO || 'contact@tucsenberg.com',
      supportEmail: env.EMAIL_REPLY_TO || 'support@tucsenberg.com',
    };
    
    this.initializeResend();
  }

  /**
   * 初始化Resend服务
   * Initialize Resend service
   */
  private initializeResend(): void {
    try {
      if (!env.RESEND_API_KEY) {
        logger.warn('Resend API key missing - email service will be disabled');
        return;
      }

      this.resend = new Resend(env.RESEND_API_KEY);
      this.isConfigured = true;

      logger.info('Resend email service initialized successfully', {
        from: this.emailConfig.from,
        replyTo: this.emailConfig.replyTo,
      });
    } catch (error) {
      logger.error('Failed to initialize Resend service', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 检查服务是否已配置
   * Check if service is configured
   */
  public isReady(): boolean {
    return this.isConfigured && this.resend !== null;
  }

  /**
   * 发送联系表单邮件给管理员
   * Send contact form email to admin
   */
  public async sendContactFormEmail(data: EmailTemplateData): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Resend service is not configured');
    }

    try {
      // 验证邮件数据
      const validatedData = emailTemplateDataSchema.parse(data);
      
      // 清理数据
      const sanitizedData = this.sanitizeEmailData(validatedData);

      // 构建邮件内容
      const subject = sanitizedData.subject 
        ? `Contact Form: ${sanitizedData.subject}` 
        : `New Contact from ${sanitizedData.firstName} ${sanitizedData.lastName}`;

      const htmlContent = this.generateContactEmailHtml(sanitizedData);
      const textContent = this.generateContactEmailText(sanitizedData);

      // 发送邮件
      const result = await this.resend!.emails.send({
        from: this.emailConfig.from,
        to: [this.emailConfig.replyTo],
        replyTo: sanitizedData.email,
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'type', value: 'contact-form' },
          { name: 'source', value: 'website' },
        ],
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      logger.info('Contact form email sent successfully', {
        messageId: result.data?.id,
        to: this.emailConfig.replyTo,
        from: sanitizedData.email,
        subject,
      });

      return result.data?.id || 'unknown';
    } catch (error) {
      logger.error('Failed to send contact form email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: data.email,
      });
      throw new Error('Failed to send email');
    }
  }

  /**
   * 发送确认邮件给用户
   * Send confirmation email to user
   */
  public async sendConfirmationEmail(data: EmailTemplateData): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Resend service is not configured');
    }

    try {
      const validatedData = emailTemplateDataSchema.parse(data);
      const sanitizedData = this.sanitizeEmailData(validatedData);

      const subject = 'Thank you for contacting us - Tucsenberg';
      const htmlContent = this.generateConfirmationEmailHtml(sanitizedData);
      const textContent = this.generateConfirmationEmailText(sanitizedData);

      const result = await this.resend!.emails.send({
        from: this.emailConfig.from,
        to: [sanitizedData.email],
        replyTo: this.emailConfig.supportEmail,
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'type', value: 'confirmation' },
          { name: 'source', value: 'website' },
        ],
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      logger.info('Confirmation email sent successfully', {
        messageId: result.data?.id,
        to: sanitizedData.email,
        subject,
      });

      return result.data?.id || 'unknown';
    } catch (error) {
      logger.error('Failed to send confirmation email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: data.email,
      });
      throw new Error('Failed to send confirmation email');
    }
  }

  /**
   * 清理邮件数据
   * Sanitize email data
   */
  private sanitizeEmailData(data: EmailTemplateData): EmailTemplateData {
    return {
      firstName: validationHelpers.sanitizeInput(data.firstName),
      lastName: validationHelpers.sanitizeInput(data.lastName),
      email: data.email.toLowerCase().trim(),
      company: validationHelpers.sanitizeInput(data.company),
      message: validationHelpers.sanitizeInput(data.message),
      phone: data.phone ? validationHelpers.sanitizeInput(data.phone) : undefined,
      subject: data.subject ? validationHelpers.sanitizeInput(data.subject) : undefined,
      submittedAt: data.submittedAt,
      marketingConsent: data.marketingConsent,
    };
  }

  /**
   * 生成联系表单邮件HTML内容
   * Generate contact form email HTML content
   */
  private generateContactEmailHtml(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007ee6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #555; }
    .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name:</div>
        <div class="value">${data.firstName} ${data.lastName}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div class="value">${data.email}</div>
      </div>
      <div class="field">
        <div class="label">Company:</div>
        <div class="value">${data.company}</div>
      </div>
      ${data.phone ? `
      <div class="field">
        <div class="label">Phone:</div>
        <div class="value">${data.phone}</div>
      </div>
      ` : ''}
      ${data.subject ? `
      <div class="field">
        <div class="label">Subject:</div>
        <div class="value">${data.subject}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">Message:</div>
        <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
      </div>
      <div class="field">
        <div class="label">Submitted At:</div>
        <div class="value">${new Date(data.submittedAt).toLocaleString()}</div>
      </div>
      ${data.marketingConsent ? `
      <div class="field">
        <div class="label">Marketing Consent:</div>
        <div class="value">Yes, agreed to receive marketing communications</div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>This email was sent from the Tucsenberg website contact form.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 生成联系表单邮件文本内容
   * Generate contact form email text content
   */
  private generateContactEmailText(data: EmailTemplateData): string {
    return `
New Contact Form Submission

Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Company: ${data.company}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.subject ? `Subject: ${data.subject}` : ''}

Message:
${data.message}

Submitted At: ${new Date(data.submittedAt).toLocaleString()}
${data.marketingConsent ? 'Marketing Consent: Yes' : ''}

---
This email was sent from the Tucsenberg website contact form.
`;
  }

  /**
   * 生成确认邮件HTML内容
   * Generate confirmation email HTML content
   */
  private generateConfirmationEmailHtml(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for contacting us</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007ee6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Contacting Us</h1>
    </div>
    <div class="content">
      <p>Dear ${data.firstName},</p>
      <p>Thank you for reaching out to us. We have received your message and will get back to you within 24 hours.</p>
      <p>Here's a summary of your submission:</p>
      <ul>
        <li><strong>Name:</strong> ${data.firstName} ${data.lastName}</li>
        <li><strong>Company:</strong> ${data.company}</li>
        <li><strong>Email:</strong> ${data.email}</li>
        ${data.subject ? `<li><strong>Subject:</strong> ${data.subject}</li>` : ''}
        <li><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</li>
      </ul>
      <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
      <p>Best regards,<br>The Tucsenberg Team</p>
    </div>
    <div class="footer">
      <p>© 2024 Tucsenberg. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 生成确认邮件文本内容
   * Generate confirmation email text content
   */
  private generateConfirmationEmailText(data: EmailTemplateData): string {
    return `
Thank You for Contacting Us

Dear ${data.firstName},

Thank you for reaching out to us. We have received your message and will get back to you within 24 hours.

Here's a summary of your submission:
- Name: ${data.firstName} ${data.lastName}
- Company: ${data.company}
- Email: ${data.email}
${data.subject ? `- Subject: ${data.subject}` : ''}
- Submitted: ${new Date(data.submittedAt).toLocaleString()}

If you have any urgent questions, please don't hesitate to contact us directly.

Best regards,
The Tucsenberg Team

---
© 2024 Tucsenberg. All rights reserved.
`;
  }

  /**
   * 获取邮件发送统计
   * Get email sending statistics
   */
  public async getEmailStats(): Promise<{
    sent: number;
    delivered: number;
    bounced: number;
    complained: number;
  }> {
    // Note: Resend doesn't provide built-in analytics API
    // This would need to be implemented with webhook tracking
    return {
      sent: 0,
      delivered: 0,
      bounced: 0,
      complained: 0,
    };
  }
}

// 创建单例实例
export const resendService = new ResendService();

// 导出邮件配置
export const EMAIL_CONFIG = {
  from: 'noreply@tucsenberg.com',
  replyTo: 'contact@tucsenberg.com',
  supportEmail: 'support@tucsenberg.com',
} as const;

// 导出类型和服务
export type { EmailTemplateData };
export { ResendService };
