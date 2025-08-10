# 性能监控使用指南

## 📊 概述

本项目实施了完整的性能监控和验证体系，包括：

- **实时性能监控** - 收集Web Vitals和详细性能指标
- **性能基准管理** - 建立和维护性能基准数据库
- **回归检测系统** - 自动检测性能回归
- **预警机制** - 实时性能预警和通知
- **CI/CD集成** - 持续性能监控

## 🚀 快速开始

### 1. 基本性能分析

```bash
# 运行基本性能分析
node scripts/performance-analyzer.js

# 查看帮助信息
node scripts/performance-analyzer.js --help
```

### 2. 建立性能基准

```bash
# 保存当前性能数据作为基准
node scripts/performance-analyzer.js --save-baseline

# 使用自定义基准文件名
node scripts/performance-analyzer.js --save-baseline --baseline-file my-baseline.json
```

### 3. 性能回归检测

```bash
# 与基准对比并检测回归
node scripts/performance-analyzer.js --compare-baseline

# CI模式下的回归检测
node scripts/performance-analyzer.js --compare-baseline --ci
```

## 📈 性能监控系统

### Enhanced Web Vitals 收集器

项目使用增强的Web Vitals收集器，提供详细的性能分析：

```typescript
import { 
  performanceMonitoringManager,
  performanceAlertSystem 
} from '@/lib/enhanced-web-vitals';

// 初始化性能监控
performanceMonitoringManager.initialize({
  alertConfig: {
    enabled: true,
    thresholds: {
      cls: { warning: 0.1, critical: 0.25 },
      lcp: { warning: 2500, critical: 4000 },
      fid: { warning: 100, critical: 300 },
    },
    notifications: {
      console: true,
      webhook: 'https://your-webhook-url.com',
    },
  },
  autoBaseline: true,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24小时
});

// 执行完整监控
const result = await performanceMonitoringManager.performFullMonitoring({
  version: '1.0.0',
  commit: 'abc123',
  branch: 'main',
});

console.log(result.report);
```

### 核心功能

#### 1. 性能指标收集

- **核心Web Vitals**: CLS, FID, LCP, FCP, TTFB, INP
- **额外指标**: DOM加载时间, 资源加载性能
- **环境信息**: 设备信息, 网络状况, 浏览器信息

#### 2. 性能基准管理

```typescript
import { performanceBaselineManager } from '@/lib/enhanced-web-vitals';

// 保存基准
performanceBaselineManager.saveBaseline(metrics, {
  version: '1.0.0',
  commit: 'abc123',
  branch: 'main',
});

// 获取最近基准
const baseline = performanceBaselineManager.getRecentBaseline('/home', 'zh');

// 清理过期基准
performanceBaselineManager.cleanupOldBaselines(30 * 24 * 60 * 60 * 1000);
```

#### 3. 回归检测

```typescript
import { performanceRegressionDetector } from '@/lib/enhanced-web-vitals';

// 检测回归
const regressionResult = performanceRegressionDetector.detectRegression(
  currentMetrics,
  baseline
);

// 生成回归报告
const report = performanceRegressionDetector.generateRegressionReport(regressionResult);
console.log(report);
```

#### 4. 性能预警

```typescript
import { performanceAlertSystem } from '@/lib/enhanced-web-vitals';

// 配置预警系统
performanceAlertSystem.configure({
  enabled: true,
  thresholds: {
    cls: { warning: 0.1, critical: 0.25 },
    lcp: { warning: 2500, critical: 4000 },
    regressionPercent: { warning: 15, critical: 30 },
  },
  notifications: {
    console: true,
    webhook: 'https://your-webhook-url.com',
  },
});

// 检查并发送预警
performanceAlertSystem.checkAndAlert(metrics, regressionResult);
```

## 🔧 配置选项

### 性能阈值配置

```typescript
const PERFORMANCE_THRESHOLDS = {
  CLS_GOOD: 0.1,
  CLS_NEEDS_IMPROVEMENT: 0.25,
  LCP_GOOD: 2500,
  LCP_NEEDS_IMPROVEMENT: 4000,
  FID_GOOD: 100,
  FID_NEEDS_IMPROVEMENT: 300,
  FCP_GOOD: 1800,
  TTFB_GOOD: 800,
  TTFB_NEEDS_IMPROVEMENT: 1800,
};
```

### 预警配置

