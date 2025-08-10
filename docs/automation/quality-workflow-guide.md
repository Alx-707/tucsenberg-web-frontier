# 自动化质量保证工作流指南

## 概述

自动化质量保证工作流系统能够在任务完成后自动触发质量检查，确保每个任务都符合企业级质量标准。

## 系统架构

```
任务完成 → 状态监听器 → 质量触发器 → AI质量审查 → 结果处理器 → 确认/回滚
```

### 核心组件

1. **任务状态监听器** (`task-status-watcher.js`)

   - 监听 `docs/data/tasks.json` 文件变更
   - 检测任务状态从非'completed'变为'completed'
   - 自动触发质量检查流程

2. **质量检查触发器** (`quality-trigger.js`)

   - 读取任务的qualityAssurance配置
   - 调用AI质量审查脚本
   - 执行自动化检查工具

3. **质量结果处理器** (`quality-result-processor.js`)

   - 分析质量检查结果
   - 生成详细报告
   - 决定确认任务完成或回滚状态

4. **自动化工作流管理器** (`automated-quality-workflow.js`)
   - 统一管理整个工作流
   - 处理并发检查
   - 错误重试机制

## 快速开始

### 1. 启动自动化工作流

```bash
# 启动完整的自动化工作流
pnpm quality:workflow:start

# 或者单独启动任务监听器
pnpm quality:watch
```

### 2. 检查工作流状态

```bash
# 查看工作流运行状态
pnpm quality:workflow:status
```

### 3. 手动触发质量检查

```bash
# 为特定任务触发质量检查
pnpm quality:trigger <taskId>

# 示例
pnpm quality:trigger b51718cc-9669-4284-8520-1c082964f30b
```

### 4. 停止工作流

```bash
# 停止自动化工作流
pnpm quality:workflow:stop

# 重启工作流
pnpm quality:workflow:restart
```

## 配置说明

### 工作流配置文件

配置文件位于 `config/quality-workflow.json`，包含以下主要配置：

```json
{
  "monitoring": {
    "watchInterval": 2000, // 监听间隔（毫秒）
    "maxConcurrentChecks": 3, // 最大并发检查数
    "retryAttempts": 2, // 重试次数
    "timeout": 600000 // 超时时间（毫秒）
  },
  "qualityStandards": {
    "defaultThreshold": 90, // 默认质量阈值
    "enableAutoRollback": false, // 是否启用自动回滚
    "requireHumanConfirmation": true
  }
}
```

### 环境变量

```bash
# 启用自动回滚
export AUTO_ROLLBACK_ENABLED=true

# 启用通知
export ENABLE_NOTIFICATIONS=true

# 设置最大并发检查数
export MAX_CONCURRENT_CHECKS=5

# 设置重试次数
export RETRY_ATTEMPTS=3

# 通知webhook URL
export QUALITY_NOTIFICATION_WEBHOOK=https://hooks.slack.com/...
```

## 任务质量配置

每个任务都需要在 `docs/data/tasks.json` 中配置 `qualityAssurance` 字段：

```json
{
  "id": "task-id",
  "name": "任务名称",
  "status": "completed",
  "qualityAssurance": {
    "automatedChecks": {
      "tools": ["pnpm type-check:strict", "pnpm lint:strict", "pnpm build"],
      "threshold": "100%通过率",
      "estimatedTime": "60-90秒"
    },
    "aiTechnicalReview": {
      "threshold": "≥90分",
      "scoringCriteria": {
        "技术实现质量": "30分",
        "最佳实践遵循": "30分",
        "企业级标准": "25分",
        "项目整体影响": "15分"
      }
    }
  }
}
```

## 工作流程详解

### 1. 任务完成检测

当开发者将任务状态更新为 `completed` 时：

1. 任务状态监听器检测到文件变更
2. 比较任务状态变化
3. 识别新完成的任务
4. 触发质量检查流程

### 2. 质量检查执行

质量检查包含三个层次：

#### 第一层：自动化基础检查

- 执行任务配置中的检查工具
- TypeScript类型检查
- ESLint代码规范检查
- 构建验证
- 测试运行

#### 第二层：AI技术审查

- 基于自动化检查结果进行分析
- 四维度评分体系
- 生成改进建议
- 评估项目整体影响

