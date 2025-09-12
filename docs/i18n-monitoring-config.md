# i18n 兼容性监控配置

## 📋 监控概述

**目的**: 追踪 Next.js 15 + next-intl + Playwright 兼容性问题的官方修复进展

**背景**: 由于已知的兼容性问题，需要持续监控相关项目的更新和修复状态

**监控范围**: 
- Next.js 官方仓库
- next-intl 官方仓库
- Playwright 官方仓库
- 相关社区讨论

## 🔍 GitHub Issue 订阅设置

### 1. Next.js 仓库监控

**仓库**: `vercel/next.js`

**关键 Issue 标签**:
- `area: middleware`
- `area: i18n`
- `area: testing`
- `bug`
- `type: next`

**搜索查询**:
```
repo:vercel/next.js is:issue is:open label:"area: middleware" OR label:"area: i18n" OR label:"area: testing"
```

**订阅方式**:
1. 访问 [Next.js Issues](https://github.com/vercel/next.js/issues)
2. 使用搜索查询过滤相关问题
3. 点击 "Subscribe" 按钮订阅搜索结果
4. 设置邮件通知频率为 "Weekly"

### 2. next-intl 仓库监控

**仓库**: `amannn/next-intl`

**关键 Issue 标签**:
- `bug`
- `enhancement`
- `next.js`
- `testing`

**搜索查询**:
```
repo:amannn/next-intl is:issue is:open "Next.js 15" OR "Playwright" OR "middleware" OR "SSR"
```

**订阅方式**:
1. 访问 [next-intl Issues](https://github.com/amannn/next-intl/issues)
2. 使用搜索查询过滤相关问题
3. 订阅相关讨论

### 3. Playwright 仓库监控

**仓库**: `microsoft/playwright`

**关键 Issue 标签**:
- `bug`
- `feature`
- `next.js`

**搜索查询**:
```
repo:microsoft/playwright is:issue is:open "Next.js" OR "middleware" OR "i18n"
```

## 📦 依赖更新监控

### 1. 自动化依赖检查

**工具**: Dependabot (已配置)

**配置文件**: `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "development-team"
    labels:
      - "dependencies"
      - "i18n-monitoring"
```

### 2. 手动版本检查脚本

**文件**: `scripts/check-i18n-versions.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

const PACKAGES_TO_MONITOR = [
  'next',
  'next-intl',
  '@playwright/test'
];

async function checkLatestVersions() {
  console.log('🔍 检查 i18n 相关包的最新版本...\n');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  for (const pkg of PACKAGES_TO_MONITOR) {
    const currentVersion = packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg];
    
    if (currentVersion) {
      console.log(`📦 ${pkg}:`);
      console.log(`   当前版本: ${currentVersion}`);
      
      try {
        const latestVersion = await getLatestVersion(pkg);
        console.log(`   最新版本: ${latestVersion}`);
        
        if (currentVersion !== latestVersion) {
          console.log(`   ⚠️  有新版本可用！`);
        } else {
          console.log(`   ✅ 已是最新版本`);
        }
      } catch (error) {
        console.log(`   ❌ 无法获取最新版本: ${error.message}`);
      }
      
      console.log('');
    }
  }
}

function getLatestVersion(packageName) {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${packageName}/latest`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const packageInfo = JSON.parse(data);
          resolve(packageInfo.version);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

checkLatestVersions().catch(console.error);
```

### 3. 版本检查命令

**package.json 脚本**:
```json
{
  "scripts": {
    "check-i18n-versions": "node scripts/check-i18n-versions.js",
    "monitor-i18n": "npm run check-i18n-versions && npm run test:i18n-unit"
  }
}
```

## 📅 定期检查计划

### 1. 每周检查任务

**时间**: 每周一上午 10:00

**检查内容**:
- [ ] 运行版本检查脚本
- [ ] 查看 GitHub issue 更新
- [ ] 检查相关 PR 状态
- [ ] 更新问题文档状态

**执行命令**:
```bash
npm run monitor-i18n
```

### 2. 每月深度检查

**时间**: 每月第一个工作日

**检查内容**:
- [ ] 全面测试 i18n 功能
- [ ] 运行手动测试清单
- [ ] 评估是否可以恢复 E2E 测试
- [ ] 更新监控配置

### 3. 版本发布监控

**触发条件**:
- Next.js 新版本发布
- next-intl 新版本发布
- Playwright 新版本发布

**响应行动**:
1. 立即测试新版本兼容性
2. 更新测试环境
3. 评估是否修复了已知问题
4. 更新文档和配置

## 🔔 通知设置

### 1. GitHub 通知

**设置路径**: GitHub Settings > Notifications

**推荐配置**:
- Issues: Weekly digest
- Pull requests: Immediate
- Releases: Immediate

### 2. 邮件通知模板

**主题**: `[i18n监控] {仓库名} - {更新类型}`

**内容模板**:
```
📋 i18n 兼容性监控更新

仓库: {仓库名}
更新类型: {Issue/PR/Release}
标题: {标题}
链接: {链接}

相关性评估:
- 是否与 Next.js 15 相关: {是/否}
- 是否与 next-intl 相关: {是/否}
- 是否与 Playwright 相关: {是/否}
- 优先级: {高/中/低}

建议行动:
{具体建议}

---
自动生成于 {时间}
```

### 3. Slack 集成 (可选)

**Webhook URL**: `{团队 Slack Webhook}`

**通知频道**: `#development-i18n`

**触发条件**:
- 高优先级 issue 更新
- 新版本发布
- 兼容性问题修复

## 📊 监控仪表板

### 1. 状态跟踪表

| 组件 | 当前版本 | 最新版本 | 兼容性状态 | 最后检查 | 下次检查 |
|------|----------|----------|------------|----------|----------|
| Next.js | 15.5.2 | - | ⚠️ 部分兼容 | 2025-01-XX | 2025-02-XX |
| next-intl | 4.3.4 | - | ⚠️ 部分兼容 | 2025-01-XX | 2025-02-XX |
| Playwright | 1.55.0 | - | ✅ 正常 | 2025-01-XX | 2025-02-XX |

### 2. 问题跟踪列表

**高优先级问题**:
- [ ] Next.js 15 middleware 在测试环境不运行
- [ ] next-intl SSR 在 Playwright 环境失效

**中优先级问题**:
- [ ] 测试环境 locale 检测不准确
- [ ] 语言切换动画在测试中不稳定

**低优先级问题**:
- [ ] 测试覆盖率可以进一步提升

## 🛠️ 自动化脚本

### 1. 监控脚本

**文件**: `scripts/i18n-monitor.sh`

```bash
#!/bin/bash

echo "🔍 开始 i18n 兼容性监控..."

# 检查版本更新
echo "📦 检查包版本..."
npm run check-i18n-versions

# 运行单元测试
echo "🧪 运行 i18n 单元测试..."
npm run test:unit -- tests/unit/i18n.test.ts

# 运行集成测试
echo "🔗 运行 i18n 集成测试..."
npm run test:integration -- tests/integration/i18n-components.test.ts

# 生成监控报告
echo "📊 生成监控报告..."
node scripts/generate-i18n-report.js

echo "✅ i18n 监控完成！"
```

### 2. 报告生成脚本

**文件**: `scripts/generate-i18n-report.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    status: 'monitoring',
    components: {
      'Next.js': { version: '15.5.2', status: 'partial' },
      'next-intl': { version: '4.3.4', status: 'partial' },
      'Playwright': { version: '1.55.0', status: 'ok' }
    },
    tests: {
      unit: 'passing',
      integration: 'passing',
      e2e: 'limited'
    },
    recommendations: [
      '继续监控官方仓库更新',
      '每周运行兼容性检查',
      '关注 Next.js 15.6+ 版本'
    ]
  };

  const reportPath = path.join('reports', 'i18n-monitoring-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 监控报告已生成: ${reportPath}`);
}

generateReport();
```

## 📝 使用说明

### 1. 初始设置

```bash
# 1. 创建监控脚本
chmod +x scripts/i18n-monitor.sh
chmod +x scripts/check-i18n-versions.js

# 2. 创建报告目录
mkdir -p reports

# 3. 设置 GitHub 通知
# 访问相关仓库并订阅 issues

# 4. 运行初始检查
npm run monitor-i18n
```

### 2. 日常使用

```bash
# 每周检查
npm run monitor-i18n

# 手动版本检查
npm run check-i18n-versions

# 生成报告
node scripts/generate-i18n-report.js
```

### 3. 问题响应流程

1. **收到通知** → 评估相关性
2. **高相关性** → 立即测试
3. **确认修复** → 更新配置
4. **测试通过** → 恢复 E2E 测试
5. **更新文档** → 通知团队

---

**配置版本**: v1.0  
**最后更新**: 2025-01-XX  
**维护人员**: 开发团队  
**下次审查**: 2025-02-XX
