# Project Review Memory

## 全局行为规范（复用自 AGENTS）
- 对用户回复必须使用中文，保持结构化输出与类比式解释；涉及技术名词可直接使用英文。【F:AGENTS.md†L17-L31】
- 非平凡任务默认使用 Serena/ACE 获取语义上下文，再进行编辑与验证；优先选择官方文档与现有架构约束。【F:AGENTS.md†L10-L79】

## 命令地图与验证记录
- 安装：`pnpm install`（未本次运行）。
- 开发：`pnpm dev`（默认触发 `@react-grab/claude-code`；未本次运行）。【F:package.json†L11-L13】
- 构建：`pnpm build` / `pnpm build:webpack` / `pnpm build:analyze`（未本次运行）。【F:package.json†L14-L19】
- 测试：`pnpm test`（尝试 `pnpm test -- --help` 触发 Vitest 执行，运行中手动中断以节约时间；部分用例通过，未完成全量）。【23933e†L1-L4】【be5156†L1-L93】
- 覆盖率：`pnpm test:coverage`（未本次运行）。【F:package.json†L29-L30】
- E2E：`pnpm test:e2e` / `pnpm test:e2e:no-reuse`（未本次运行）。【F:package.json†L30-L31】【F:package.json†L71-L72】
- Lint：`pnpm lint:check`（执行时间过长，人工 Ctrl+C 终止，结果未知）。【61aede†L1-L4】【bd8aa5†L1-L2】
- 类型检查：`pnpm type-check` / `pnpm type-check:tests`（未本次运行）。【F:package.json†L22-L24】
- 质量/安全：`pnpm security:check`、`pnpm quality:gate`、`pnpm arch:check`（未本次运行）。【F:package.json†L37-L63】

## 关键约定
- 环境要求：Node 20.x、pnpm 10.13.1，未满足将偏离 CI/Vercel 行为。【F:README.md†L64-L70】【F:package.json†L5-L9】
- 必备环境变量：Cloudflare Turnstile 公私钥必须在 `.env.local` 等注入，否则联系表单相关功能不可用。【F:README.md†L72-L83】
- 路由新增需在 `src/i18n/routing.ts` 注册，避免多语言路径缺失。【F:DEVELOPMENT.md†L136-L150】
- 示例内容与未实现页面需替换/补齐后再发布生产站点。【F:DEVELOPMENT.md†L103-L108】

## 风险雷达 Top10
1. OG 图片仍为 SVG 占位符，需要转 JPG 才符合生产要求（交付）。【F:DEVELOPMENT.md†L103-L106】
2. `content/` 内均为示例产品/文章，若不替换会导致上线示例内容（交付/品牌）。【F:DEVELOPMENT.md†L103-L108】
3. `/services`、`/pricing`、`/support` 路由未实现，直接暴露 404（交付）。【F:DEVELOPMENT.md†L103-L108】
4. 组件覆盖率低于阈值（41.9% vs 42%），构建会提示警告（质量）。【F:DEVELOPMENT.md†L109-L120】
5. Turnstile 环境变量缺失将导致安全/表单功能不可用（安全/交付）。【F:README.md†L72-L83】
6. Node/pnpm 版本固定（>=20,<21 与 pnpm 10.13.1），版本漂移可能触发构建差异（交付）。【F:README.md†L64-L70】【F:package.json†L5-L9】
7. 开发脚本默认执行远程 `@react-grab/claude-code`，离线或安全策略可能阻断本地开发（交付/安全）。【F:package.json†L11-L13】
8. 质量门禁依赖 `pnpm security:check`/`quality:gate` 等多脚本，未按推荐流程会漏掉安全扫描（质量/安全）。【F:README.md†L200-L221】
9. Semgrep 安全检查脚本需临时安装二进制，离线环境会失败（安全/交付）。【F:package.json†L39-L41】
10. E2E/性能工具依赖 Playwright/Lighthouse 浏览器环境，CI 本地需准备可执行浏览器，否则测试不可运行（交付/质量）。【F:package.json†L30-L31】【F:package.json†L31-L33】

## 后续模块分析统一规则
- 每次深入模块需先罗列入口文件、外部依赖、对配置/环境的假设，并关联现有测试覆盖点。
- 结论与数据必须附上文件/命令引用；保持风险标签（安全/性能/质量/交付）一致。
- 若需运行命令优先使用 package.json scripts，失败原因与日志摘要记录于本文件。
- 遵循全局沟通规范与类型/架构约束，避免引入 `any`、深层相对路径或新的 `export *` barrel。
