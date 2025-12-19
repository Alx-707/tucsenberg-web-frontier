# 项目评审骨架

## 模块地图（按目录/职责）
- **App 路由与页面**：`src/app/`，入口 `src/app/layout.tsx` 与各 `page.tsx`，依赖 Next.js App Router 与 `next-intl`，风险：交付/性能（路由注册、服务端渲染策略影响用户路径）。【F:README.md†L137-L173】【F:DEVELOPMENT.md†L136-L150】
- **UI 组件库**：`src/components/`，共享 UI 与布局组件，依赖 React 19、Tailwind CSS、Radix UI，风险：质量/性能（交互与可访问性、SSR/CSR 一致性）。【F:README.md†L137-L151】【F:package.json†L11-L29】
- **配置与特性开关**：`src/config/` 与 `src/constants/`，集中 feature flag、主题、表单与运行参数，依赖 TypeScript 配置对象与环境变量，风险：交付/安全（配置缺失或默认值导致功能异常）。【F:README.md†L85-L99】
- **国际化与内容**：`messages/`、`content/`、`src/i18n/`，翻译分层与 MDX 内容，依赖 `next-intl`、MDX loader，风险：交付/质量（示例内容未替换、slug/i18n 形状校验）。【F:README.md†L25-L66】【F:DEVELOPMENT.md†L103-L120】
- **领域服务与集成**：`src/services/`（如邮件/分析）、`src/lib/`（工具、性能监控、结构化数据）支撑业务逻辑，依赖 Resend、web-vitals 等，风险：安全/性能（外部依赖可用性、数据处理效率）。【F:package.json†L95-L115】
- **测试与质量基建**：`src/__tests__/`、`src/testing/`、`tests/`，Vitest/Playwright 配置与质量门禁脚本，风险：质量（覆盖率低于阈值、E2E 依赖浏览器环境）。【F:README.md†L190-L234】【F:DEVELOPMENT.md†L109-L120】

## 优先级队列（后续深挖顺序）
1. **App 路由与页面（src/app）**：直接决定导航与 SEO，且存在未实现路由提示，优先验证交付风险。【F:DEVELOPMENT.md†L103-L108】
2. **国际化与内容层（messages/content/src/i18n）**：示例内容待替换且依赖翻译形状校验，影响首屏与多语言体验。【F:DEVELOPMENT.md†L103-L120】【F:README.md†L25-L66】
3. **测试与质量基建（tests、src/testing）**：覆盖率接近阈值且质量门禁脚本复杂，需先梳理以避免回归。【F:DEVELOPMENT.md†L109-L120】【F:README.md†L200-L234】
