# 偏差任务可执行 Checklist 2025（供 Claude code 执行）

> 目的：把 `docs/architecture-review-2025.md` 中已识别的 5 条偏差任务拆解为可直接执行的 checklist，保证后续自动化模型按同一口径落地、验收与回滚。  
> 适用对象：Claude code opus4.5 等可执行型模型/工程师。  
> 约束：除非 checklist 明确要求 OpenSpec proposal 已批准，否则不得直接编码落地。  

## 执行通用前置（所有任务必做）
- 必读：`docs/architecture-review-2025.md`（含全局基线、Phase 顺序、命名/契约规范、Non‑goals）。  
- 对每个任务先用 ACE/Serena 获取真实现状与引用关系（若工具不可用，需在任务记录中声明并用最小必要文件查看替代）。  
- 开始任何实现前，先跑一次基线门禁，记录结果：  
  - `pnpm type-check`  
  - `pnpm lint:check`  
  - `pnpm test`  
  - `pnpm quality:gate`  
- 所有改动按“一个偏差任务 = 一组小步 commit/PR”推进；每个任务完成后回填到：  
  - 本文对应任务下的 `DONE` 区域  
  - `docs/architecture-review-2025.md` 对应模块 `### 实施简报（Implementation Brief）` 下追加 DONE/验证/回滚点  

---

## 偏差任务 1：CI 覆盖率/测试重复执行（P0）

### 目标状态
- PR/Push 主 CI（`ci.yml`）**只跑一次**覆盖率/测试相关门禁。  
- `quality-gate.js` 仍为覆盖率/增量覆盖的唯一阈值与阻断来源。  
- PR required checks 不出现重复/冲突的 coverage 结果。

### OpenSpec 门槛
- 本任务属于 CI/门禁架构收敛，必须在已批准的 proposal 下执行。  
- 读取并对齐现有 change：  
  - `openspec/changes/p0-quality-gate-unification/`  
  - `openspec/changes/p1-ci-workflow-convergence/`  
- 若任一 proposal 未批准：先补齐/更新 proposal 与 tasks，再走审核。

### 影响范围
- `.github/workflows/ci.yml`  
- `scripts/quality-gate.js`  
- 可能涉及 `.claude/rules/quality-gates.md` 与 `lefthook.yml`（如 proposal 要求）

### Checklist（按序完成）
- [ ] 1.1 用 ACE/Serena 列出重复执行路径：  
  - `ci.yml` 中 `pnpm test:coverage` 的 job/step  
  - `quality-gate.js#checkCoverage()` 触发 `pnpm test:coverage` 的条件  
  - 记录“当前在 CI 中实际跑几次 coverage”的证据（log/step 名称）。  
- [ ] 1.2 选择并在 proposal 中确认**单源策略**（不得新增第三套阈值）：  
  - 策略 A（推荐）：CI 仅生成 coverage 报告，阻断由 `quality:gate` 读取报告完成；`quality:gate` 在 CI 环境**不再二次执行**测试。  
  - 若 proposal 明确其他策略，以 proposal 为准并说明原因。  
- [ ] 1.3 按策略改动 `ci.yml` / `quality-gate.js`：  
  - 删除或跳过其中一处 `test:coverage` 运行；  
  - 确保 coverage-summary 仍能被 `quality:gate` 正确发现。  
- [ ] 1.4 收敛 required checks：  
  - 分支保护只保留 `quality:gate`（full）为覆盖率阻断来源；  
  - 其它 coverage 相关 checks 设为非 required 或移除。  
- [ ] 1.5 全量复验并记录：见下方“验收命令”。  

### 验收命令（必须全绿）
- `pnpm ci:local`（应只触发一次 coverage 生成）  
- `pnpm quality:gate --mode=full`（读取现有报告，不重复跑 coverage）  
- 在 PR CI 日志中确认：`pnpm test:coverage` 仅出现一次。

### 回滚点
- 回滚方式：`git revert <本任务最后一个 commit>`（仅回滚 CI/门禁相关文件）。  
- 回滚触发条件：CI 出现 coverage 报告缺失、required checks 误阻断、或 `quality:gate` 无法定位报告。  

