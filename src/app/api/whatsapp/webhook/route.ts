import { NextRequest, NextResponse } from 'next/server';
import { safeParseJson } from '@/lib/api/safe-parse-json';
import { logger } from '@/lib/logger';
import { getWhatsAppService } from '@/lib/whatsapp';

/**
 * WhatsApp Webhook 端点
 * 处理 Meta 发送的 webhook 验证和消息接收
 */

// GET 请求用于 webhook 验证
export function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      );
    }

    const whatsappService = getWhatsAppService();
    const verificationResult = whatsappService.verifyWebhook(
      mode,
      token,
      challenge,
    );

    if (verificationResult) {
      return new NextResponse(verificationResult, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 403 },
    );
  } catch (_error) {
    // 忽略错误变量
    logger.error(
      'WhatsApp webhook verification error',
      {},
      _error instanceof Error ? _error : new Error(String(_error)),
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST 请求用于接收消息
export async function POST(request: NextRequest) {
  try {
    const parsedBody = await safeParseJson<unknown>(request, {
      route: '/api/whatsapp/webhook',
    });
    if (!parsedBody.ok) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }
    const body = parsedBody.data;

    // 验证请求来源（可选：验证 Meta 的签名）
    // 这里可以添加更严格的安全验证

    const whatsappService = getWhatsAppService();
    await whatsappService.handleIncomingMessage(body);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_error) {
    // 忽略错误变量
    logger.error(
      'WhatsApp webhook message handling error',
      {},
      _error instanceof Error ? _error : new Error(String(_error)),
    );
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 },
    );
  }
}