```typescript
const alertConfig = {
  enabled: true,
  thresholds: {
    cls: { warning: 0.1, critical: 0.25 },
    fid: { warning: 100, critical: 300 },
    lcp: { warning: 2500, critical: 4000 },
    fcp: { warning: 1800, critical: 3000 },
    ttfb: { warning: 800, critical: 1800 },
    regressionPercent: { warning: 15, critical: 30 },
  },
  notifications: {
    console: true,
    webhook: process.env.PERFORMANCE_WEBHOOK_URL,
    email: process.env.PERFORMANCE_ALERT_EMAIL,
  },
};
```

## 📊 报告格式

### 综合性能报告

```
📊 综合性能监控报告
==================================================
🕐 时间: 2024-01-15 10:30:00
📄 页面: 首页
🌐 URL: https://example.com/zh

🎯 核心 Web Vitals:
  CLS: 0.045 🟢
  FID: 85ms 🟢
  LCP: 2100ms 🟢
  FCP: 1650ms 🟢
  TTFB: 720ms 🟢

📈 与基准对比:
  基准时间: 2024-01-14 10:30:00
  CLS: 📉 -12.5%
  FID: 📈 +8.2%
  LCP: 📉 -5.1%
  FCP: 📉 -3.2%
  TTFB: 📈 +2.1%

🔍 性能回归检测报告
========================================
📊 总体趋势: 📊 stable
🚨 回归数量: 0 (关键: 0)
✅ 改进数量: 3

🟢 性能改进:
1. ✨ CLS: 0.052 → 0.045 (-12.5%)
2. ✨ LCP: 2210 → 2100 (-5.1%)
3. ✨ FCP: 1705 → 1650 (-3.2%)

💻 环境信息:
  视口: 1920x1080
  内存: 8GB
  CPU核心: 8
  网络: 4g (10Mbps)
```

### CI/CD 报告

```markdown
## 📊 性能分析报告

**性能得分:** 92/100
**状态:** ✅ 通过
**分支:** main
**提交:** abc12345

### 📦 包大小分析
| 类型 | 大小 | 状态 |
|------|------|------|
| main | 45.2KB | 🟢 正常 |
| framework | 125.8KB | 🟢 正常 |
| shared | 198.5KB | 🟢 正常 |

### 🟢 性能改进
- **LCP:** -5.1% (2100ms vs 2210ms)
- **CLS:** -12.5% (0.045 vs 0.052)
```

## 🔄 CI/CD 集成

### GitHub Actions 集成

创建 `.github/workflows/performance-check.yml`:

```yaml
name: Performance Check

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build project
        run: pnpm build
      
      - name: Run performance analysis
        run: |
          node scripts/performance-analyzer.js --compare-baseline --ci
        env:
          CI: true
          PERFORMANCE_WEBHOOK_URL: ${{ secrets.PERFORMANCE_WEBHOOK_URL }}
```

### 本地开发集成

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "perf:analyze": "node scripts/performance-analyzer.js",
    "perf:baseline": "node scripts/performance-analyzer.js --save-baseline",
    "perf:check": "node scripts/performance-analyzer.js --compare-baseline",
    "perf:ci": "node scripts/performance-analyzer.js --compare-baseline --ci"
  }
}
```

## 🚨 故障排除

### 常见问题

1. **基准数据丢失**
   ```bash
   # 重新建立基准
   pnpm perf:baseline
   ```

2. **性能监控不工作**
   ```typescript
   // 检查初始化
   if (!performanceMonitoringManager.isInitialized) {
     performanceMonitoringManager.initialize();
   }
   ```

3. **预警过于频繁**
   ```typescript
   // 调整阈值
   performanceAlertSystem.configure({
     thresholds: {
       regressionPercent: { warning: 20, critical: 40 },
     },
   });
   ```

### 调试模式

```typescript
// 启用详细日志
import { logger } from '@/lib/logger';
logger.setLevel('debug');

// 查看收集的指标
const metrics = enhancedWebVitalsCollector.getDetailedMetrics();
console.log('Collected metrics:', metrics);

// 生成诊断报告
const diagnosticReport = enhancedWebVitalsCollector.generateDiagnosticReport();
console.log('Diagnostic report:', diagnosticReport);
```

## 📚 最佳实践

1. **定期更新基准** - 每次重大功能发布后更新性能基准
2. **监控关键页面** - 重点监控首页、产品页等关键页面
3. **设置合理阈值** - 根据业务需求设置合理的性能阈值
4. **及时响应预警** - 建立性能预警响应流程
5. **持续优化** - 基于监控数据持续优化性能

## 🔗 相关文档

- [性能预算指南](./performance-budget-guide.md)
- [性能实施报告](./performance-implementation-report.md)
- [Web Vitals 优化指南](../performance-audit-report.md)
