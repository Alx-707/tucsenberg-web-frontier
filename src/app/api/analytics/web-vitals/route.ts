import { NextRequest, NextResponse } from 'next/server';
import { createCachedResponse } from '@/lib/api-cache-utils';
import { safeParseJson } from '@/lib/api/safe-parse-json';
import { logger } from '@/lib/logger';

// Web Vitals 数据接口
//
// 说明：
// - 为兼容当前前端上报的精简结构，仅以下字段为必填：
//   - name / value / rating / delta / timestamp
// - 其余字段（id / navigationType / url / userAgent / path）为可选扩展字段，
//   未来如需更细粒度分析可在前端按需补充，而不会破坏现有后端校验。
interface WebVitalsBaseData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  timestamp: number;
}

interface WebVitalsExtendedData {
  id?: string;
  navigationType?: string;
  url?: string;
  userAgent?: string;
  path?: string;
}

type WebVitalsData = WebVitalsBaseData & WebVitalsExtendedData;

// 验证 Web Vitals 数据 - 拆分基础字段与可选字段校验，降低复杂度
function isValidWebVitalsBaseFields(obj: Record<string, unknown>): boolean {
  return (
    typeof obj.name === 'string' &&
    typeof obj.value === 'number' &&
    ['good', 'needs-improvement', 'poor'].includes(obj.rating as string) &&
    typeof obj.delta === 'number' &&
    typeof obj.timestamp === 'number'
  );
}

function hasValidOptionalId(obj: Record<string, unknown>): boolean {
  if (!('id' in obj)) {
    return true;
  }

  return typeof obj.id === 'string';
}

function hasValidOptionalNavigationType(obj: Record<string, unknown>): boolean {
  if (!('navigationType' in obj)) {
    return true;
  }

  return typeof obj.navigationType === 'string';
}

function hasValidOptionalUrl(obj: Record<string, unknown>): boolean {
  if (!('url' in obj)) {
    return true;
  }

  return typeof obj.url === 'string';
}

function hasValidOptionalUserAgent(obj: Record<string, unknown>): boolean {
  if (!('userAgent' in obj)) {
    return true;
  }

  return typeof obj.userAgent === 'string';
}

function hasValidOptionalPath(obj: Record<string, unknown>): boolean {
  if (!('path' in obj)) {
    return true;
  }

  return typeof obj.path === 'string';
}

function validateWebVitalsData(data: unknown): data is WebVitalsData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 1) 必填字段校验：与前端 WebVitalsReporter 上报的精简结构对齐
  if (!isValidWebVitalsBaseFields(obj)) {
    return false;
  }

  // 2) 可选扩展字段：如存在则做类型校验，否则忽略
  return (
    hasValidOptionalId(obj) &&
    hasValidOptionalNavigationType(obj) &&
    hasValidOptionalUrl(obj) &&
    hasValidOptionalUserAgent(obj) &&
    hasValidOptionalPath(obj)
  );
}

// 处理 Web Vitals 数据收集
export async function POST(request: NextRequest) {
  try {
    const parsedBody = await safeParseJson<unknown>(request, {
      route: '/api/analytics/web-vitals',
    });
    if (!parsedBody.ok) {
      return NextResponse.json(
        {
          success: false,
          _error: parsedBody.error,
          message: 'Invalid JSON body for Web Vitals endpoint',
        },
        { status: 400 },
      );
    }
    const body = parsedBody.data;

    // 验证请求数据
    if (!validateWebVitalsData(body)) {
      return NextResponse.json(
        {
          success: false,
          _error: 'Invalid web vitals data format',
          message:
            'The provided data does not match the expected Web Vitals format',
        },
        { status: 400 },
      );
    }

    // 记录 Web Vitals 数据
    logger.info('Web Vitals data received', {
      metric: body.name,
      value: body.value,
      rating: body.rating,
      // 仅在存在时记录可选字段，避免 exactOptionalPropertyTypes 下显式传入 undefined
      ...(body.path ? { path: body.path } : {}),
      ...(body.url ? { url: body.url } : {}),
      ...(body.navigationType ? { navigationType: body.navigationType } : {}),
      ...(body.userAgent ? { userAgent: body.userAgent } : {}),
      ...(body.id ? { id: body.id } : {}),
      timestamp: body.timestamp,
    });

    // 在实际应用中，这里会将数据存储到数据库或发送到分析服务
    // 目前只是记录日志

    return NextResponse.json({
      success: true,
      message: 'Web Vitals data recorded successfully',
      data: {
        metric: body.name,
        value: body.value,
        rating: body.rating,
        timestamp: body.timestamp,
      },
    });
  } catch (_error) {
    // 忽略错误变量
    logger.error('Failed to process Web Vitals data', {
      _error: _error instanceof Error ? _error.message : String(_error),
      stack: _error instanceof Error ? _error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        _error: 'Internal server _error',
        message: 'Failed to process Web Vitals data',
      },
      { status: 500 },
    );
  }
}