### DONE（执行后填写）
- DONE: 2025-12-12
- 关联 PR/commit: 待提交
- 验收结果摘要:
  - `quality-gate.js` 添加 CI 模式检测和 `--skip-test-run` 参数，CI 环境下仅读取已有报告
  - `ci.yml` architecture job 添加 `needs: [basic-checks, tests]` 依赖，并下载覆盖率 artifact
  - `ci-local.sh` 传递 `--skip-test-run` 参数避免本地重复执行测试
  - 保持向后兼容：本地环境（无 CI=true 且无 --skip-test-run）仍执行测试生成报告
- 回滚点/flag: `git revert` 可单独回滚 `scripts/quality-gate.js`, `.github/workflows/ci.yml`, `scripts/ci-local.sh`

---

## 偏差任务 2：MDX manifest 未驱动 import 自动化（P0/P1）

### 目标状态
- `reports/content-manifest.json` 为内容的单一真相源，并**自动生成** RSC 可用的静态 import 映射。  
- `src/lib/mdx-loader.ts` 不再手写 slug→importer；新增/删除/改名内容无需改代码即可生效。  
- posts/products/pages 三类内容统一走同一渲染/加载模型。

### OpenSpec 门槛
- 本任务属于 MDX RSC 渲染与 manifest/内容路由体系化变更，必须走已批准 proposal。  
- 读取并对齐现有 change：  
  - `openspec/changes/p0-mdx-rsc-rendering/`  
  - `openspec/changes/p1-mdx-production-strategy/`  
- 未批准则先完成 proposal 审核。

### 影响范围
- `scripts/generate-content-manifest.ts`  
- `src/lib/content-manifest.ts`  
- `src/lib/mdx-loader.ts`（目标是改为自动生成/可编译 import map）  
- `content/**` 与 `package.json` 的 `content:manifest/prebuild` 链路  

### Checklist（按序完成）
- [ ] 2.1 ACE/Serena 复核现状：  
  - manifest 当前字段与用途；  
  - `mdx-loader.ts` 的硬编码 importer 覆盖范围与缺口（pages/新增内容）。  
- [ ] 2.2 在 proposal 中确定“自动 import map”产物形态：  
  - 推荐：在 `content:manifest` 执行时同时生成 `src/lib/mdx-importers.generated.ts`，内容为 `{ type → locale → slug → () => import(...) }` 的**静态代码**；  
  - 该文件由脚本全量覆盖生成，禁止手改。  
- [ ] 2.3 扩展 manifest 生成脚本：  
  - 为每个 entry 生成可编译的 `@content/...` import 路径；  
  - 同步输出 generated import map 文件。  
- [ ] 2.4 改造 `mdx-loader.ts`：  
  - 仅消费 generated import map；  
  - 覆盖 posts/products/pages；  
  - 缺失时按文档约定返回 null 或 locale fallback。  
- [ ] 2.5 复验：  
  - 新增一个临时内容文件（本地）→ 运行 `pnpm content:manifest` → 不改代码即可被 `MDXContent` 渲染命中；  
  - 删除/改名同理。  

### 验收命令
- `pnpm content:manifest`（生成 `reports/content-manifest.json` + `mdx-importers.generated.ts`）  
- `pnpm build`（RSC import map 必须可编译）  
- `pnpm test`（相关内容/路由测试全绿）  

### 回滚点
- 回滚方式：保留旧 `mdx-loader.ts` 硬编码版本为单独 commit；失败时 `git revert` 回到该 commit。  
- 回滚触发条件：构建无法编译 generated import map、或生成脚本在 CI 中不稳定。  

### DONE（执行后填写）
- DONE: 2025-12-12
- 关联 PR/commit: 待提交
- 验收结果摘要:
  - `scripts/generate-content-manifest.ts` 扩展为输出 3 个文件：JSON manifest + MDX importers + TS manifest
  - 新增 `src/lib/mdx-importers.generated.ts`：静态 import map，覆盖 posts/pages/products
  - 新增 `src/lib/content-manifest.generated.ts`：静态 TypeScript 常量，消除运行时 fs 依赖
  - `src/lib/mdx-loader.ts` 改为消费 generated import map
  - `src/lib/content-manifest.ts` 改为静态 import，支持 Edge Runtime
  - 新增内容文件只需运行 `pnpm content:manifest` 即可生效，无需改代码
