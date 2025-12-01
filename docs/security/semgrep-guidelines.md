# Semgrep 安全扫描指南

> 目标：统一团队在本地与 CI 中使用 Semgrep 的方式，做到 **ERROR 一律阻断、WARNING 只做软提示 + 只阻止新增问题（baseline）**。

---

## 1. 在项目里的角色

本项目把 Semgrep 当作一条 **安全“电网”**：

- **本地开发阶段**：
  - 开发者可以随时运行 `pnpm security:semgrep` 做全仓快速体检；
  - 结果只用于自查，不会改变 git 状态。
- **CI 阶段（GitHub Actions / `code-quality.yml`）**：
  - `security-audit` job 中会运行 Semgrep：
    - **ERROR 级规则**：一旦在 PR diff 中出现新的 finding，CI 直接失败；
    - **WARNING 级规则**：只输出告警信息，不会让 CI 失败（软 fail）；
    - PR 场景下使用 **baseline**，只关注「相对基线分支新增的告警」。

---

## 2. CI 中的执行行为

CI 配置位于：`/.github/workflows/code-quality.yml` 的 `security-audit` job。

### 2.1 PR 场景（ERROR fail + WARNING soft-fail + baseline）

- 针对 `pull_request` 事件：
  - 先安装 Semgrep CLI：
    - `python3 -m pip install --user "semgrep<2"`
  - 使用基线提交：`git merge-base HEAD origin/$GITHUB_BASE_REF`。
  - 然后依次执行两次扫描：
    1. **ERROR 级规则（阻断）**：
       - 命令等价于：
         - `semgrep scan --config semgrep.yml --severity ERROR --error --baseline-commit <BASE> src/`
       - 行为：
         - 只运行 `semgrep.yml` 中标记为 `severity: ERROR` 的规则；
         - 只报告「相对 baseline 新增」的 findings；
         - 若存在 ERROR 级新增 finding，则步骤退出码为 1，CI **失败**。
    2. **WARNING 级规则（软提示）**：
       - 命令等价于：
         - `semgrep scan --config semgrep.yml --severity WARNING --baseline-commit <BASE> src/`
       - 行为：
         - 只运行 `severity: WARNING` 的规则；
         - 同样只关注「相对 baseline 新增」的告警；
         - 不加 `--error`，因此无论有无 WARNING，CI **不会因此失败**。

> 总结：PR 中，**只有新产生的 ERROR 级问题会阻断 CI**；WARNING 仅作为安全“黄灯”提示。

### 2.2 主干 / 非 PR 场景（完整扫描，ERROR fail）

- 对 `push` 等非 `pull_request` 事件：
  - 不使用 baseline，视为对当前分支的**完整体检**。
  - 同样拆为两次扫描：
    - ERROR 级：`--severity ERROR --error src/` → 有 ERROR 则 job 失败；
    - WARNING 级：`--severity WARNING src/` → 仅输出提示，不影响退出码。

这保证了：
- 主干上不会长期“挂着” ERROR 级安全风险；
- WARNING 级问题可以在 **不打断流水线** 的前提下持续暴露、监控和逐步清理。

---

## 3. 本地如何运行

### 3.1 推荐命令

- 单独跑依赖与 Semgrep：
  - `pnpm security:audit`   → 依赖安全审计（npm audit）
  - `pnpm security:semgrep` → 使用本地 `semgrep.yml` 对 `src/` 目录扫描
- 一次性安全检查（推荐 PR 前执行）：
  - `pnpm security:check`   → 依次执行 `security:audit` + `security:semgrep`

> 注意：本地脚本目前 **不启用 baseline 和 CI gating 逻辑**，更适合作为“主动体检”。真正的门禁逻辑在 GitHub Actions 中执行。

---

## 4. 当出现 Semgrep 报警时怎么处理？

可以按优先级分成三类决策：

