# P2-1 Phase 3：total-byte-weight 再抠 35–48KB 规划草案

> 用途：在已完成 Phase 2 字体 & favicon 减重的基础上，继续优化关键页面 `/`、`/en`、`/zh` 的 Lighthouse `total-byte-weight`，将当前约 515–528KB 再压缩 35–48KB，使实际值稳定落在 ≈480KB 一侧。
>
> 工作流：兼容「codex 规划 → Claude Code 实现 → codex 审查」，本文件作为该阶段的唯一规划来源（SSOT）。

---

## 1. 任务总览（Overview）

- **任务编号 & 标题**：
  - P2-1 Phase 3：total-byte-weight 再抠 35–48KB（字体子集化 / JS bundle / 图片策略）
- **业务背景（为什么要做）**：
  - Phase 1 已收紧 Performance / LCP / TBT 阈值并通过 CI 验证；
  - Phase 2 通过移除 Geist Mono 全局加载和压缩 favicon，已减重约 83KB，但 `total-byte-weight` 仍约 515–528KB，高于 Phase 2 规划目标 480KB；
  - 为持续保持 B2B 官网在弱网/移动端下的加载体验，并给后续功能开发预留体积空间，需要继续在不牺牲品牌视觉的一前提下，再抠出 35–48KB 空间。
- **技术背景（在什么环境里做）**：
  - Next.js 16 App Router + React 19 + TypeScript 严格模式；
  - 已有 Lighthouse CI（`lighthouserc.js` + `pnpm perf:lighthouse`），Phase 1 阈值收紧已落地；
  - Phase 2 已完成：
    - `src/app/[locale]/layout-fonts.ts` 仅保留 Geist Sans 变量，Geist Mono 不再全局加载；
    - `src/app/[locale]/head.tsx` 仅预加载 Geist Sans；
    - `src/app/globals.css` 使用系统等宽字体栈；
    - `src/app/favicon.ico` 压缩至约 1.3KB；
    - `docs/p2-1-lighthouse-thresholds-and-perf-plan.md` 中已记录 Phase 2 优化与实测结果。
- **最终目标（可量化）**：
  - 关键 URL（`/`、`/en`、`/zh`）在移动端 Lighthouse 报告中的 `total-byte-weight`：
    - 实测稳定 **≤ 480000 bytes**（允许少量抖动，但不应长期超过 490000）；
  - 保持或略优于当前性能质量：
    - `categories:performance` ≥ 0.85，LCP / TBT / CLS 不劣化；
  - 所有质量门禁继续全绿：
    - `pnpm type-check`、`pnpm lint:check`、`pnpm test`、`pnpm perf:lighthouse`、安全/架构/翻译检查全部通过。

---

## 2. 当前状态（Current State）

- **代码结构 & 相关文件**：
  - 性能与阈值相关：
    - `lighthouserc.js`（Lighthouse CI 配置，Phase 1 阈值已生效，`total-byte-weight` 仍为 512000 warn）；
    - `.github/workflows/ci.yml` 中 `performance` job；
    - `docs/p2-1-lighthouse-thresholds-and-perf-plan.md`（Phase 0/1/2 规划与 Changelog）；
  - 字体与静态资源：
    - `src/app/[locale]/layout-fonts.ts`（仅 Geist Sans，全局字体变量定义）；
    - `src/app/[locale]/head.tsx`（Geist Sans preload、本地中文子集 @font-face）；
    - `src/app/globals.css`（字体栈、等宽字体回退、中文字体策略）；
    - `public/fonts/subsets/*`（中文子集字体文件）；
    - `src/app/favicon.ico`（已压缩为约 1.3KB）；
  - JS bundle、图片与页面：
    - `src/app/[locale]/(marketing)/**/page.tsx`（关键营销页入口）；
    - `src/components/**`（Hero / 产品卡片 / 图片组件等）。
