# AI Agent 开发指南（与当前仓库对齐）

## 项目概述
- 类型：Next.js 16 App Router + React 19 + TypeScript 5.9.3 + Tailwind CSS 4.1.18
- 主要特性：英中双语（next-intl）、主题切换（next-themes）、MDX 内容、企业级质量/安全检查
- 依赖基线：见 `package.json`，新增依赖需评审（遵循 pnpm 10.13.1、Node 20）

## 目录与约束
- 主要目录：`src/app`（路由/布局）、`components`、`config`、`constants`、`hooks`、`i18n`、`lib`、`services`、`shared`、`templates`、`test`、`testing`、`types`；内容与翻译在 `content/**`、`messages/**`，静态资源在 `public/`。
- App Router only：禁止新增 Pages Router。
- 复用组件：优先使用 `src/components/ui/*`、`components/shared/*`，新增 UI 需与现有风格一致，避免引入新 UI 库（无 shadcn CLI 依赖）。
- Import 规则：使用 `@/` alias，避免新增 `export *`（架构守卫会拦截）。
- 不要随意改动核心配置（`next.config.ts`、`tsconfig.json`、`eslint.config.mjs`）；如需调整，先评估影响。

## 国际化规范（next-intl）
- 消息分层：`messages/en|zh/critical.json`（首屏）与 `deferred.json`（延迟）。新增文案按分层放置，确保键名两语种同步。
- 路由封装：使用 `src/i18n/routing.ts` 导出的 `Link/redirect/useRouter/usePathname`，不要直接用 `next/link`。
- 文案获取：使用 `useTranslations(namespace)`，禁止硬编码中英文。
- Locale 路由：`src/app/[locale]/` 结构已启用，支持 `en`/`zh`，`routing.pathnames` 仅包含已实现页面，新增路由需同步配置。

## 内容与 MDX
- 目录：`content/posts/en|zh`、`content/pages/en|zh`，配置在 `content/config/content.json`。
- Frontmatter 最少包含：`title`, `description`, `slug`, `locale`, `publishedAt`；保持多语言同 slug。
- 工具：使用 `src/lib/content-parser.ts`、`src/lib/content-query/*`、`src/lib/content-utils.ts`；资源放 `public/`，相对路径引用。

## 主题与样式
- 主题：light/dark/system 由 `next-themes` 管理，复用 `components/theme` 与 `theme-provider.tsx`。
- 样式：Tailwind 为主，Prettier+tailwind 插件自动排序类名，避免内联样式滥用。

## 表单与数据
- 参考 `src/config/contact-form-config.ts` + `src/lib/form-schema/*`：前后端字段/校验保持一致，优先使用 zod 校验。
- Server Actions 可用场景优先；如需客户端提交，确保安全校验与错误处理。

## 质量与命令（对齐 package.json）
- 基础检查：`pnpm type-check`，`pnpm type-check:tests`，`pnpm lint:check`，`pnpm format:check`。
- 修复：`pnpm lint:fix`，`pnpm format:write`。
- 翻译：`pnpm validate:translations`；全流程 `pnpm i18n:full`。
- 质量/安全：`pnpm quality:monitor`，`pnpm quality:report:local`，`pnpm quality:gate`，`pnpm quality:quick:staged`，`pnpm arch:check`，`pnpm circular:check`，`pnpm security:check`，`pnpm config:check`，`pnpm unused:check`。
- 测试：`pnpm test`，`pnpm test:coverage`，`pnpm test:e2e`，`pnpm test:e2e:no-reuse`，性能 `pnpm perf:lighthouse`。
- 构建：`pnpm build`（Turbopack），`pnpm build:webpack`（回退），`pnpm build:analyze`。

## 代码风格与安全
- TypeScript 严格模式，避免 `any`；未使用参数请下划线前缀。
- ESLint 禁用 `console`（应用代码），遵循 `eslint.config.mjs`；提交前保证 0 error。
- 安全：遵守 `security-*` 工具与 semgrep 守则，避免危险 API（`dangerouslySetInnerHTML` 需净化后使用）。
- 环境变量：敏感值放 `.env.local`，不要提交真实密钥。

## 协作准则
- 变更文案/内容需保持 `en`/`zh` 同步（messages 与 content）。
- 新路由/页面同步更新 `routing.pathnames`、对应翻译与 MDX/文案。
- 如需新增依赖或调整核心配置，先评估对 lint/构建/安全的影响，再修改文档与脚本。

## 建议的工作流
1) 开发前：`pnpm install` → `pnpm type-check && pnpm lint:check`（确认环境 OK）。
2) 开发中：复用 `@/components` 与 `@/lib` 现有能力，保持 i18n/主题一致性。
3) 提交前：`pnpm format:write && pnpm lint:fix`，再跑 `pnpm type-check && pnpm test`，必要时 `pnpm quality:gate`。

## 参考文件
- 翻译与路由：`src/i18n/routing.ts`，`messages/en|zh/*`
- 内容：`content/**`，`src/lib/content-*.ts`
- 表单：`src/config/contact-form-config.ts`，`src/lib/form-schema/*`
- 主题：`components/theme/*`，`components/ui/theme-switcher*`
- 配置/安全：`next.config.ts`，`eslint.config.mjs`，`src/lib/security/*`