1. **优先改代码（首选）**
   - 场景：真实业务路径的处理逻辑存在安全隐患，例如：
     - 对不可信对象做 `...obj` spread 或 `Object.assign`；
     - 动态属性访问 `obj[key]` 依赖用户输入；
     - 未校验的重定向 URL；
     - 可能暴露 `process.env.*` 内容等。
   - 操作：
     - 重构为**显式字段构造**、**白名单 helper** 或增加输入校验；
     - 确保对应的 Vitest 测试仍然通过或补上新测试。

2. **受控例外（需要注释 + 类型约束）**
   - 场景：
     - 对象来自强类型 config / locale map / 内部常量，不接收用户输入；
     - 仅在测试工具中使用（如 `theme-test-utilities`）。
   - 操作规范：
     1. 在代码侧紧邻位置添加 `// nosemgrep: <rule-id>` 注释；
     2. 上方或同行用中文简要说明「数据来源」「使用边界」和「为什么安全」；
     3. 如为长期受控例外，可在 `semgrep.yml` 中对应规则的 `paths.exclude` 里排除该文件路径。

3. **规则级微调（少数情况）**
   - 仅在确认**大量同一模式都是假阳性**时考虑：
     - 例如某类脚本目录、特定测试文件夹对安全模型影响可忽略。
   - 操作：
     - 优先通过 `paths.exclude` 精准排除对应路径；
     - 禁止在全局直接 `exclude-rule`，避免未来真实问题被静默忽略。

---

## 5. `nosemgrep` 使用约束

为了避免 `nosemgrep` 被滥用成“消音器”，团队内部约束如下：

1. **必须配安全模型注释**
   - 示例：
     - `// nosemgrep: object-injection-sink-spread-operator`
     - 下一行或同行说明：
       - 对象来源（例如：受控 config / enum-like key / 测试构造对象）；
       - 为什么不接收用户输入；
       - 若未来新增使用场景需要额外注意什么。

2. **优先在「类型 + config」场景使用**
   - 如：`contact-form-config.ts`、`whatsapp-api-config/utils.ts`、`locale-detection-hooks.ts` 等；
   - 始终确保有 TS 类型约束，不接受任意 `Record<string, any>`。

3. **禁止用来跳过真实安全问题**
   - 例如：对 request body 直接 spread、未验证的 redirect URL 等绝不能用 `nosemgrep` 兜底。

---

## 6. 什么时候需要更新 baseline？

当前 CI 中的 baseline 逻辑是：
- 在 PR 上，以 `origin/$GITHUB_BASE_REF` 与当前 HEAD 的 merge-base 作为 baseline 提交；
- 只对「相对于 baseline 新增」的 findings 做 ERROR fail / WARNING 报告。

一般情况下 **不需要手动更新 baseline**，只要：
- 主干分支始终保持无 ERROR 级告警；
- 新增规则或调整 `semgrep.yml` 后，确保主干跑一次 `security-audit` 全绿。

只有在以下情况，可以考虑“重置认知”：
- 大规模清理了一批历史 WARNING，想让之后的 CI 只关注真正新增的 WARNING；
- 调整规则导致大量旧代码重新被识别，需要在主干上先统一修复或审计。

此时建议流程：
1. 在功能分支上完成规则调整和必要的代码修复；
2. 确认 `code-quality` 工作流在该分支上全绿；
3. 合并回主干后，新的主干状态自然成为之后 PR 的 baseline。

---

## 7. 快速 Checklist（给提 PR 的同事）

- [ ] 本地至少跑过一次 `pnpm security:check`
- [ ] 如有 Semgrep 报警，优先评估能否**改代码**解决
- [ ] 如必须保留为例外：
  - [ ] 已加上带解释的 `nosemgrep: <rule-id>` 注释
  - [ ] 如为长期例外，是否需要更新 `semgrep.yml` 的 `paths.exclude`
- [ ] 确认 CI `code-quality` 工作流中的 `security-audit` job 通过

