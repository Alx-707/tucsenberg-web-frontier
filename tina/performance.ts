/**
 * TinaCMS 性能优化配置
 * 用于优化构建时间、缓存策略和用户体验
 */

// 性能配置常量
const PERFORMANCE_CONSTANTS = {
  // 缓存时间（秒）
  CACHE_ONE_YEAR: 31536000, // 1年
  CACHE_ONE_HOUR: 3600, // 1小时
  CACHE_FIVE_MINUTES: 300, // 5分钟
  // 图片尺寸
  IMAGE_SIZE_MOBILE: 320,
  IMAGE_SIZE_TABLET: 640,
  IMAGE_SIZE_SMALL: 768,
  IMAGE_SIZE_MEDIUM: 1024,
  IMAGE_SIZE_LARGE: 1280,
  IMAGE_SIZE_XLARGE: 1920,
  // 百分比
  PERCENT_25: 25,
  PERCENT_50: 50,
  PERCENT_75: 75,
  PERCENT_100: 100,
  // 时间间隔
  MINUTES_15: 15,
  MINUTES_60: 60,
  SECONDS_60: 60,
  // 性能阈值
  BUILD_TIME_THRESHOLD: 30000, // 30秒
  CACHE_HIT_RATE_THRESHOLD: 0.8, // 80%
} as const;

// 缓存配置
export const cacheConfig = {
  // 静态资源缓存时间（秒）
  staticAssets: PERFORMANCE_CONSTANTS.CACHE_ONE_YEAR, // 1年
  // 内容缓存时间（秒）
  content: PERFORMANCE_CONSTANTS.CACHE_ONE_HOUR, // 1小时
  // API 响应缓存时间（秒）
  api: PERFORMANCE_CONSTANTS.CACHE_FIVE_MINUTES, // 5分钟
};

// 构建优化配置
export const buildConfig = {
  // 并行处理数量
  concurrency: 4,
  // 增量构建启用
  incremental: true,
  // 静态生成优化
  staticGeneration: {
    // 预生成页面数量限制
    maxPages: 1000,
    // 按需生成启用
    onDemand: true,
  },
};

// 图片优化配置
export const imageConfig = {
  // 支持的图片格式
  formats: ['webp', 'avif', 'jpeg', 'png'],
  // 图片质量设置
  quality: {
    webp: 80,
    avif: 75,
    jpeg: 85,
  },
  // 响应式图片尺寸
  sizes: [
    PERFORMANCE_CONSTANTS.IMAGE_SIZE_MOBILE,
    PERFORMANCE_CONSTANTS.IMAGE_SIZE_TABLET,
    PERFORMANCE_CONSTANTS.IMAGE_SIZE_SMALL,
    PERFORMANCE_CONSTANTS.IMAGE_SIZE_MEDIUM,
    PERFORMANCE_CONSTANTS.IMAGE_SIZE_LARGE,
    PERFORMANCE_CONSTANTS.IMAGE_SIZE_XLARGE,
  ],
  // 懒加载配置
  lazyLoading: {
    enabled: true,
    threshold: '200px',
  },
};

// 内容优化配置
export const contentConfig = {
  // 内容分页设置
  pagination: {
    postsPerPage: 12,
    maxPages: 100,
  },
  // 搜索优化
  search: {
    // 索引字段
    indexFields: ['title', 'description', 'tags', 'categories'],
    // 搜索结果数量限制
    maxResults: 50,
  },
  // 相关内容推荐
  related: {
    // 推荐数量
    count: 3,
    // 相似度算法
    algorithm: 'tags-categories',
  },
};

// 多语言优化配置
export const i18nConfig = {
  // 语言检测策略
  detection: {
    // 优先级：URL > Cookie > Header
    priority: ['path', 'cookie', 'header'],
    // Cookie 设置
    cookie: {
      name: 'NEXT_LOCALE',
      maxAge: 31536000, // 1年
    },
  },
  // 翻译缓存
  cache: {
    enabled: true,
    ttl: 3600, // 1小时
  },
};

// 监控和分析配置
export const analyticsConfig = {
  // 性能监控
  performance: {
    // Core Web Vitals 阈值
    thresholds: {
      lcp: 2500, // Largest Contentful Paint (ms)
      fid: 100, // First Input Delay (ms)
      cls: 0.1, // Cumulative Layout Shift
    },
    // 采样率
    sampleRate: 0.1, // 10%
  },
  // 用户行为分析
  behavior: {
    // 页面浏览跟踪
    pageViews: true,
    // 点击事件跟踪
    clicks: true,
    // 滚动深度跟踪
    scrollDepth: [
      PERFORMANCE_CONSTANTS.PERCENT_25,
      PERFORMANCE_CONSTANTS.PERCENT_50,
      PERFORMANCE_CONSTANTS.PERCENT_75,
      PERFORMANCE_CONSTANTS.PERCENT_100,
    ],
  },
};

