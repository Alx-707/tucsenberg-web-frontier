---
type: "auto"
description: "Quality and complexity: cyclomatic complexity, function length, nesting depth, parameter count, duplication, refactor-first strategy"
---

# Quality and Complexity

- Budgets: function length ≤ 120 lines; cyclomatic complexity ≤ 15; nesting depth ≤ 4; parameters ≤ 5.
- Refactor-first: if a fix would exceed budgets, refactor to reduce complexity before adding logic.
- Patterns: prefer early returns; extract strategy/lookup-table over deep branching; deduplicate shared logic.
- Validation: include complexity checks in CI (lint rules or static analysis as available).
- Large changes: implement incrementally; validate type-check, lint, and tests at each step.
- Duplication: target < 3% (use `pnpm duplication:check` and `pnpm duplication:report` to monitor and enforce).

## 魔法数字管理规范

### 业务常量分类策略

**性能阈值常量**：
```typescript
// src/constants/performance.ts
export const PERFORMANCE_THRESHOLDS = {
  // Web Vitals 阈值
  CLS_GOOD: 0.1,
  CLS_NEEDS_IMPROVEMENT: 0.25,
  LCP_GOOD: 2500,
  LCP_NEEDS_IMPROVEMENT: 4000,
  FID_GOOD: 100,
  FID_NEEDS_IMPROVEMENT: 300,

  // 评分阈值
  SCORE_EXCELLENT: 80,
  SCORE_GOOD: 50,
  SCORE_POOR: 30,
} as const;
```

**超时配置常量**：
```typescript
// src/constants/timeouts.ts
export const TIMEOUT_VALUES = {
  // API请求超时
  API_REQUEST: 5000,
  API_REQUEST_SLOW: 10000,

  // 用户交互超时
  USER_INTERACTION: 300,
  FORM_SUBMISSION: 8000,

  // 动画和UI反馈
  ANIMATION_DURATION: 150,
  NOTIFICATION_DISPLAY: 3000,

  // 诊断和监控
  DIAGNOSTIC_DELAY: 2000,
  SIMULATION_DELAY: 2000,
  AUTO_RUN_DELAY: 1000,
} as const;
```

**UI尺寸常量**：
```typescript
// src/constants/ui-dimensions.ts
export const UI_DIMENSIONS = {
  // 响应式断点
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280,

  // 内容尺寸
  MAX_CONTENT_WIDTH: 1200,
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,

  // 组件尺寸
  BUTTON_HEIGHT: 40,
  INPUT_HEIGHT: 36,
  CARD_PADDING: 16,
} as const;
```

### ESLint no-magic-numbers 推荐配置

```javascript
// eslint.config.mjs - 魔法数字规则配置
{
  rules: {
    'no-magic-numbers': ['error', {
      // 允许的常见数字
      ignore: [
        0, 1, -1,           // 基础数字
        100, 200, 201,      // HTTP状态码
        400, 401, 403, 404,
        500, 502, 503,
        24, 60, 1000,       // 时间相关 (小时、分钟、毫秒)
      ],
      ignoreArrayIndexes: true,     // 允许数组索引
      ignoreDefaultValues: true,    // 允许默认值
      enforceConst: true,          // 强制使用const声明
      detectObjects: false,        // 不检测对象属性
    }],
  }
}
```

### 代码示例

**❌ 错误做法 - 硬编码魔法数字**：
```typescript
// 不好的做法
function checkPerformance(score: number) {
  if (score >= 80) return 'excellent';  // 魔法数字
  if (score >= 50) return 'good';       // 魔法数字
  return 'poor';
}

// 超时硬编码
const response = await fetch(url, {
  timeout: 5000  // 魔法数字
});
```

**✅ 正确做法 - 使用业务常量**：
```typescript
// 好的做法
import { PERFORMANCE_THRESHOLDS, TIMEOUT_VALUES } from '@/constants';

function checkPerformance(score: number) {
  if (score >= PERFORMANCE_THRESHOLDS.SCORE_EXCELLENT) return 'excellent';
  if (score >= PERFORMANCE_THRESHOLDS.SCORE_GOOD) return 'good';
  return 'poor';
}

// 使用命名常量
const response = await fetch(url, {
  timeout: TIMEOUT_VALUES.API_REQUEST
});
```

### 常量组织原则

1. **按业务领域分组**: 性能、UI、网络、时间等
2. **使用const assertions**: 确保类型推断准确
3. **集中管理**: 避免在多个文件中重复定义
4. **语义化命名**: 常量名称应该清楚表达用途
5. **文档化**: 为复杂常量添加注释说明

### 预防措施

- **CI检查**: 在pre-commit hooks中运行`no-magic-numbers`检查
- **代码审查**: 重点关注新增的数字字面量
- **重构策略**: 发现魔法数字时立即提取为常量
- **团队培训**: 确保团队了解常量定义的重要性