// 获取 Web Vitals 统计信息
export function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const metric = searchParams.get('metric');

    // 模拟统计数据（在实际应用中会从数据库查询）
    const mockStats = {
      timeRange,
      metrics: {
        CLS: {
          average: 0.05,
          p75: 0.08,
          p90: 0.12,
          samples: 1250,
          rating: 'good' as const,
        },
        FID: {
          average: 45,
          p75: 65,
          p90: 85,
          samples: 1180,
          rating: 'good' as const,
        },
        LCP: {
          average: 1800,
          p75: 2200,
          p90: 2800,
          samples: 1300,
          rating: 'good' as const,
        },
        FCP: {
          average: 1200,
          p75: 1500,
          p90: 1900,
          samples: 1300,
          rating: 'good' as const,
        },
        TTFB: {
          average: 200,
          p75: 300,
          p90: 450,
          samples: 1300,
          rating: 'good' as const,
        },
      },
      summary: {
        totalSamples: 1300,
        goodRating: 0.85,
        needsImprovementRating: 0.12,
        poorRating: 0.03,
      },
    };

    const allowedMetrics = ['CLS', 'FID', 'LCP', 'FCP', 'TTFB'] as Array<
      keyof typeof mockStats.metrics
    >;

    // 如果指定了特定指标，只返回该指标的数据
    if (
      metric &&
      allowedMetrics.includes(metric as (typeof allowedMetrics)[number])
    ) {
      const safeMetric = metric as keyof typeof mockStats.metrics;
      let metricStats:
        | (typeof mockStats.metrics)['CLS']
        | (typeof mockStats.metrics)['FID']
        | (typeof mockStats.metrics)['LCP']
        | (typeof mockStats.metrics)['FCP']
        | (typeof mockStats.metrics)['TTFB'];

      switch (safeMetric) {
        case 'FID':
          metricStats = mockStats.metrics.FID;
          break;
        case 'LCP':
          metricStats = mockStats.metrics.LCP;
          break;
        case 'FCP':
          metricStats = mockStats.metrics.FCP;
          break;
        case 'TTFB':
          metricStats = mockStats.metrics.TTFB;
          break;
        default:
          metricStats = mockStats.metrics.CLS;
          break;
      }
      return createCachedResponse(
        {
          success: true,
          data: {
            timeRange,
            metric: safeMetric,
            stats: metricStats,
          },
        },
        { maxAge: 120 },
      );
    }

    return createCachedResponse(
      {
        success: true,
        data: mockStats,
      },
      { maxAge: 120 },
    );
  } catch (_error) {
    // 忽略错误变量
    logger.error('Failed to get Web Vitals statistics', {
      _error: _error instanceof Error ? _error.message : String(_error),
      stack: _error instanceof Error ? _error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        _error: 'Internal server _error',
        message: 'Failed to retrieve Web Vitals statistics',
      },
      { status: 500 },
    );
  }
}

// 删除 Web Vitals 数据（管理功能）
export function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange');
    const confirm = searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json(
        {
          success: false,
          _error: 'Confirmation required',
          message: 'Please add confirm=true parameter to confirm deletion',
        },
        { status: 400 },
      );
    }

    // 在实际应用中，这里会删除指定时间范围的数据
    logger.info('Web Vitals data deletion requested', {
      timeRange: timeRange || 'all',
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Web Vitals data deleted for time range: ${timeRange || 'all'}`,
      deletedAt: new Date().toISOString(),
    });
  } catch (_error) {
    // 忽略错误变量
    logger.error('Failed to delete Web Vitals data', {
      _error: _error instanceof Error ? _error.message : String(_error),
      stack: _error instanceof Error ? _error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        _error: 'Internal server _error',
        message: 'Failed to delete Web Vitals data',
      },
      { status: 500 },
    );
  }
}
