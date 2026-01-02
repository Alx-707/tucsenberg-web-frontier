import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { validateAdminAccess } from '@/app/api/contact/contact-api-validation';
import { HTTP_BAD_REQUEST } from '@/constants';
import { API_ERROR_CODES } from '@/constants/api-error-codes';

/**
 * DELETE /api/monitoring/dashboard
 * 清除监控数据（管理功能）
 */
export function handleDeleteRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!validateAdminAccess(authHeader)) {
      logger.warn('Unauthorized access attempt to monitoring dashboard DELETE');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange');
    const source = searchParams.get('source');
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json(
        {
          success: false,
          errorCode: API_ERROR_CODES.CONFIRMATION_REQUIRED,
        },
        { status: HTTP_BAD_REQUEST },
      );
    }

    // 在实际应用中，这里会删除指定的监控数据
    logger.info('Monitoring dashboard data deletion requested', {
      source: source || 'all',
      timeRange: timeRange || 'all',
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      errorCode: API_ERROR_CODES.MONITORING_DELETED,
      deletedAt: new Date().toISOString(),
    });
  } catch (_error) {
    // 忽略错误变量
    logger.error('Failed to delete monitoring dashboard data', {
      error: _error instanceof Error ? _error.message : String(_error),
      stack: _error instanceof Error ? _error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        errorCode: API_ERROR_CODES.MONITORING_DELETE_FAILED,
      },
      { status: 500 },
    );
  }
}
