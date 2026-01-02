import { NextRequest, NextResponse } from 'next/server';
import { safeParseJson } from '@/lib/api/safe-parse-json';
import { logger } from '@/lib/logger';
import { validateAdminAccess } from '@/app/api/contact/contact-api-validation';
import { HTTP_BAD_REQUEST } from '@/constants';
import { API_ERROR_CODES } from '@/constants/api-error-codes';

/**
 * PUT /api/monitoring/dashboard
 * 更新监控配置
 */
export async function handlePutRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!validateAdminAccess(authHeader)) {
      logger.warn('Unauthorized access attempt to monitoring dashboard PUT');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const parsedBody = await safeParseJson<unknown>(request, {
      route: '/api/monitoring/dashboard',
    });
    if (!parsedBody.ok) {
      return NextResponse.json(
        {
          success: false,
          errorCode: API_ERROR_CODES.INVALID_JSON_BODY,
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
          errorCode: API_ERROR_CODES.MONITORING_CONFIG_INVALID,
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
      errorCode: API_ERROR_CODES.MONITORING_CONFIG_UPDATED,
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
        errorCode: API_ERROR_CODES.MONITORING_CONFIG_UPDATE_FAILED,
      },
      { status: 500 },
    );
  }
}
