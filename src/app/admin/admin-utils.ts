/**
 * TinaCMS配置检查工具函数
 */

/**
 * 检查TinaCMS是否已正确配置
 * @returns 是否已配置
 */
export function checkTinaCMSConfiguration(): boolean {
  const clientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID;
  const hasConfig =
    clientId &&
    clientId !== 'your_tina_client_id' &&
    clientId !== 'test_client_id';

  return Boolean(hasConfig);
}

/**
 * TinaCMS相关URL常量
 */
export const TINA_URLS = {
  ADMIN_INTERFACE: 'http://localhost:4001/admin/index.html',
  GRAPHQL_INTERFACE: 'http://localhost:4001/graphql',
  TINA_CLOUD: 'https://app.tina.io',
} as const;

/**
 * 管理页面状态类型
 */
export type AdminPageState = 'loading' | 'configured' | 'unconfigured';

/**
 * 获取管理页面当前状态
 * @param isLoading 是否正在加载
 * @returns 当前状态
 */
export function getAdminPageState(isLoading: boolean): AdminPageState {
  if (isLoading) {
    return 'loading';
  }

  const isConfigured = checkTinaCMSConfiguration();
  return isConfigured ? 'configured' : 'unconfigured';
}