// 安全优化配置
export const securityConfig = {
  // 内容安全策略
  csp: {
    // 允许的图片源
    imgSrc: [
      "'self'",
      'data:',
      'https://images.unsplash.com',
      'https://assets.tina.io',
    ],
    // 允许的脚本源
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://app.tina.io'],
    // 允许的样式源
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
  // 速率限制
  rateLimit: {
    // API 请求限制
    api: {
      windowMs:
        PERFORMANCE_CONSTANTS.MINUTES_15 *
        PERFORMANCE_CONSTANTS.SECONDS_60 *
        1000, // 15分钟
      max: 100, // 最大请求数
    },
    // 内容更新限制
    content: {
      windowMs: PERFORMANCE_CONSTANTS.MINUTES_60 * 1000, // 1分钟
      max: 10, // 最大更新数
    },
  },
};

// 开发环境优化配置
export const devConfig = {
  // 热重载配置
  hotReload: {
    enabled: true,
    // 监听文件类型
    watchFiles: ['content/**/*.mdx', 'tina/**/*.ts'],
  },
  // 开发服务器配置
  server: {
    port: 3000,
    // 自动打开浏览器
    open: false,
    // 代理配置
    proxy: {
      '/api/tina': 'http://localhost:4001',
    },
  },
};

// 生产环境优化配置
export const prodConfig = {
  // 压缩配置
  compression: {
    enabled: true,
    // 压缩级别
    level: 6,
    // 最小压缩文件大小
    threshold: 1024,
  },
  // CDN 配置
  cdn: {
    enabled: true,
    // CDN 域名
    domain: 'https://cdn.tucsenberg.com',
    // 缓存策略
    cacheControl: 'public, max-age=31536000, immutable',
  },
};

// 导出所有配置
export const performanceConfig = {
  cache: cacheConfig,
  build: buildConfig,
  image: imageConfig,
  content: contentConfig,
  i18n: i18nConfig,
  analytics: analyticsConfig,
  security: securityConfig,
  dev: devConfig,
  prod: prodConfig,
};

// 性能监控工具函数
export const performanceUtils = {
  // 测量构建时间
  measureBuildTime: (startTime: number) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    // 在开发环境中记录构建时间
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🏗️  Build completed in ${duration}ms`);
    }
    return duration;
  },

  // 检查内容大小
  checkContentSize: (content: string, maxSize: number = 50000) => {
    const { size } = new Blob([content]);
    if (size > maxSize) {
      console.warn(
        `⚠️  Content size (${size} bytes) exceeds recommended limit (${maxSize} bytes)`,
      );
    }
    return size;
  },

  // 验证图片优化
  validateImageOptimization: (imagePath: string) => {
    const supportedFormats = imageConfig.formats;
    const extension = imagePath.split('.').pop()?.toLowerCase();

    if (!extension || !supportedFormats.includes(extension)) {
      console.warn(
        `⚠️  Image format ${extension} is not optimized. Consider using WebP or AVIF.`,
      );
      return false;
    }
    return true;
  },

  // 生成性能报告
  generatePerformanceReport: (metrics: {
    buildTime?: number;
    contentSize?: number;
    imageOptimization?: boolean;
    cacheHitRate?: number;
  }) => {
    const report = {
      timestamp: new Date().toISOString(),
      buildTime: metrics.buildTime,
      contentSize: metrics.contentSize,
      imageOptimization: metrics.imageOptimization,
      cacheHitRate: metrics.cacheHitRate,
      recommendations: [],
    };

    // 添加优化建议
    if (
      metrics.buildTime &&
      metrics.buildTime > PERFORMANCE_CONSTANTS.BUILD_TIME_THRESHOLD
    ) {
      report.recommendations.push('Consider enabling incremental builds');
    }
    if (
      metrics.cacheHitRate &&
      metrics.cacheHitRate < PERFORMANCE_CONSTANTS.CACHE_HIT_RATE_THRESHOLD
    ) {
      report.recommendations.push('Optimize caching strategy');
    }

    return report;
  },
};
