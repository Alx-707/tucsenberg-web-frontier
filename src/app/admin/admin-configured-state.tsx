import Link from 'next/link';
import { AdminAccess } from './admin-access-panel';
import { ServiceInfo, SuccessIcon } from './admin-ui-components';
import { TINA_URLS } from './admin-utils';

/**
 * 已配置状态组件
 * 显示TinaCMS已正确配置后的管理界面
 */
export function ConfiguredState() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <h1 className='mb-4 text-3xl font-bold text-gray-900'>
            TinaCMS Admin
          </h1>
          <p className='mb-8 text-gray-600'>
            Content management interface for Tucsenberg Web Frontier
          </p>

          <div className='mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md'>
            <div className='mb-6 rounded-md border border-green-200 bg-green-50 p-4'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <SuccessIcon />
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-green-800'>
                    TinaCMS is Configured!
                  </h3>
                  <div className='mt-2 text-sm text-green-700'>
                    <p>Your TinaCMS credentials are properly configured.</p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className='mb-4 text-xl font-semibold'>TinaCMS 服务</h2>
            <div className='space-y-4 text-left'>
              <ServiceInfo
                stepNumber={1}
                title='GraphQL API'
              >
                <p className='text-sm text-gray-600'>
                  TinaCMS GraphQL API 运行在{' '}
                  <a
                    href={TINA_URLS.GRAPHQL_INTERFACE}
                    className='text-blue-600 hover:underline'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {TINA_URLS.GRAPHQL_INTERFACE}
                  </a>
                </p>
              </ServiceInfo>

              <ServiceInfo
                stepNumber={2}
                title='内容管理'
              >
                <p className='text-sm text-gray-600'>
                  通过 TinaCMS 界面管理您的博客文章和页面内容。
                </p>
              </ServiceInfo>

              <ServiceInfo
                stepNumber={3}
                title='多语言支持'
              >
                <p className='text-sm text-gray-600'>
                  通过统一界面编辑中文和英文内容。
                </p>
              </ServiceInfo>
            </div>

            <AdminAccess />

            <div className='mt-6 border-t border-gray-200 pt-6'>
              <div className='flex justify-center space-x-4'>
                <Link
                  href='/'
                  className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                >
                  查看网站
                </Link>
                <a
                  href={TINA_URLS.ADMIN_INTERFACE}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                >
                  打开 TinaCMS 管理界面
                </a>
                <a
                  href={TINA_URLS.GRAPHQL_INTERFACE}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none'
                >
                  GraphQL 查询界面
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