- **现有指标 / 行为（来自 Phase 2 文档）**：
  - 优化前：`/en` ~600KB，`/zh` ~610KB；
  - Phase 2 后：
    - `/en`：~515–519KB；
    - `/zh`：~527–528KB；
  - 与目标 480KB 对比：差距约 35–48KB。
- **已有约束与规则**：
  - TypeScript 严格模式，无 `any`、限制复杂度与函数长度（见 `.augment/rules/core-coding-standards.md`）；
  - 字体与 i18n：
    - 中文依赖本地子集与系统 CJK 栈，不允许重新引入 Google Fonts；
    - 所有用户可见文案必须走 i18n（`next-intl`）；
  - 性能门禁：Lighthouse CI `error` 级断言为硬门禁，不得降级为 warn；
  - 不允许影响安全（`eslint-plugin-security` 规则）与无障碍（a11y）质量。

---

## 3. 目标状态 & 非目标（Target & Non-goals）

- **目标状态（要达到什么）**：
  - 指标层面：
    - `/`、`/en`、`/zh` 的 Lighthouse `total-byte-weight` 实测控制在 ~460–480KB 区间；
    - 现有 Performance / LCP / TBT / CLS 分数不出现肉眼可见退化；
  - 代码层面：
    - 至少完成一项高杠杆减重动作（推荐：Geist Sans 字体子集化，或焦点 JS bundle 精准拆分）；
    - 有清晰的实现与回滚路径，并在文档中记录 Phase 3 实际收益。
- **非目标（本阶段刻意不做什么）**：
  - 不重写整套 UI 设计系统，不更换品牌主字体（仍以 Geist Sans 为主）；
  - 不大幅改动路由结构或数据获取架构（不引入新后端服务）；
  - 不一次性把 Lighthouse 阈值拉到 Phase 3 最终规划（例如 Performance 0.95、`total-byte-weight` 450KB error 级）。

---

## 4. 阶段划分 / 路线图（Phases / Roadmap）

> 本文聚焦 P2-1 的 Phase 3，可在内部再拆为 3A / 3B 两个子阶段，避免一次做太多高风险动作。

- **Phase 3A：高杠杆单点减重**
  - 目标：通过 1–2 个单点优化取得 ≥30KB 的稳定减重收益；
  - 主要动作（择一或组合）：
    - 选项 A：在 License 允许前提下，对 Geist Sans 做本地子集化（用于关键页面首屏），替换或并行于当前 Geist 包；
    - 选项 B：对最大的 1–2 个 JS chunk 做代码拆分或按需加载（动态导入、减少客户端逻辑）；
  - 完成标志：
    - Lighthouse 实测 total-byte-weight 较 Phase 2 再下降 ≥30KB 且无明显 UI 回退。
- **Phase 3B：细化与扫尾优化（可选）**
  - 目标：在不引入新风险的前提下，再抠出 5–15KB；
  - 主要动作：
    - 非首屏图片的懒加载与 WebP 资源补充；
    - 清理零散的小 JS 或 CSS 资源（unused assets）；
  - 完成标志：
    - 关键 URL 全部稳定接近或低于 480KB。

---

## 5. 任务拆解（Task Breakdown）

### Task A：Phase 2 后的精细体积分析

- **任务目标**：搞清楚 Phase 2 之后还剩下哪些主要体积来源，为选择 Phase 3 手段提供数据依据。
- **输入 / 前置条件**：
  - 最新一次 `pnpm perf:lighthouse` 报告（包含 `/`、`/en`、`/zh`）；
  - Lighthouse 报告中的资源明细（JS / 字体 / 图片 / 其他）；
  - 现有 Phase 2 文档中的 total-byte-weight 构成分析。
- **主要步骤**：
  - 重跑一次 `pnpm perf:lighthouse`，记录三条 URL 的 total-byte-weight 与各资源占比；
  - 结合 LH 报告和构建产物，列出 Top N（建议 5 个）最大资源项；
  - 判断每个大资源的性质（字体 / JS / 图片 / 其他），初步评估可优化空间；
  - 在本文件或 `docs/p2-1-*.md` 中追加一小节“Phase 2 后体积构成分析”。
