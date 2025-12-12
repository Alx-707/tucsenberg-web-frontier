import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { SendMessageRequest, TemplateComponent } from '@/types/whatsapp';
import { safeParseJson } from '@/lib/api/safe-parse-json';
import { logger } from '@/lib/logger';
import {
  getClientEnvironmentInfo,
  sendWhatsAppMessage,
} from '@/lib/whatsapp-service';
import { COUNT_THREE } from '@/constants/count';
import {
  FIVE_SECONDS_MS,
  ONE_SECOND_MS,
  TWO_SECONDS_MS,
} from '@/constants/time';

/**
 * WhatsApp Send Message API Endpoint
 *
 * Supports text messages and template messages with retry logic.
 */

// Request body validation schema
const SendMessageSchema = z.object({
  to: z.string().min(1, 'Recipient phone number is required'),
  type: z.enum(['text', 'template'], {
    message: 'Message type must be "text" or "template"',
  }),
  content: z.object({
    body: z.string().optional(),
    templateName: z.string().optional(),
    languageCode: z.string().default('en'),
    components: z
      .array(
        z.object({
          type: z.enum(['header', 'body', 'footer', 'button']),
          sub_type: z.enum(['quick_reply', 'url', 'phone_number']).optional(),
          index: z.number().optional(),
          parameters: z
            .array(
              z.object({
                type: z.enum([
                  'text',
                  'currency',
                  'date_time',
                  'image',
                  'document',
                  'video',
                ]),
                text: z.string().optional(),
                currency: z
                  .object({
                    fallback_value: z.string(),
                    code: z.string(),
                    amount_1000: z.number(),
                  })
                  .optional(),
                date_time: z
                  .object({
                    fallback_value: z.string(),
                  })
                  .optional(),
                image: z
                  .object({
                    id: z.string().optional(),
                    link: z.string().url().optional(),
                  })
                  .optional(),
                document: z
                  .object({
                    id: z.string().optional(),
                    link: z.string().url().optional(),
                    filename: z.string().optional(),
                  })
                  .optional(),
                video: z
                  .object({
                    id: z.string().optional(),
                    link: z.string().url().optional(),
                  })
                  .optional(),
              }),
            )
            .optional(),
        }),
      )
      .optional(),
  }),
});

// Retry configuration
const RETRY_DELAYS = [ONE_SECOND_MS, TWO_SECONDS_MS, FIVE_SECONDS_MS] as const;
const MAX_RETRIES = COUNT_THREE;

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (network issues, rate limits)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('503')
    );
  }
  return false;
}

/**
 * Validate message content
 */
function validateMessageContent(
  type: string,
  content: Record<string, unknown>,
): NextResponse | null {
  if (type === 'text' && !content.body) {
    return NextResponse.json(
      { error: 'Text message requires "body" in content' },
      { status: 400 },
    );
  }

  if (type === 'template' && !content.templateName) {
    return NextResponse.json(
      { error: 'Template message requires "templateName" in content' },
      { status: 400 },
    );
  }

  return null;
}

/**
 * Build WhatsApp message object
 */
function buildWhatsAppMessage(
  to: string,
  type: string,
  content: Record<string, unknown>,
): SendMessageRequest {
  if (type === 'text') {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        body: content.body as string,
      },
    };
  }

  if (type === 'template') {
    const templateMessage: SendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: content.templateName as string,
        language: {
          code: (content.languageCode as string) || 'en',
          policy: 'deterministic',
        },
      },
    };

    if (content.components) {
      templateMessage.template!.components =
        content.components as TemplateComponent[];
    }

    return templateMessage;
  }

  throw new Error(`Unsupported message type: ${type}`);
}

interface ParsedRequest {
  to: string;
  type: string;
  content: Record<string, unknown>;
}

async function parseSendMessageRequest(
  request: NextRequest,
): Promise<{ error?: NextResponse; data?: ParsedRequest }> {
  const parsedBody = await safeParseJson<unknown>(request, {
    route: '/api/whatsapp/send',
  });
  if (!parsedBody.ok) {
    return {
      error: NextResponse.json({ error: parsedBody.error }, { status: 400 }),
    };
  }
  const body = parsedBody.data;
  const validationResult = SendMessageSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      error: NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.issues,
        },
        { status: 400 },
      ),
    };
  }

  const { to, type, content } = validationResult.data;
  const contentValidationError = validateMessageContent(type, content);
  if (contentValidationError) {
    return { error: contentValidationError };
  }

  return { data: { to, type, content } };
}

function extractMessageId(
  result: Awaited<ReturnType<typeof sendWhatsAppMessage>>,
) {
  const messages = Array.isArray(result.data?.messages)
    ? result.data.messages
    : [];
  return messages.at(0)?.id;
}

/**
 * Send message with retry logic
 */
async function sendMessageWithRetry(
  message: SendMessageRequest,
): Promise<Awaited<ReturnType<typeof sendWhatsAppMessage>>> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await sendWhatsAppMessage(message);

      if (result.success) {
        return result;
      }

      // Check if error is retryable
      if (!isRetryableError(new Error(result.error || 'Unknown error'))) {
        return result;
      }

      lastError = new Error(result.error || 'Unknown error');
    } catch (error) {
      lastError = error;

      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }
    }

    // Wait before next retry (if not last attempt)
    if (attempt < MAX_RETRIES) {
      // eslint-disable-next-line security/detect-object-injection -- attempt is loop-controlled integer
      const delay = RETRY_DELAYS[attempt] ?? FIVE_SECONDS_MS;
      logger.info(
        `[WhatsAppSend] Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  // All retries failed
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseSendMessageRequest(request);
    if (parsed.error) {
      return parsed.error;
    }
    const { to, type, content } = parsed.data!;

    const message = buildWhatsAppMessage(to, type, content);
    const result = await sendMessageWithRetry(message);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send message');
    }

    const messageId = extractMessageId(result);
    const clientInfo = getClientEnvironmentInfo();

    return NextResponse.json(
      {
        success: true,
        messageId,
        data: result,
        environment: clientInfo.environment,
        clientType: clientInfo.clientType,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      'WhatsApp send message error',
      {},
      error instanceof Error ? error : new Error(String(error)),
    );

    if (error instanceof Error) {
      if (error.message.includes('WHATSAPP_ACCESS_TOKEN')) {
        return NextResponse.json(
          { error: 'WhatsApp service not configured' },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 },
    );
  }
}

// GET: Return API usage info
export function GET() {
  const clientInfo = getClientEnvironmentInfo();

  return NextResponse.json({
    message: 'WhatsApp Send Message API',
    environment: clientInfo.environment,
    clientType: clientInfo.clientType,
    usage: {
      method: 'POST',
      endpoint: '/api/whatsapp/send',
      body: {
        to: 'string (phone number with country code)',
        type: '"text" | "template"',
        content: {
          body: 'string (required for text messages)',
          templateName: 'string (required for template messages)',
          languageCode: 'string (optional, default: "en")',
          components: 'array (optional, for template parameters)',
        },
      },
    },
    examples: {
      textMessage: {
        to: '+1234567890',
        type: 'text',
        content: {
          body: 'Hello from our service!',
        },
      },
      templateMessage: {
        to: '+1234567890',
        type: 'template',
        content: {
          templateName: 'welcome_message',
          languageCode: 'en',
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: 'John Doe',
                },
              ],
            },
          ],
        },
      },
    },
  });
}
