# 文档提及组件清单

基于 docs/technology/技术栈.md 的完整组件清单（2025-01-01）

## 核心框架

| 组件名称 | 文档版本 | 描述 |
|---------|---------|------|
| Next.js | 15.5.2 | React 全栈框架，App Router 架构 |
| React | 19.1.1 | 用户界面库，支持服务器组件 |
| TypeScript | 5.9.2 | 类型安全的 JavaScript 超集 |
| Tailwind CSS | 4.1.11 | 原子化 CSS 框架 |

## 内容管理系统

| 组件名称 | 文档版本 | 描述 |
|---------|---------|------|
| @next/mdx | 15.5.2 | Next.js 原生 MDX 支持 |
| @mdx-js/loader | 3.1.0 | MDX 文件加载器 |
| @mdx-js/react | 3.1.0 | React 组件嵌入支持 |
| gray-matter | 4.0.3 | Front Matter 解析 |
| @types/mdx | 2.0.13 | MDX 类型定义 |
| Airtable | 0.12.2 | 联系表单数据存储 |
| Resend | 6.0.2 | 邮件发送服务 |

## UI 设计系统

| 组件名称 | 文档版本 | 描述 |
|---------|---------|------|
| shadcn/ui | - | 现代化 UI 组件库（New York 风格） |
| @radix-ui/react-dialog | 1.1.15 | 模态对话框 |
| @radix-ui/react-dropdown-menu | 2.1.16 | 下拉菜单 |
| @radix-ui/react-label | 2.1.7 | 表单标签 |
| @radix-ui/react-navigation-menu | 1.2.14 | 导航菜单 |
| @radix-ui/react-slot | 1.2.3 | 组件插槽系统 |
| @radix-ui/react-tabs | 1.1.13 | 标签页组件 |
| @radix-ui/react-checkbox | 1.3.2 | 复选框组件 |
| class-variance-authority | 0.7.1 | 样式变体管理 |
| clsx | 2.1.1 | 条件类名合并 |
| tailwind-merge | 3.3.1 | 条件类名合并 |
| lucide-react | 0.542.0 | SVG 图标库 |
| sonner | 2.0.7 | 通知系统 |
| embla-carousel-react | 8.6.0 | 轮播组件 |
| nextjs-toploader | 3.8.16 | 页面加载进度条 |
| @tailwindcss/typography | 0.5.16 | 排版系统 |
| geist | 1.4.2 | Vercel 官方字体 |
| next-themes | 0.4.6 | 主题切换 |
| tailwindcss-animate | 1.0.7 | 动画扩展 |
| tw-animate-css | 1.3.6 | 额外动画工具 |
| React Hook Form | 7.62.0 | 高性能表单库 |
| @hookform/resolvers | 5.2.1 | 表单验证解析器增强 |
| Zod | 4.1.5 | TypeScript 模式验证 |
| @marsidev/react-turnstile | 1.3.0 | Cloudflare Turnstile 机器人防护 |

## 开发工具链

