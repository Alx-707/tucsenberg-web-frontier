import { TINA_URLS } from './admin-utils';

/**
 * 管理界面访问组件
 * 显示TinaCMS管理界面和GraphQL查询界面的访问链接
 */
export function AdminAccess() {
  return (
    <div className='mt-6 rounded-md border border-blue-200 bg-blue-50 p-4'>
      <h3 className='mb-2 font-medium text-blue-800'>管理界面访问</h3>
      <div className='space-y-2 text-sm'>
        <div className='flex items-center justify-between'>
          <span className='text-blue-700'>TinaCMS 管理界面：</span>
          <a
            href={TINA_URLS.ADMIN_INTERFACE}
            className='font-mono text-blue-600 hover:underline'
            target='_blank'
            rel='noopener noreferrer'
          >
            localhost:4001/admin
          </a>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-blue-700'>GraphQL 查询界面：</span>
          <a
            href={TINA_URLS.GRAPHQL_INTERFACE}
            className='font-mono text-blue-600 hover:underline'
            target='_blank'
            rel='noopener noreferrer'
          >
            localhost:4001/graphql
          </a>
        </div>
      </div>
      <div className='mt-3 rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800'>
        <strong>注意：</strong> TinaCMS
        管理界面目前仅支持英文，但您可以在其中管理中文和英文内容。
      </div>
    </div>
  );
}
