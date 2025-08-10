# 性能预算控制指南

## 📋 概述

本指南介绍如何使用size-limit和@next/bundle-analyzer进行性能预算控制，确保应用包大小和加载性能符合企业级标准。

## 🎯 性能预算标准

### 当前配置的预算限制

| 组件类型         | 大小限制 | 当前大小 | 状态    |
| ---------------- | -------- | -------- | ------- |
| Main App Bundle  | 50 KB    | ~3.8 KB  | ✅ 通过 |
| Framework Bundle | 130 KB   | ~54 KB   | ✅ 通过 |
| Main Bundle      | 40 KB    | ~37 KB   | ✅ 通过 |
| Home Page Bundle | 10 KB    | ~0.4 KB  | ✅ 通过 |
| CSS Bundle       | 50 KB    | ~35 KB   | ✅ 通过 |
| Shared Chunks    | 220 KB   | ~212 KB  | ✅ 通过 |
| Polyfills Bundle | 50 KB    | ~35 KB   | ✅ 通过 |
| Webpack Runtime  | 10 KB    | ~1.7 KB  | ✅ 通过 |

## 🚀 使用方法

### 基础性能检查

```bash
# 检查包大小预算
pnpm size:check

# 分析包大小原因
pnpm size:why

# 完整性能审计
pnpm perf:audit
```

### Bundle分析

```bash
# 生成bundle分析报告
pnpm analyze

# 分析服务端bundle
pnpm analyze:server

# 分析客户端bundle
pnpm analyze:browser
```

## 📊 性能监控

### 自动化集成

性能检查已集成到质量保证流程中：

```bash
# 完整质量检查（包含性能预算）
pnpm quality:full
```

### CI/CD集成

在持续集成中，性能预算检查会：

- 自动运行包大小检查
- 检测性能回归
- 阻止超出预算的部署

## 🔧 配置文件

### .size-limit.js

性能预算配置文件，定义了各个bundle的大小限制：

```javascript
module.exports = [
  {
    name: 'Main App Bundle (First Load JS)',
    path: '.next/static/chunks/main-app-*.js',
    limit: '50 KB',
    webpack: false,
    running: false,
  },
  // ... 其他配置
];
```

### next.config.ts

Bundle分析器和性能优化配置：

```typescript
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env['ANALYZE'] === 'true',
});

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  webpack: (config, { dev, isServer }) => {
    // 生产环境包大小优化
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          enforce: true,
        },
      };
    }
    return config;
  },
};
```

## 📈 性能优化策略

### 1. 代码分割

- 使用动态导入 `import()` 进行路由级代码分割
- 组件级懒加载 `React.lazy()`
- 第三方库按需加载

### 2. Bundle优化

- 配置webpack splitChunks优化
- 使用optimizePackageImports减少包大小
- Tree shaking移除未使用代码

### 3. 资源优化

- 图片优化和懒加载
- 字体优化和预加载
- CSS优化和压缩

### 4. 缓存策略

- 静态资源长期缓存
- 动态内容适当缓存
- Service Worker缓存策略

## 🚨 性能回归处理

### 当性能预算超标时

1. **分析原因**：

   ```bash
   pnpm size:why
   ```

2. **查看详细报告**：

   ```bash
   pnpm analyze
   ```

3. **优化策略**：

   - 检查新增依赖
   - 优化代码分割
   - 移除未使用代码
   - 升级依赖版本

4. **调整预算**（最后手段）：
   - 评估业务需求
   - 更新.size-limit.js
   - 记录调整原因

## 📋 最佳实践

### 开发阶段

- 定期运行性能检查
- 新增功能前评估性能影响
- 使用bundle分析器了解依赖关系

### 部署阶段

- 自动化性能检查
- 性能回归自动告警
- 性能数据趋势监控

### 团队协作

- 性能预算共识
- 性能优化培训
- 定期性能回顾

## 🎯 性能目标

### 加载性能目标

- 首屏加载时间 < 2秒
- 交互响应时间 < 100ms
- 页面切换时间 < 500ms

### 包大小目标

- 首次加载JS < 300KB
- 页面级JS < 150KB
- CSS总大小 < 50KB

### Core Web Vitals

- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

---

**性能预算控制是确保应用性能的重要手段，需要持续监控和优化。** 🚀
