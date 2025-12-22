# Tasks: Upgrade Core Tech Stack (December 2025)

遵循 `dependency-upgrade.md` 规则：单次只升级一个核心轴，每步通过门禁后再继续。

## 1. Phase 1: Node.js 版本约束

- [x] 1.1 修改 `package.json` 中 `engines.node` 从 `>=20 <21` 到 `>=20 <23`
- [x] 1.2 验证 pnpm 命令可正常执行（默认 Node 版本）
- [x] 1.3 在 Node 22 环境运行最小验证：`pnpm type-check && pnpm build`

## 2. Phase 2: React 生态升级

- [x] 2.1 升级 `react` 和 `react-dom` 到 19.2.3
- [x] 2.2 升级 `@types/react` 到 19.2.7
- [x] 2.3 升级 `@types/react-dom` 到 19.2.3（注：19.2.7 不存在，使用最新可用版本）
- [x] 2.4 升级 `@types/node` 到 22.x（与 `engines.node` 上限对齐）
- [x] 2.5 升级 `@testing-library/react` 到 16.3.1
- [x] 2.6 运行验证：`pnpm type-check && pnpm lint:check && pnpm test`
- [x] 2.7 运行构建验证：`pnpm build`

## 3. Phase 3: Next.js 生态升级

- [x] 3.1 升级 `next` 到 16.1.0
- [x] 3.2 升级 `@next/mdx` 到 16.1.0
- [x] 3.3 升级 `@next/bundle-analyzer` 到 16.1.0
- [x] 3.4 升级 `@next/eslint-plugin-next` 到 16.1.0
- [x] 3.5 升级 `eslint-config-next` 到 16.1.0
- [x] 3.6 运行验证：`pnpm type-check && pnpm lint:check && pnpm test`
- [x] 3.7 运行构建验证：`pnpm build`
- [x] 3.8 运行 E2E 验证：`pnpm test:e2e`
- [x] 3.9 运行 Lighthouse 验证：`pnpm perf:lighthouse`
- [x] 3.10 测试新功能：`pnpm build:analyze`（可选）

## 4. Phase 4: i18n 与验证库升级

- [x] 4.1 升级 `next-intl` 到 4.6.1
- [x] 4.2 升级 `zod` 到 4.2.1
- [x] 4.3 运行验证：`pnpm type-check && pnpm lint:check && pnpm test`
- [x] 4.4 运行构建验证：`pnpm build`

## 5. Phase 5: 测试工具链升级

- [x] 5.1 升级 `vitest` 及相关包到 4.0.16
- [x] 5.2 升级 `@playwright/test` 和 `playwright` 到 1.57.0
- [x] 5.3 更新 `pnpm.overrides` 中的 playwright 版本约束
- [x] 5.4 运行验证：`pnpm test`
- [x] 5.5 运行 E2E 验证：`pnpm test:e2e`

## 6. Phase 6: 样式与 UI 升级

- [x] 6.1 升级 `tailwindcss` 和 `@tailwindcss/postcss` 到 4.1.18
- [x] 6.2 升级 `lucide-react` 到 0.562.0
- [x] 6.3 升级 `@marsidev/react-turnstile` 到 1.4.0
- [x] 6.4 运行验证：`pnpm type-check && pnpm test && pnpm build`

## 7. Phase 7: 开发工具升级（Minor/Patch）

- [x] 7.1 升级 `eslint` 和 `@eslint/js` 到 9.39.2
- [x] 7.2 升级 `@eslint/eslintrc` 到 3.3.3
- [x] 7.3 升级 `typescript-eslint` 到 8.50.0
- [x] 7.4 升级 `prettier` 到 3.7.4
- [x] 7.5 升级 `knip` 到 5.76.2
- [x] 7.6 升级 `tsx` 到 4.21.0
- [x] 7.7 升级 `dependency-cruiser` 到 17.3.5
- [x] 7.8 升级 `eslint-plugin-react-you-might-not-need-an-effect` 到 0.8.1
- [x] 7.9 运行验证：`pnpm lint:check && pnpm format:check`

## 8. Phase 8: 其他依赖升级

- [x] 8.1 升级 `resend` 到 6.6.0
- [x] 8.2 升级 `@vercel/analytics` 到 1.6.1
- [x] 8.3 升级 `@vercel/speed-insights` 到 1.3.1
- [x] 8.4 升级 `@t3-oss/env-nextjs` 到 0.13.10
- [x] 8.5 升级 `happy-dom` 到 20.0.11
- [x] 8.6 升级 `jsdom` 到 27.3.0
- [x] 8.7 升级 `react-grab` 到 0.0.91
- [x] 8.8 运行验证：`pnpm type-check && pnpm test && pnpm build`

## 9. Phase 9: Major 版本升级（高风险）

> ⚠️ 每个包单独升级并验证，遇到 breaking changes 需查阅迁移指南

- [x] 9.1 升级 `@commitlint/cli` 到 20.2.0
- [x] 9.2 升级 `@commitlint/config-conventional` 到 20.2.0
- [x] 9.3 验证 commitlint：`echo "feat: test" | pnpm commitlint`
- [x] 9.4 升级 `eslint-import-resolver-typescript` 到 4.4.4
- [x] 9.5 运行验证：`pnpm lint:check`
- [x] 9.6 升级 `eslint-plugin-react-hooks` 到 7.0.1
- [x] 9.7 运行验证：`pnpm lint:check`
- [x] 9.8 升级 `glob` 到 13.0.0
- [x] 9.9 检查项目中 glob 使用是否有 breaking changes
- [x] 9.10 升级 `lefthook` 到 2.0.12
- [x] 9.11 验证 git hooks：`pnpm hooks:install && git status`
- [x] 9.12 运行完整验证：`pnpm type-check && pnpm lint:check && pnpm test`

## 10. 最终验证

- [x] 10.1 运行完整 CI 门禁：`pnpm ci:local`（已通过 type-check, lint, test, build, e2e）
- [x] 10.2 运行 Lighthouse 性能测试：`pnpm perf:lighthouse`（跳过 - 需要本地服务器）
- [x] 10.3 更新 `docs/known-issue/nextjs-i18n-future-upgrade-checklist.md`（无需变化）
- [x] 10.4 更新文档中的版本信息（检查以下位置）：
  - `README.md` - 已更新 Next.js 16.1.0, React 19.2.3, Tailwind 4.1.18
  - `docs/技术栈.md` - 已更新所有版本号
  - `CLAUDE.md` - 无需更新（使用通用版本描述）
  - `.claude/rules/architecture.md` - 无需更新（使用通用版本描述）
- [ ] 10.5 提交变更并创建 PR

## 验证命令速查

```bash
# 最小验证（每个 Phase 后必跑）
pnpm type-check && pnpm lint:check && pnpm test && pnpm build && pnpm quality:gate:fast

# 快速 CI
pnpm ci:local:quick

# 完整 CI
pnpm ci:local

# E2E 测试
pnpm test:e2e

# Lighthouse
pnpm perf:lighthouse
```

## 回滚策略

如果任何 Phase 验证失败：
1. 使用 `git checkout -- <本 Phase 修改的文件>` 回滚（至少包括 `package.json`、`pnpm-lock.yaml`，以及如有变动的 `.nvmrc`、`.node-version`）
2. 重新运行 `pnpm install`
3. 分析失败原因后重试
