/**
 * 页面头部组件属性接口
 */
export interface PageHeadProps {
  organizationData: string;
  websiteData: string;
}

/**
 * 页面头部组件
 * 包含字体预加载、资源预加载和结构化数据
 */
export function PageHead({ organizationData, websiteData }: PageHeadProps) {
  return (
    <head>
      {/* 字体预加载优化 */}
      <link
        rel='preconnect'
        href='https://fonts.googleapis.com'
      />
      <link
        rel='preconnect'
        href='https://fonts.gstatic.com'
        crossOrigin='anonymous'
      />

      {/* 关键资源预加载策略 */}
      {/* 预加载关键CSS文件 */}
      <link
        rel='preload'
        href='/globals.css'
        as='style'
      />

      {/* 预加载关键图片资源 */}
      <link
        rel='preload'
        href='/next.svg'
        as='image'
        type='image/svg+xml'
      />

      {/* API预连接 - 内部API路由 */}
      <link
        rel='preconnect'
        href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api`}
      />

      {/* 字体子集预加载 - 第四阶段优化 */}
      <link
        rel='preload'
        href='/fonts/subsets/pingfang-sc-subset.woff2'
        as='font'
        type='font/woff2'
        crossOrigin='anonymous'
      />
      <link
        rel='preload'
        href='/fonts/subsets/pingfang-sc-subset-bold.woff2'
        as='font'
        type='font/woff2'
        crossOrigin='anonymous'
      />

      {/* 结构化数据 */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: organizationData }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: websiteData }}
      />
    </head>
  );
}