- 回滚点/flag: `git revert` 可回滚 `scripts/generate-content-manifest.ts`, `src/lib/mdx-loader.ts`, `src/lib/content-manifest.ts`

---

## 偏差任务 3：CSP Report‑Only 语义未输出（P1）

### 目标状态
- 当 `SECURITY_MODES.*.cspReportOnly=true` 时，下发 `Content-Security-Policy-Report-Only`；  
  否则下发强制 `Content-Security-Policy`。  
- `report-uri`/上报端点链路真实可用，且不破坏现有 nonce 策略。

### OpenSpec 门槛
- CSP/安全头输出语义变更属于安全模式体系化重构，必须走已批准 proposal。  
- 读取并对齐现有 change：  
  - `openspec/changes/p1-csp-rate-limit/`  
  - `openspec/changes/p2-style-src-nonce/`（如涉及 inlineCss/style-src 协同）  
- 未批准则先走审核。

### 影响范围
- `src/config/security.ts`  
- `proxy.ts`（如 header 注入逻辑需同步）  
- `src/app/api/csp-report/route.ts`（上报端点可用性/日志）

### Checklist（按序完成）
- [ ] 3.1 ACE/Serena 确认当前 header 输出路径与模式判定点。  
- [ ] 3.2 在 `getSecurityHeaders()` 中实现 Report‑Only 分支：  
  - `cspReportOnly=true` → 仅输出 `Content-Security-Policy-Report-Only`；  
  - `cspReportOnly=false` → 输出 `Content-Security-Policy`；  
  - 其他安全头保持不变。  
- [ ] 3.3 复核 `report-uri` 与端点一致：  
  - 默认 `/api/csp-report`；  
  - 若 env 覆盖，需与 proposal 对齐。  
- [ ] 3.4 增补测试：  
  - strict/relaxed 两模式下 header 断言；  
  - 报告端点 health/基本 schema 校验。  
- [ ] 3.5 预览/生产抽样回归（无 CSP 误拦资源）。  

### 验收命令
- `pnpm test`（含 CSP header tests）  
- `pnpm build`  
- 预览环境访问关键页，确认无 `Content Security Policy` 控制台误报（记录截图/日志摘要）。  

### 回滚点
- 回滚方式：单独 commit 引入 Report‑Only 分支；异常时 revert 该 commit。  
- 回滚触发条件：出现大面积资源加载被误拦、或 Report‑Only 与强制 CSP 同时输出导致浏览器行为异常。  

### DONE（执行后填写）
- DONE: 2025-12-12
- 关联 PR/commit: 待提交
- 验收结果摘要:
  - `src/config/security.ts` 的 `getSecurityHeaders()` 实现 Report-Only 分支
  - `cspReportOnly=true` 时输出 `Content-Security-Policy-Report-Only`
  - `cspReportOnly=false` 时输出 `Content-Security-Policy`
  - `report-uri` 默认指向 `/api/csp-report`
  - 新增 `src/config/__tests__/security.test.ts` 覆盖 strict/relaxed 两模式
- 回滚点/flag: `git revert` 可回滚 `src/config/security.ts`

---

## 偏差任务 4：build analyzer 开关仍脱节（P1）

### 目标状态
- `pnpm build:analyze` 默认产出 analyzer 报告（含 Turbopack stats + analyzer 视图）。  
- Webpack 深分析脚本按需可用但不默认触发。

### OpenSpec 门槛
- 仅为开发工具链/脚本对齐，属于配置修复，不需要 OpenSpec proposal。  

### 影响范围
- `package.json` scripts  
- `next.config.ts` analyzer 开关说明（如需）  
- `docs/技术栈.md` 或相关性能说明（如项目要求）

### Checklist（按序完成）
- [ ] 4.1 ACE/Serena 复核当前 analyzer 生效条件与脚本传参。  
- [ ] 4.2 修正脚本：  
  - `build:analyze` 统一设置 `ANALYZE=true TURBOPACK_STATS=1 next build`；  
  - 如 proposal/文档要求，新增 `build:analyze:webpack` 用于深分析（显式关闭 Turbopack）。  
- [ ] 4.3 文档化：在性能模块中说明两种 analyze 产物用途。  
- [ ] 4.4 复验：见下方“验收命令”。  

