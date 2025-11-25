import { NextRequest, NextResponse } from 'next/server';
import { safeParseJson } from '@/lib/api/safe-parse-json';
import { logger } from '@/lib/logger';
import { HTTP_BAD_REQUEST } from '@/constants';

/**
 * PUT /api/monitoring/dashboard
 * 更新监控配置
 */
export async function handlePutRequest(request: NextRequest) {
  try {
    const parsedBody = await safeParseJson<unknown>(request, {
      route: '/api/monitoring/dashboard',
    });
    if (!parsedBody.ok) {
      return NextResponse.json(
        {
          success: false,
          error: parsedBody.error,
          message: 'Invalid JSON body for monitoring dashboard configuration',
        },
        { status: HTTP_BAD_REQUEST },
      );
    }
    const body = parsedBody.data as { config?: unknown; updatedBy?: unknown };

    // 验证配置数据
    if (!body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid configuration data',
          message: 'Configuration object is required',
        },
        { status: HTTP_BAD_REQUEST },
      );
    }

    // 记录配置更新
    logger.info('Monitoring dashboard configuration updated', {
      configKeys: Object.keys(body.config),
      updatedBy: body.updatedBy || 'system',
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Monitoring configuration updated successfully',
      data: {
        configUpdated: Object.keys(body.config),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (_error) {
    // 忽略错误变量
    logger.error('Failed to update monitoring configuration', {
      error: _error instanceof Error ? _error.message : String(_error),
      stack: _error instanceof Error ? _error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to update monitoring configuration',
      },
      { status: 500 },
    );
  }
}