- **预期输出**：
  - 一份文字化的资源构成清单，标出候选优化对象；
- **验收标准**：
  - 能够明确回答“若要再抠 35–48KB，理论上最合适的 2–3 个资源点分别是哪些”。

### Task B：选择并实现首个高杠杆优化（3A）

- **任务目标**：基于 Task A 分析，选择一个性价比最高的点（优先字体/JS），实现首个 ≥30KB 的稳定减重。
- **输入 / 前置条件**：
  - Task A 的体积构成分析结论；
  - 字体 License 情况（是否允许本地子集化 Geist Sans）；
- **主要步骤（示例，实际根据选择的方案调整）**：
  - 若选择 **Option A：Geist Sans 子集化**：
    - 确认 License 允许本地子集；
    - 在 `public/fonts/` 中新增子集 woff2 文件（例如只保留常用 ASCII + 拉丁 + 部分符号）；
    - 引入 `next/font/local` 或等价方式，在 `layout-fonts.ts` 新增局部子集字体配置（仅应用于关键页面首屏）；
    - 更新 `head.tsx` 中的 preload 链接指向子集文件；
  - 若选择 **Option B：JS bundle 精简**：
    - 找出体积最大的 1–2 个前端模块，对其中的可延后逻辑使用 `next/dynamic` 或拆分到非首屏组件；
    - 确保不破坏 RSC/Client 边界与现有交互体验；
  - 完成改动后，运行 `pnpm type-check` / `pnpm lint:check` / `pnpm test` / `pnpm perf:lighthouse`，记录数值变化。
- **预期输出**：
  - 修改后的字体 / JS 配置与代码；
  - 更新的 Lighthouse 报告截图或数字摘要；
- **验收标准**：
  - 在至少 2 次 Lighthouse 运行中，关键 URL total-byte-weight 较 Phase 2 至少下降 30KB，且 UI/交互无明显退化。

### Task C：扫尾优化与阈值/文档更新（3B）

- **任务目标**：在确认总指标接近 480KB 后，做小幅扫尾优化，并根据实际情况调整文档与（可选）`total-byte-weight` 阈值。
- **输入 / 前置条件**：
  - Task B 完成后的 Lighthouse 实测数据；
- **主要步骤**：
  - 视剩余差距选择 1–2 个小点（图片懒加载、WebP 资源、小 JS 清理）做细节优化；
  - 再跑 2 次 `pnpm perf:lighthouse`，确认 total-byte-weight 稳定在目标区间；
  - 在 `docs/p2-1-lighthouse-thresholds-and-perf-plan.md` 中追加“Phase 3：体积优化结果”小节；
  - 若实际已稳定 ≤480KB，可考虑把 `lighthouserc.js` 中 `total-byte-weight` 阈值从 512000 收紧到 **480000 warn**（仍保持 warn 级，暂不升为 error）。
- **预期输出**：
  - 一小节 Phase 3 Changelog（含具体数字）；
  - 可选的 `lighthouserc.js` 阈值更新。
- **验收标准**：
  - 文档中清楚记录 Phase 3 优化项与体积结果；
  - 若阈值已收紧，CI `performance` job 在 main 上连续多次通过。

---

## 6. 技术实施细节（Implementation Details）

- **文件级改动清单（候选）**：
  - 字体相关：
    - `src/app/[locale]/layout-fonts.ts`：新增/调整本地子集字体配置（如采用 Option A）；
    - `src/app/[locale]/head.tsx`：更新字体 preload 链接与中文子集策略；
    - `public/fonts/**`：新增轻量子集字体文件；
  - JS / 页面相关：
    - `src/app/[locale]/(marketing)/**/page.tsx`：对重组件进行拆分或延迟加载；
    - `src/components/**`：按需调整重型组件的加载策略；
  - 配置与文档：
    - `lighthouserc.js`：必要时收紧 `total-byte-weight` 阈值；
    - `docs/p2-1-lighthouse-thresholds-and-perf-plan.md`：追加 Phase 3 结果。
