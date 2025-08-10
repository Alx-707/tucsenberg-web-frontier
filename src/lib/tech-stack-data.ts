export interface TechStackItem {
  name: string;
  version: string;
  category: string;
  description: string;
  icon?: string;
  url?: string;
}

export const techStackData: TechStackItem[] = [
  // 核心框架
  {
    name: 'Next.js',
    version: '15.1.6',
    category: 'core',
    description: 'React 全栈框架，支持 SSR/SSG',
    url: 'https://nextjs.org',
  },
  {
    name: 'React',
    version: '19.0.0',
    category: 'core',
    description: '现代化用户界面库',
    url: 'https://react.dev',
  },
  {
    name: 'TypeScript',
    version: '5.8.2',
    category: 'core',
    description: '类型安全的 JavaScript 超集',
    url: 'https://typescriptlang.org',
  },

  // UI 系统
  {
    name: 'Tailwind CSS',
    version: '4.0.0',
    category: 'ui',
    description: '实用优先的 CSS 框架',
    url: 'https://tailwindcss.com',
  },
  {
    name: 'shadcn/ui',
    version: 'latest',
    category: 'ui',
    description: '可复制粘贴的组件库',
    url: 'https://ui.shadcn.com',
  },
  {
    name: 'Radix UI',
    version: 'latest',
    category: 'ui',
    description: '无样式、可访问的组件原语',
    url: 'https://radix-ui.com',
  },

  // 国际化
  {
    name: 'next-intl',
    version: '3.29.1',
    category: 'i18n',
    description: 'Next.js 国际化解决方案',
    url: 'https://next-intl.dev',
  },

  // 工具链
  {
    name: 'ESLint',
    version: '9.18.0',
    category: 'tools',
    description: 'JavaScript/TypeScript 代码检查工具',
    url: 'https://eslint.org',
  },
  {
    name: 'Prettier',
    version: '3.4.2',
    category: 'tools',
    description: '代码格式化工具',
    url: 'https://prettier.io',
  },
  {
    name: 'Husky',
    version: '9.1.7',
    category: 'tools',
    description: 'Git hooks 管理工具',
    url: 'https://typicode.github.io/husky',
  },

  // 测试
  {
    name: 'Jest',
    version: '29.7.0',
    category: 'testing',
    description: 'JavaScript 测试框架',
    url: 'https://jestjs.io',
  },
  {
    name: 'Testing Library',
    version: '16.1.0',
    category: 'testing',
    description: 'React 组件测试工具',
    url: 'https://testing-library.com',
  },

  // 开发工具
  {
    name: 'pnpm',
    version: '10.13.1',
    category: 'dev',
    description: '快速、节省磁盘空间的包管理器',
    url: 'https://pnpm.io',
  },
  {
    name: 'Turbo',
    version: '2.3.3',
    category: 'dev',
    description: '高性能构建系统',
    url: 'https://turbo.build',
  },

  // 性能监控
  {
    name: 'Lighthouse',
    version: 'latest',
    category: 'performance',
    description: 'Web 性能审计工具',
    url: 'https://developers.google.com/web/tools/lighthouse',
  },

  // 安全
  {
    name: 'Semgrep',
    version: 'latest',
    category: 'security',
    description: '静态代码安全分析工具',
    url: 'https://semgrep.dev',
  },

  // 动画
  {
    name: 'Embla Carousel',
    version: '8.6.0',
    category: 'animation',
    description: '轻量级轮播组件库',
    url: 'https://embla-carousel.com',
  },

  // 部署
  {
    name: 'Vercel',
    version: 'latest',
    category: 'deployment',
    description: 'Next.js 应用部署平台',
    url: 'https://vercel.com',
  },

  // 代码质量
  {
    name: 'SonarQube',
    version: 'latest',
    category: 'quality',
    description: '代码质量和安全分析平台',
    url: 'https://sonarqube.org',
  },

  // 文档
  {
    name: 'Storybook',
    version: '8.4.7',
    category: 'docs',
    description: '组件开发和文档工具',
    url: 'https://storybook.js.org',
  },

  // 数据获取
  {
    name: 'SWR',
    version: '2.3.0',
    category: 'data',
    description: '数据获取和缓存库',
    url: 'https://swr.vercel.app',
  },

  // 状态管理
  {
    name: 'Zustand',
    version: '5.0.2',
    category: 'state',
    description: '轻量级状态管理库',
    url: 'https://zustand.docs.pmnd.rs',
  },
];

export const techStackCategories = {
  core: '核心框架',
  ui: 'UI 系统',
  i18n: '国际化',
  tools: '工具链',
  testing: '测试',
  dev: '开发工具',
  performance: '性能监控',
  security: '安全',
  animation: '动画',
  deployment: '部署',
  quality: '代码质量',
  docs: '文档',
  data: '数据获取',
  state: '状态管理',
} as const;

export type TechStackCategory = keyof typeof techStackCategories;