| 组件名称 | 文档版本 | 描述 |
|---------|---------|------|
| eslint | 9.32.0 | 代码质量检查（Flat Config） |
| @eslint/eslintrc | 3.3.1 | ESLint 配置工具 |
| @eslint/js | 9.33.0 | ESLint JavaScript 配置 |
| typescript-eslint | 8.39.0 | TypeScript 专用规则 |
| eslint-plugin-react | 7.37.5 | React 组件规则 |
| eslint-plugin-react-hooks | 5.2.0 | React Hooks 最佳实践 |
| eslint-plugin-react-you-might-not-need-an-effect | 0.4.1 | useEffect 优化 |
| @next/eslint-plugin-next | 15.5.2 | Next.js 专用规则 |
| eslint-plugin-import | 2.32.0 | 导入语句规则 |
| eslint-plugin-promise | 7.2.1 | Promise 最佳实践 |
| eslint-config-prettier | 10.1.8 | Prettier 冲突解决 |
| eslint-plugin-security | 3.0.1 | 安全规则检查 |
| eslint-plugin-security-node | 1.1.4 | Node.js 安全规则 |
| prettier | 3.6.2 | 代码格式化核心 |
| @ianvs/prettier-plugin-sort-imports | 4.7.0 | 导入排序 |
| prettier-plugin-tailwindcss | 0.6.8 | Tailwind CSS 类名排序 |
| @next/bundle-analyzer | 15.4.6 | 包大小分析 |
| pnpm | 10.13.1 | 包管理器 |
| size-limit | 11.2.0 | 包大小监控 |
| @size-limit/preset-big-lib | 11.2.0 | 大型库预设配置 |
| dependency-cruiser | 17.0.1 | 依赖分析 |
| madge | 8.0.0 | 循环依赖检测 |
| jscpd | 4.0.5 | 代码重复度检测 |
| @jscpd/badge-reporter | 4.0.1 | 徽章报告器 |
| @jscpd/html-reporter | 4.0.1 | HTML报告器 |
| import-in-the-middle | 1.14.2 | 模块导入中间件 |
| require-in-the-middle | 7.5.2 | 模块加载中间件 |
| @babel/parser | 7.28.0 | Babel AST 解析器 |
| @babel/traverse | 7.28.0 | Babel AST 遍历工具 |
| concurrently | 9.2.0 | 并行执行多个命令 |
| dotenv | 17.2.1 | 环境变量加载工具 |
| glob | 11.0.3 | 文件匹配模式工具 |
| @tailwindcss/postcss | 4.1.11 | Tailwind CSS PostCSS 插件 |
| react-scan | 0.0.42 | React 组件性能监控 |
| lefthook | 1.12.2 | Git hooks 管理 |
| @commitlint/cli | 19.8.1 | 提交信息规范 |
| @commitlint/config-conventional | 19.8.1 | 约定式提交 |
| husky | 9.1.7 | Git hooks 备用方案 |
| @types/node | 20.19.9 | Node.js 类型定义 |
| @types/react | 19.1.8 | React 19 类型定义 |
| @types/react-dom | 19.1.6 | React DOM 类型定义 |

## 测试框架

| 组件名称 | 文档版本 | 描述 |
|---------|---------|------|
| vitest | 3.2.4 | 现代化测试框架 |
| @vitest/browser | 3.2.4 | 浏览器环境测试支持 |
| @vitest/coverage-v8 | 3.2.4 | V8 引擎覆盖率工具 |
| @vitest/ui | 3.2.4 | 可视化测试界面 |
| jsdom | 26.1.0 | 浏览器环境模拟 |
| happy-dom | 18.0.1 | 轻量级 DOM 环境 |
| @testing-library/react | 16.3.0 | React 组件测试 |
| @testing-library/jest-dom | 6.8.0 | DOM 断言扩展 |
| @testing-library/user-event | 14.6.1 | 用户交互模拟 |
| @playwright/test | 1.55.0 | 端到端测试框架 |
| playwright | 1.54.2 | Playwright 核心引擎 |
| @axe-core/playwright | 4.10.2 | 无障碍测试集成 |
| axe-core | 4.10.3 | 无障碍测试核心 |
| axe-playwright | 2.1.0 | Playwright 无障碍测试工具 |
| @lhci/cli | 0.15.1 | Lighthouse CI 性能监控 |
| lighthouse | 12.8.1 | 性能和质量审计 |

## 性能优化与监控

| 组件名称 | 文档版本 | 描述 |
|---------|---------|------|
| @vercel/analytics | 1.5.0 | 性能分析和用户行为追踪 |
| web-vitals | 5.0.3 | 核心性能指标监控 |

## 安全与部署

| 组件名称 | 文档版本 | 描述 |
|---------|---------|------|
| @t3-oss/env-nextjs | 0.13.8 | 类型安全环境变量 |
| @sentry/nextjs | 10.3.0 | 错误监控和性能追踪 |
| @sentry/cli | 2.52.0 | Sentry 命令行工具 |

## 国际化与SEO

| 组件名称 | 文档版本 | 描述 |
|---------|---------|------|
| next-intl | 4.3.4 | Next.js 国际化框架 |
| next-sitemap | 4.2.3 | 自动 sitemap 和 hreflang 生成 |
| whatsapp | 0.0.5-Alpha | WhatsApp Business API |

## 可选扩展

| 组件名称 | 文档版本 | 描述 | 状态 |
|---------|---------|------|------|
| sharp | 0.34.3 | 高性能图片处理库 | 已安装 |
| react-loading-skeleton | - | 骨架屏加载状态 | 未安装，按需添加 |
| react-leaflet | 5.0.0 | 开源地图组件 | 未安装，按需添加 |
| lottie-react | - | 复杂动画和品牌动画支持 | 未安装，按需添加 |

## 统计信息

- **文档提及组件总数**: 约 90+ 个
- **明确标注版本号的组件**: 约 80+ 个
- **标注为未安装的组件**: 3 个
- **分析日期**: 2025-01-01