### 验收命令
- `pnpm build:analyze`（生成 `.next/analyze/**` 或等价报告）  
- `pnpm analyze:*`（statoscope/size 脚本可读到产物）  

### 回滚点
- 回滚方式：revert 对 scripts/next.config 的改动。  
- 回滚触发条件：分析构建阻塞正常 build，或 CI 因环境变量误触发 analyzer。  

### DONE（执行后填写）
- DONE: 2025-12-12
- 关联 PR/commit: 待提交
- 验收结果摘要:
  - `package.json` 修正 `build:analyze` 为 `ANALYZE=true TURBOPACK_STATS=1 next build`
  - 新增 `build:analyze:webpack` 为 `ANALYZE=true next build --webpack` 用于 Webpack 深分析
  - 两种分析脚本均可正常产出报告
- 回滚点/flag: `git revert` 可回滚 `package.json` scripts 部分

---

## 偏差任务 5：sanitizeInput 单源化未完成（P1）

### 目标状态
- 输入清理 API 语义化且单源：  
  - `sanitizePlainText`  
  - `sanitizeUrl`  
  - `sanitizeFilePath`  
  - 旧 `sanitizeInput` 仅兼容 re-export，不再被业务直接调用。  
- Zod schema 的 `.transform()` 统一调用新 API，避免不同服务口径分裂。

### OpenSpec 门槛（按影响选择）
- 若仅做“重导出 + 调整调用点”，且清理算法/输出语义不变：可直接实施（视为 refactor）。  
- 若要调整清理规则/新增上下文语义（属于安全模式变更）：需先创建并批准 OpenSpec proposal（建议 change-id：`refactor-sanitize-apis`）。

### 影响范围
- `src/lib/security-validation.ts`  
- `src/lib/validations.ts`  
- `src/lib/lead-pipeline/utils.ts`  
- 业务调用点：`src/lib/resend-utils.ts`、`src/lib/airtable/service.ts`、Lead Pipeline schema 等  

### Checklist（按序完成）
- [ ] 5.1 ACE/Serena 列出所有 `sanitizeInput` 定义与引用点（含 tests）。  
- [ ] 5.2 确定新 API 的单源位置（推荐 `src/lib/security-validation.ts`），并实现语义化函数；旧函数 re-export 到同一实现。  
- [ ] 5.3 逐域迁移调用点：  
  - 纯文本字段 → `sanitizePlainText`  
  - URL 字段 → `sanitizeUrl`  
  - 文件/路径字段 → `sanitizeFilePath`  
  - 迁移顺序按 Lead Pipeline → Resend → Airtable。  
- [ ] 5.4 在 schema 层收敛：  
  - Zod `.transform()` 统一调用新 API；  
  - 禁止业务层再手动 sanitize。  
- [ ] 5.5 删除重复实现（保留兼容 re-export），并更新对应 tests。  

### 验收命令
- `pnpm type-check`  
- `pnpm test`（sanitize/lead-pipeline/resend/airtable 相关测试）  
- `pnpm lint:check`（确保无新增直调旧入口）  

### 回滚点
- 回滚方式：保留“迁移前 API 结构”的基线 commit；异常时 revert 到该 commit。  
- 回滚触发条件：任一外部服务（Resend/Airtable）出现字段被过度清理导致业务失败，或 tests 覆盖不到的边界变化。  

### DONE（执行后填写）
- DONE: 2025-12-12
- 关联 PR/commit: 待提交
- 验收结果摘要:
  - `src/lib/security-validation.ts` 作为单源，提供 `sanitizePlainText`、`sanitizeUrl`、`sanitizeFilePath`
  - `src/lib/validations.ts` 的 `sanitizeInput` 改为 re-export `sanitizePlainText`
  - `src/lib/lead-pipeline/utils.ts` 的 `sanitizeLeadInput` 改为调用 `sanitizePlainText`
  - `src/lib/airtable/service.ts` 迁移为使用 `sanitizePlainText`
  - `src/lib/resend-utils.ts` 迁移为使用 `sanitizePlainText`
  - 所有业务调用点统一使用语义化 API
- 回滚点/flag: `git revert` 可回滚上述文件的 sanitize 相关改动

