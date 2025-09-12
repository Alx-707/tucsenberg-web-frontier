import { NextRequest } from 'next/server';
;
import { handlePostRequest } from './handlers/post-handler';
import { handleGetRequest } from './handlers/get-handler';
import { handlePutRequest } from './handlers/put-handler';
import { handleDeleteRequest } from './handlers/delete-handler';

/**
 * POST /api/monitoring/dashboard
 * 收集监控仪表板数据
 */
export function POST(request: NextRequest) {
  return handlePostRequest(request);
}

/**
 * GET /api/monitoring/dashboard
 * 获取监控仪表板统计信息
 */
export function GET(request: NextRequest) {
  return handleGetRequest(request);
}

/**
 * PUT /api/monitoring/dashboard
 * 更新监控配置
 */
export function PUT(request: NextRequest) {
  return handlePutRequest(request);
}

/**
 * DELETE /api/monitoring/dashboard
 * 清除监控数据（管理功能）
 */
export function DELETE(request: NextRequest) {
  return handleDeleteRequest(request);
}