- **接口 / 类型 / 数据结构要求**：
  - 不新增任何 `any` 类型，遵守现有 TypeScript 严格规则；
  - 字体与组件的导出保持 named export，避免 default export 破坏现有模式；
  - 不引入新的全局可变单例。
- **架构 & 风格约束**：
  - 保持 RSC / Client Component 边界清晰，只在确需交互的组件上使用 `"use client"`；
  - 图片仍优先使用 `next/image`，谨慎使用裸 `<img>`；
  - 遵守 `.augment/rules/*` 中的性能、安全、可访问性规范。

---

## 7. 质量与验证策略（Quality & Verification）

- **需要运行的命令**：
  - `pnpm type-check`
  - `pnpm lint:check`
  - `pnpm test`
  - `pnpm perf:lighthouse`
- **验收指标**：
  - `/`、`/en`、`/zh` 的 Lighthouse `total-byte-weight`：稳定 ≤480000 bytes；
  - Performance / LCP / TBT / CLS 不出现明显退化（相较 Phase 2 报告）；
  - CI 中 build-check / arch-check / security-check / translation-check 仍全绿。
- **测试要求**：
  - 若动到字体配置，应补充/更新 `src/app/[locale]/__tests__/layout-fonts.test.ts` 中的断言；
  - 若动到关键页面组件，应为新增懒加载/动态导入逻辑补充单测或集成测。

---

## 8. 风险、回滚与注意事项（Risks & Rollback）

- **风险清单**：
  - 字体子集化可能导致部分罕见字符无法正确显示；
  - JS bundle 拆分可能引入闪屏或交互延迟；
  - 图片懒加载配置不当可能影响 LCP 或 SEO（尤其是首屏主图）。
- **回滚策略**：
  - 字体相关改动集中在 `layout-fonts.ts`、`head.tsx` 与 `public/fonts/**`，可通过 `git revert` 快速回退；
  - JS 改动保持在少数明确组件/页面中，必要时可整体回滚对应 commit；
  - 不修改 Lighthouse 各类 `error` 级阈值，避免为“回滚”去放宽门禁。
- **注意事项**：
  - 禁止绕过 Lefthook / CI（不要使用 `--no-verify`）；
  - 不得私自将 `total-byte-weight` 从 warn 提升为 error 级，需在后续单独规划。

---

## 9. 协作与交接说明（For Developers & AI）

### 9.1 给人类开发者的说明

- 建议执行顺序：先完成 Task A 分析 → 再挑选并实施 Task B（字体或 JS）→ 最后执行 Task C 扫尾与文档更新；
- 进度与变更建议记录在：
  - 本文件尾部（可追加简单 Changelog）；
  - `docs/p2-1-lighthouse-thresholds-and-perf-plan.md` 的 Phase 3 小节；
- 字体 License、架构边界等高风险改动，建议由你或资深工程师最终 review。

### 9.2 给 AI Agent / Claude Code 的执行指引

- 在开始实现前，必须先阅读：
  - 本规划文档；
  - `docs/p2-1-lighthouse-thresholds-and-perf-plan.md`；
  - `.augment/rules/core-coding-standards.md` 及与性能/字体相关的规则文件；
- 允许改动的文件范围（建议）：
  - `src/app/[locale]/layout-fonts.ts`、`src/app/[locale]/head.tsx`；
  - `public/fonts/**`；
  - 与选定优化点直接相关的页面/组件文件；
  - `docs/p2-1-lighthouse-thresholds-and-perf-plan.md`；
  - 必要时的 `lighthouserc.js`；
- 必须执行的命令：
  - `pnpm type-check && pnpm lint:check && pnpm test && pnpm perf:lighthouse`；
- 交付物检查清单：
  - 代码改动（含字体/JS/图片策略）；
  - 新增或更新的测试；
  - 更新后的 Lighthouse 数值（写入文档）；
  - 如阈值调整，确保 CI `performance` job 稳定通过。

