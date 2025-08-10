import Link from 'next/link';
import { WarningIcon, SetupStep } from './admin-ui-components';
import { TINA_URLS } from './admin-utils';

/**
 * 未配置状态组件
 * 显示TinaCMS配置指导界面
 */
export function UnconfiguredState() {
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
            <div className='mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-4'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <WarningIcon />
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-yellow-800'>
                    Configuration Required
                  </h3>
                  <div className='mt-2 text-sm text-yellow-700'>
                    <p>
                      TinaCMS needs to be configured with your credentials
                      before you can use it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className='mb-4 text-xl font-semibold'>Setup Instructions</h2>
            <div className='space-y-4 text-left'>
              <SetupStep
                stepNumber={1}
                title='Get TinaCMS Credentials'
              >
                <p className='text-sm text-gray-600'>
                  Visit{' '}
                  <a
                    href={TINA_URLS.TINA_CLOUD}
                    className='text-blue-600 hover:underline'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {TINA_URLS.TINA_CLOUD}
                  </a>{' '}
                  to create your account and get your client ID and token.
                </p>
              </SetupStep>

              <SetupStep
                stepNumber={2}
                title='Update Environment Variables'
              >
                <p className='mb-2 text-sm text-gray-600'>
                  Update your{' '}
                  <code className='rounded bg-gray-100 px-1'>.env.local</code>{' '}
                  file with your actual TinaCMS credentials:
                </p>
                <div className='rounded bg-gray-100 p-3 font-mono text-sm'>
                  NEXT_PUBLIC_TINA_CLIENT_ID=your_actual_client_id
                  <br />
                  TINA_TOKEN=your_actual_token
                </div>
              </SetupStep>

              <SetupStep
                stepNumber={3}
                title='Restart Development Server'
              >
                <p className='text-sm text-gray-600'>
                  Restart your development server with{' '}
                  <code className='rounded bg-gray-100 px-1'>
                    pnpm run tina:dev
                  </code>{' '}
                  to apply the changes.
                </p>
              </SetupStep>
            </div>

            <div className='mt-6 border-t border-gray-200 pt-6'>
              <div className='flex justify-center space-x-4'>
                <Link
                  href='/'
                  className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                >
                  View Site
                </Link>
                <a
                  href={TINA_URLS.TINA_CLOUD}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                >
                  Get TinaCMS Credentials
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
