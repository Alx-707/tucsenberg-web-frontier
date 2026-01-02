import { NextRequest, NextResponse } from 'next/server';
import { safeParseJson } from '@/lib/api/safe-parse-json';
import { logger } from '@/lib/logger';
import { validateAdminAccess } from '@/app/api/contact/contact-api-validation';
import { validateMonitoringData } from '@/app/api/monitoring/dashboard/types';
import { HTTP_BAD_REQUEST } from '@/constants';
import { API_ERROR_CODES } from '@/constants/api-error-codes';

/**
 * POST /api/monitoring/dashboard
 * 收集监控仪表板数据
 */
export async function handlePostRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!validateAdminAccess(authHeader)) {
      logger.warn('Unauthorized access attempt to monitoring dashboard POST');
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
    const body = parsedBody.data;

    // 验证请求数据
    if (!validateMonitoringData(body)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: API_ERROR_CODES.MONITORING_INVALID_FORMAT,
        },
        { status: HTTP_BAD_REQUEST },
      );
    }

    // 记录监控数据（在实际应用中会存储到数据库）
    logger.info('Monitoring dashboard data received', {
      source: body.source,
      timestamp: body.timestamp,
      metricsCount: Object.keys(body.metrics).length,
    });

    // 模拟数据处理 - 仅使用明确字段，避免直接展开请求体
    const processedData = {
      id: `monitoring-${Date.now()}`,
      source: body.source,
      metrics: body.metrics,
      timestamp: body.timestamp,
      processedAt: new Date().toISOString(),
      status: 'processed',
    };

    return NextResponse.json({
      success: true,
      errorCode: API_ERROR_CODES.MONITORING_DATA_RECEIVED,
      data: processedData,
    });
  } catch (_error) {
    // 忽略错误变量
    logger.error('Failed to process monitoring dashboard data', {
      error: _error instanceof Error ? _error.message : String(_error),
      stack: _error instanceof Error ? _error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        errorCode: API_ERROR_CODES.MONITORING_PROCESS_FAILED,
      },
      { status: 500 },
    );
  }
}
