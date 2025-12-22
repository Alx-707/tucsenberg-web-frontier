# Change: Upgrade Core Tech Stack (December 2025)

## Why

项目核心依赖（Next.js、React、next-intl、Zod）已落后最新稳定版本，存在以下问题：
1. **性能收益缺失**：Next.js 16.1.0 带来 Turbopack 文件系统缓存、Inner Graph Tree Shaking 等重要优化
2. **稳定性风险**：React 19.2.3 修复了 RSC 循环保护和 SSR microtask 问题
3. **Node.js 版本约束过严**：当前限制 `>=20 <21`，阻碍开发环境升级
4. **工具链落后**：Vitest、Playwright、ESLint 等开发工具有多个版本更新

## What Changes

### Phase 1: Node.js 版本约束
- **BREAKING**: 放宽 `engines.node` 从 `>=20 <21` 到 `>=20 <23`
- 支持 Node.js 20.x、21.x、22.x

### Phase 2: React 生态升级
- `react`: 19.1.1 → 19.2.3
- `react-dom`: 19.1.1 → 19.2.3
- `@types/react`: 19.2.4 → 19.2.7
- `@types/react-dom`: 19.2.3 → 19.2.7
- `@types/node`: 20.19.9 → 22.x（与 `engines.node` 上限对齐）
- `@testing-library/react`: 16.3.0 → 16.3.1

### Phase 3: Next.js 生态升级
- `next`: 16.0.10 → 16.1.0
- `@next/mdx`: 16.0.8 → 16.1.0
- `@next/bundle-analyzer`: 16.0.8 → 16.1.0
- `@next/eslint-plugin-next`: 16.0.8 → 16.1.0
- `eslint-config-next`: 16.0.8 → 16.1.0

### Phase 4: i18n 与验证库升级
- `next-intl`: 4.5.2 → 4.6.1
- `zod`: 4.1.12 → 4.2.1

### Phase 5: 测试工具链升级
- `vitest`: 4.0.8 → 4.0.16
- `@vitest/coverage-v8`: 4.0.8 → 4.0.16
- `@vitest/ui`: 4.0.8 → 4.0.16
- `@vitest/browser-playwright`: 4.0.8 → 4.0.16
- `@playwright/test`: 1.56.1 → 1.57.0
- `playwright`: 1.56.1 → 1.57.0

### Phase 6: 样式与 UI 升级
- `tailwindcss`: 4.1.17 → 4.1.18
- `@tailwindcss/postcss`: 4.1.17 → 4.1.18
- `lucide-react`: 0.553.0 → 0.562.0
- `@marsidev/react-turnstile`: 1.3.1 → 1.4.0

### Phase 7: 开发工具升级（Minor/Patch）
- `eslint`: 9.39.1 → 9.39.2
- `@eslint/js`: 9.39.1 → 9.39.2
- `@eslint/eslintrc`: 3.3.1 → 3.3.3
- `typescript-eslint`: 8.46.4 → 8.50.0
- `prettier`: 3.6.2 → 3.7.4
- `knip`: 5.69.1 → 5.76.2
- `tsx`: 4.20.6 → 4.21.0
- `dependency-cruiser`: 17.2.0 → 17.3.5
- `eslint-plugin-react-you-might-not-need-an-effect`: 0.7.0 → 0.8.1

### Phase 8: 其他依赖升级
- `resend`: 6.4.2 → 6.6.0
- `@vercel/analytics`: 1.5.0 → 1.6.1
- `@vercel/speed-insights`: 1.2.0 → 1.3.1
- `@t3-oss/env-nextjs`: 0.13.8 → 0.13.10
- `happy-dom`: 20.0.10 → 20.0.11
- `jsdom`: 27.2.0 → 27.3.0
- `react-grab`: 0.0.88 → 0.0.91

### Phase 9: Major 版本升级（高风险，需单独验证）
- `@commitlint/cli`: 19.8.1 → 20.2.0 **MAJOR**
- `@commitlint/config-conventional`: 19.8.1 → 20.2.0 **MAJOR**
- `eslint-import-resolver-typescript`: 3.10.1 → 4.4.4 **MAJOR**
- `eslint-plugin-react-hooks`: 5.2.0 → 7.0.1 **MAJOR**
- `glob`: 11.1.0 → 13.0.0 **MAJOR**
- `lefthook`: 1.12.2 → 2.0.12 **MAJOR**

### 明确排除的升级
- `@types/node`: ~~20.19.9 → 25.0.3~~ → 改为升级到 22.x（见 Phase 2）
- `react-scan`: 0.0.42 → 0.4.3 ❌ 暂不升级（0.x 版本 API 不稳定，需单独评估）

## Impact

### Affected Code
- `package.json` - 版本号更新
- `pnpm-lock.yaml` - 依赖树更新

### Affected Specs
- `specs/infrastructure/spec.md` - Node.js 运行时兼容性与依赖对齐要求

### Risk Assessment
| Phase | Risk Level | Mitigation |
|-------|------------|------------|
| 1 | 中 | 放宽引擎后需在 Node 20/22 上验证 native 依赖（如 sharp、@sentry/cli） |
| 2 | 中 | React 内部变更可能影响 hydration |
| 3 | 中 | Turbopack 行为变化需验证 |
| 4 | 低 | 无 breaking changes |
| 5 | 中 | Playwright 浏览器版本更新可能导致 E2E 波动 |
| 6 | 中 | `lucide-react` 为 0.x，需检查 icon 名称/渲染 |
| 7 | 低 | Minor/Patch 级别，lint 规则可能有变化 |
| 8 | 中 | 运行时依赖更新（`resend`/`react-grab`）需回归关键流程 |
| 9 | 🔴 高 | Major 版本升级，需逐个验证 breaking changes |

### Expected Benefits
1. **开发体验**：Turbopack 文件系统缓存默认启用，热重载更快
2. **构建优化**：Inner Graph Tree Shaking 减少 bundle 体积
3. **缓存粒度**：Head 单独缓存，配合 cacheComponents 更高效
4. **内存优化**：Hydration 完成后自动释放内存
5. **新工具**：`next analyze` 内置 bundle 分析、`next upgrade` 简化升级

### Known Limitations
- PPR/dynamicIO + i18n 路由兼容性问题**未解决**（依赖 Next.js `rootParams` API，见 next-intl #1493）
- 项目当前"显式 locale + Cache Components"模式仍是最佳实践，无需调整
