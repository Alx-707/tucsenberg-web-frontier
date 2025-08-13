import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { contactFormSchema, validationHelpers, type ContactFormData } from '@/lib/validations';
import { airtableService } from '@/lib/airtable';
import { resendService } from '@/lib/resend';
import { logger } from '@/lib/logger';

/**
 * 扩展的联系表单模式，包含Turnstile token
 * Extended contact form schema with Turnstile token
 */
const contactFormWithTokenSchema = contactFormSchema.extend({
  turnstileToken: z.string().min(1, 'Security verification required'),
  submittedAt: z.string(),
});

/**
 * 速率限制存储
 * Rate limiting storage (in production, use Redis or database)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 常量定义
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 5,
  WINDOW_MS: 60000,
} as const;

/**
 * 检查速率限制
 * Check rate limiting
 */
function checkRateLimit(ip: string, maxRequests = RATE_LIMIT_CONFIG.MAX_REQUESTS, windowMs = RATE_LIMIT_CONFIG.WINDOW_MS): boolean {
  const now = Date.now();
  const key = ip;

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  // eslint-disable-next-line no-plusplus
  current.count++;
  return true;
}

/**
 * 验证Turnstile token
 * Verify Turnstile token
 */
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      logger.warn('Turnstile secret key not configured');
      return process.env.NODE_ENV === 'development'; // 开发环境跳过验证
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    logger.error('Turnstile verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * 获取客户端IP地址
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * 验证表单数据
 * Validate form data
 */
async function validateFormData(body: unknown, clientIP: string) {
  const validationResult = contactFormWithTokenSchema.safeParse(body);

  if (!validationResult.success) {
    logger.warn('Form validation failed', {
      errors: validationResult.error.errors,
      ip: clientIP,
    });
    return { success: false, error: 'Invalid form data', details: validationResult.error.errors };
  }

  const formData = validationResult.data;

  // 验证Turnstile token
  const isTurnstileValid = await verifyTurnstile(formData.turnstileToken, clientIP);

  if (!isTurnstileValid) {
    logger.warn('Turnstile verification failed', {
      ip: clientIP,
      email: formData.email,
    });
    return { success: false, error: 'Security verification failed. Please try again.' };
  }

  // 检查蜜罐字段
  if (formData.website && formData.website.length > 0) {
    logger.warn('Bot detected via honeypot', {
      ip: clientIP,
      email: formData.email,
      website: formData.website,
    });
    return { success: false, error: 'Invalid submission' };
  }

  // 检查垃圾邮件
  if (validationHelpers.isSpamContent(formData.message)) {
    logger.warn('Spam content detected', {
      ip: clientIP,
      email: formData.email,
    });
    return { success: false, error: 'Message contains inappropriate content' };
  }

  return { success: true, data: formData };
}

/**
 * 处理表单提交
 * Process form submission
 */
async function processFormSubmission(formData: ContactFormData & { turnstileToken: string; submittedAt: string }) {
  const emailData = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    company: formData.company,
    message: formData.message,
    phone: formData.phone,
    subject: formData.subject,
    submittedAt: formData.submittedAt,
    marketingConsent: formData.marketingConsent,
  };

  // 并行处理：保存到Airtable和发送邮件
  const [airtableResult, emailResult] = await Promise.allSettled([
    airtableService.isReady() ? airtableService.createContact(formData) : null,
    resendService.isReady() ? resendService.sendContactFormEmail(emailData) : null,
  ]);

  let airtableRecordId: string | undefined;
  let emailMessageId: string | undefined;

  if (airtableResult.status === 'fulfilled' && airtableResult.value) {
    airtableRecordId = airtableResult.value.id;
    logger.info('Contact saved to Airtable', {
      recordId: airtableRecordId,
      email: formData.email,
    });
  } else if (airtableResult.status === 'rejected') {
    logger.error('Failed to save to Airtable', {
      error: airtableResult.reason,
      email: formData.email,
    });
  }

  if (emailResult.status === 'fulfilled' && emailResult.value) {
    emailMessageId = emailResult.value;
    logger.info('Contact email sent', {
      messageId: emailMessageId,
      email: formData.email,
    });
  } else if (emailResult.status === 'rejected') {
    logger.error('Failed to send email', {
      error: emailResult.reason,
      email: formData.email,
    });
  }

  // 发送确认邮件给用户（可选）
  if (resendService.isReady()) {
    try {
      await resendService.sendConfirmationEmail(emailData);
      logger.info('Confirmation email sent to user', {
        email: formData.email,
      });
    } catch (error) {
      logger.error('Failed to send confirmation email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: formData.email,
      });
    }
  }

  return { airtableRecordId, emailMessageId };
}

/**
 * POST /api/contact
 * 处理联系表单提交
 * Handle contact form submission
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  try {
    // 检查速率限制
    if (!checkRateLimit(clientIP)) {
      logger.warn('Rate limit exceeded', { ip: clientIP });
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      );
    }

    // 解析请求体
    const body = await request.json();

    // 验证表单数据
    const validation = await validateFormData(body, clientIP);
    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const formData = validation.data;

    // 处理表单提交
    const { airtableRecordId, emailMessageId } = await processFormSubmission(formData);

    // 记录成功提交
    const processingTime = Date.now() - startTime;
    logger.info('Contact form submitted successfully', {
      email: formData.email,
      company: formData.company,
      ip: clientIP,
      processingTime,
      airtableRecordId,
      emailMessageId,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon.',
      messageId: emailMessageId,
      recordId: airtableRecordId,
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('Contact form submission failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: clientIP,
      processingTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contact
 * 获取联系表单统计信息（仅管理员）
 * Get contact form statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // 简单的管理员验证（生产环境应使用更安全的方法）
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.ADMIN_API_TOKEN;

    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取统计信息
    const stats = airtableService.isReady()
      ? await airtableService.getStatistics()
      : {
          totalContacts: 0,
          newContacts: 0,
          completedContacts: 0,
          recentContacts: 0,
        };

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    logger.error('Failed to get contact statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/contact
 * 处理CORS预检请求
 * Handle CORS preflight requests
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
