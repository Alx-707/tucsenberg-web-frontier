# 包大小监控防回归机制

## 概述

本文档描述了项目的包大小监控机制，旨在防止类似Sentry
10.0.0升级导致的包大小回归问题（从210KB增加到558KB，+165%）。

## 包大小预算配置

### 当前预算限制 (.size-limit.js)

| Bundle类型         | 当前限制   | 说明           |
| ------------------ | ---------- | -------------- |
| Main App Bundle    | 50 KB      | 主应用包       |
| Framework Bundle   | 130 KB     | 框架包         |
| Main Bundle        | 40 KB      | 主包           |
| Locale Page Bundle | 15 KB      | 本地化页面包   |
| Total CSS Bundle   | 50 KB      | CSS总包        |
| **Shared Chunks**  | **220 KB** | **关键监控项** |
| Polyfills Bundle   | 50 KB      | Polyfills包    |
| Webpack Runtime    | 10 KB      | Webpack运行时  |

### 关键监控项：Shared Chunks

- **当前大小**: 210.41KB
- **预算限制**: 220KB（210KB + 10KB缓冲）
- **历史最高**: 558KB（Sentry 10.0.0回归时）
- **优化目标**: 保持在220KB以下

## 自动化监控机制

### 1. Pre-commit检查

```yaml
# lefthook.yml
bundle-size-check:
  run: pnpm size:check
  fail_text: '包大小检查失败 - 包大小超出预算限制，请检查依赖变更'
```

**触发时机**: 每次代码提交前 **检查内容**: 所有bundle的大小是否符合预算

### 2. Pre-push检查

```yaml
# lefthook.yml
performance-test:
  run: pnpm perf:check
  fail_text: '性能测试失败 - 包大小或性能指标超出限制'
```

**触发时机**: 每次代码推送前 **检查内容**: 包大小 + 性能分析

### 3. 完整质量检查

```bash
pnpm quality:full
```

**包含检查**: 类型检查、代码质量、格式、架构、安全、重复度、测试、构建、**包大小**

## 依赖版本锁定策略

### Sentry版本锁定

```json
{
  "@sentry/nextjs": "~9.44.2",
  "@sentry/cli": "~2.50.2"
}
```

**锁定策略**: 使用`~`符号只允许patch版本更新，防止major版本意外升级 **原因**:
Sentry 10.0.0升级导致包大小增加165%

### 版本升级流程

1. **评估阶段**: 在独立分支测试新版本
2. **包大小分析**: 运行`pnpm analyze`检查影响
3. **性能测试**: 验证加载时间是否符合要求
4. **预算检查**: 确保不超出220KB限制
5. **批准升级**: 只有在所有检查通过后才合并

## 监控命令

### 日常检查命令

```bash
# 快速包大小检查
pnpm size:check

# 详细包分析
pnpm analyze

# 性能检查（包含包大小）
pnpm perf:check

# 完整质量检查
pnpm quality:full
```

### 分析命令

```bash
# 生成bundle分析报告
pnpm build:analyze

# 查看详细分析
open .next/analyze/client.html
```

## 回归处理流程

### 发现包大小回归时的处理步骤

1. **立即停止**: 停止相关的部署或合并
2. **问题定位**:
   ```bash
   pnpm analyze
   git diff HEAD~1 package.json  # 检查依赖变更
   ```
3. **影响评估**: 确定回归的具体原因和影响范围
4. **解决方案**:
   - **回退**: 回退到之前的稳定版本
   - **优化**: 通过配置优化减少包大小
   - **替代**: 寻找更轻量的替代方案
5. **验证修复**: 确保包大小恢复到预算范围内
6. **文档更新**: 记录问题和解决方案

## 最佳实践

### 依赖管理

1. **谨慎升级**: 特别是主要依赖的major版本
2. **测试优先**: 在独立环境测试包大小影响
3. **版本锁定**: 对关键依赖使用精确版本控制
4. **定期审查**: 定期检查和清理不必要的依赖

### 开发实践

1. **提交前检查**: 确保pre-commit hook正常运行
2. **推送前验证**: 运行完整的性能检查
3. **监控意识**: 关注bundle分析报告的变化
4. **文档维护**: 及时更新监控配置和流程

## 联系信息

如有包大小相关问题，请联系：

- 前端架构团队
- DevOps团队

## 更新历史

- 2025-01-05: 创建文档，建立Sentry回归防护机制
- 预算更新: Shared Chunks限制从265KB降至220KB