#### 第三层：人工确认清单

- 生成简化的确认清单
- 关键功能验证
- 界面交互测试

### 3. 结果处理

根据质量检查结果：

- **通过（≥90分）**: 确认任务完成
- **未通过（<90分）**: 建议回滚到 `in_progress`
- **错误**: 记录错误，等待人工处理

## 报告和日志

### 质量报告

- **详细报告**: `reports/quality/detailed-report-{taskId}-{timestamp}.json`
- **汇总报告**: `reports/summary/summary-{taskId}-{timestamp}.json`

### 日志文件

- **工作流日志**: `logs/workflow.log`
- **监听器日志**: `logs/task-watcher.log`
- **触发器日志**: `logs/quality-trigger.log`
- **处理器日志**: `logs/quality-processor.log`

## 测试和验证

### 运行测试套件

```bash
# 运行完整的测试套件
pnpm quality:workflow:test

# 详细输出模式
pnpm quality:workflow:test --verbose

# 快速测试模式
pnpm quality:workflow:test --quick
```

### 测试内容

1. **脚本文件存在性检查**
2. **任务状态监听器测试**
3. **质量检查触发器测试**
4. **成功场景端到端测试**
5. **失败场景测试**
6. **配置文件验证**

## 故障排除

### 常见问题

#### 1. 监听器无法启动

```bash
# 检查任务文件是否存在
ls -la docs/data/tasks.json

# 检查权限
chmod +x scripts/task-status-watcher.js

# 查看详细错误
node scripts/task-status-watcher.js --test
```

#### 2. 质量检查失败

```bash
# 手动运行质量检查
pnpm quality:trigger <taskId> --dry-run

# 检查任务配置
node -e "console.log(JSON.stringify(require('./docs/data/tasks.json').tasks.find(t => t.id === '<taskId>').qualityAssurance, null, 2))"
```

#### 3. 工作流卡住

```bash
# 检查工作流状态
pnpm quality:workflow:status

# 强制停止
pkill -f "automated-quality-workflow"

# 重启工作流
pnpm quality:workflow:restart
```

### 调试模式

```bash
# 启用调试模式
export DEBUG=true
node scripts/automated-quality-workflow.js start

# 查看详细日志
tail -f logs/workflow.log
```

## 最佳实践

### 1. 任务配置

- 确保每个任务都有完整的 `qualityAssurance` 配置
- 设置合理的质量阈值（建议90分）
- 配置适当的检查工具

### 2. 监控和维护

- 定期检查日志文件
- 监控质量报告
- 及时处理失败的质量检查

### 3. 性能优化

- 控制并发检查数量
- 设置合理的超时时间
- 定期清理旧的报告文件

### 4. 安全考虑

- 限制脚本执行权限
- 验证任务配置的安全性
- 定期备份任务数据

## 扩展和定制

### 添加自定义检查工具

在任务的 `qualityAssurance.automatedChecks.tools` 中添加：

```json
{
  "tools": [
    "pnpm type-check:strict",
    "pnpm lint:strict",
    "pnpm custom:security-scan",
    "pnpm custom:performance-test"
  ]
}
```

### 集成外部服务

通过环境变量配置通知服务：

```bash
# Slack通知
export SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# 邮件通知
export SMTP_HOST=smtp.gmail.com
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-password
```

### 自定义评分标准

修改 `scripts/ai-quality-review.js` 中的评分逻辑：

```javascript
function calculateFourDimensionScores(automatedResults, taskConfig) {
  // 自定义评分逻辑
  return {
    technical: calculateTechnicalScore(automatedResults),
    bestPractices: calculateBestPracticesScore(automatedResults),
    enterprise: calculateEnterpriseScore(automatedResults),
    impact: calculateImpactScore(automatedResults, taskConfig),
  };
}
```

## 支持和反馈

如果遇到问题或有改进建议，请：

1. 查看日志文件获取详细错误信息
2. 运行测试套件验证系统状态
3. 检查配置文件是否正确
4. 参考故障排除指南

---

**注意**: 自动化质量保证工作流是一个强大的工具，但不能完全替代人工审查。建议在关键任务上仍然进行人工确认。
