# 企业级代码质量标准文档

## 📋 概述

本文档定义了项目的企业级代码质量标准，包括ESLint配置规则、最佳实践和质量门禁要求。

## 🎯 质量目标

### 核心质量指标
- **错误数量**: 0个（零容忍）
- **警告数量**: ≤500个
- **质量分数**: ≥90分
- **any类型使用**: 0个（严格禁止）

### 质量分级标准
- **优秀**: 质量分数 ≥90分
- **良好**: 质量分数 80-89分
- **及格**: 质量分数 60-79分
- **不及格**: 质量分数 <60分

## 🔧 ESLint配置架构

### 配置层次结构
```
1. 基础JavaScript配置 (js.configs.recommended)
2. Next.js核心配置 (next/core-web-vitals + next/typescript)
3. React优化规则 (react-you-might-not-need-an-effect)
4. 安全配置 (security + security-node)
5. 代码质量配置 (企业级严格标准)
6. 特定文件配置 (i18n、测试、开发工具)
7. AI编码增强规则
8. Prettier格式化配置
```

## 📏 核心质量规则详解

### 1. 函数复杂度控制

#### `max-lines-per-function: 120`
**作用**: 限制函数最大行数，强制函数分解
**级别**: error
**适用**: 所有生产代码

```typescript
// ❌ 违反规则 - 函数过长
function LargeComponent() {
  // 150行代码...
  // 包含状态管理、事件处理、UI渲染等
  // 难以理解和维护
}

// ✅ 符合规则 - 函数分解
function ComponentContainer() {
  return (
    <div>
      <ComponentHeader />
      <ComponentBody />
      <ComponentFooter />
    </div>
  );
}
```

#### `complexity: 15`
**作用**: 限制圈复杂度，提高可测试性
**级别**: error
**适用**: 所有代码

```typescript
// ❌ 复杂度过高（>15）
function processData(data) {
  if (data.type === 'A') {
    if (data.status === 'active') {
      if (data.priority === 'high') {
        if (data.urgent) {
          // 更多嵌套条件...
        }
      }
    }
  }
  // 圈复杂度 = 20+
}

// ✅ 复杂度合理（≤15）
function processData(data) {
  const processor = getProcessor(data.type);
  return processor.process(data);
}
```

### 2. 类型安全规则

#### `@typescript-eslint/no-explicit-any: 'error'`
**作用**: 严格禁止any类型，确保类型安全
**级别**: error
**适用**: 所有TypeScript文件（包括测试文件）

```typescript
// ❌ 违反规则
function processUser(user: any) {
  return user.name.toUpperCase(); // 运行时可能出错
}

// ✅ 符合规则
interface User {
  name: string;
  email: string;
}

function processUser(user: User) {
  return user.name.toUpperCase(); // 类型安全
}
```

### 3. 安全防护规则

#### `security/detect-object-injection: 'error'`
**作用**: 防止对象注入攻击
**级别**: error
**适用**: 核心业务代码

```typescript
// ❌ 潜在安全风险
function getValue(obj, key) {
  return obj[key]; // 可能的对象注入攻击
}

// ✅ 安全的做法
function getValue(obj, key) {
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key];
  }
  return undefined;
}
```

## 🎯 特定文件配置策略

### 测试文件配置
**配置名称**: `progressive-unified-test-config`
**适用文件**: `**/*.test.{js,jsx,ts,tsx}`

**关键调整**:
- `max-lines-per-function`: 300行（warn级别）
- `complexity`: 20（warn级别）
- `@typescript-eslint/no-explicit-any`: error（保持严格）

**理由**: 测试文件需要适度放宽复杂度限制，但类型安全同样重要。

### 开发工具配置
**配置名称**: `progressive-unified-dev-tools-config`
**适用文件**: `src/components/dev-tools/**/*.{ts,tsx}`

**关键调整**:
- `max-lines-per-function`: 150行（warn级别）
- `complexity`: 18（warn级别）
- `@typescript-eslint/no-explicit-any`: warn（允许但警告）

**理由**: 开发工具需要更多灵活性，但仍需保持基本质量标准。

## 🚀 AI编码质量增强

### 针对AI编码特点的规则
```javascript
{
  name: 'progressive-unified-enhancements',
  rules: {
    // AI编码常见问题
    'prefer-const': 'error', // AI倾向于使用let
    'no-duplicate-imports': 'error', // AI可能重复导入
    'no-var': 'error', // 严格禁止var

    // React特化
    'react-hooks/exhaustive-deps': 'warn', // AI容易遗漏依赖

    // 代码结构
    'max-statements-per-line': ['error', { max: 1 }], // 每行一个语句
    'func-names': ['warn', 'as-needed'], // 鼓励命名函数
  }
}
```

## 📊 质量监控与门禁

### 质量监控工具
- **脚本**: `scripts/quality-monitor.js`
- **命令**: `pnpm run quality:monitor`
- **报告**: `reports/quality/latest-quality-summary.json`

### CI/CD质量门禁
- **GitHub Actions**: `.github/workflows/code-quality.yml`
- **检查项目**:
  - TypeScript类型检查
  - ESLint代码规范检查
  - 安全漏洞扫描
  - 架构依赖分析
  - 循环依赖检测
  - 单元测试执行

### 质量门禁阈值
```javascript
const QUALITY_THRESHOLDS = {
  maxErrors: 0, // 企业级标准：零错误容忍
  maxWarnings: 500, // 当前目标：500个警告以下
  maxAnyTypeUsage: 0, // 严格禁止any类型
  maxComplexityViolations: 10, // 复杂度违规最多10个
  maxFunctionLengthViolations: 20, // 函数长度违规最多20个
  maxSecurityWarnings: 30, // 安全警告最多30个
};
```

## 🔄 渐进式改进计划

### 第一阶段（当前）：基础质量保障
- ✅ 保持核心标准：120行函数，15复杂度
- ✅ 测试文件适度收紧：300行限制
- ✅ 开发工具最小豁免：150行限制
- ✅ 严格禁止any类型使用

### 第二阶段（3个月后）：逐步收紧
- 函数长度：120→100行
- 复杂度：15→12
- 测试文件：300→250行
- 开发工具：150→120行

### 第三阶段（6个月后）：企业级标准
- 函数长度：100→80行
- 复杂度：12→10
- 全面收紧到行业最佳实践

## 🛠️ 最佳实践

### 1. 函数设计原则
- **单一职责**: 每个函数只做一件事
- **纯函数优先**: 避免副作用，便于测试
- **命名清晰**: 函数名应该清楚表达其功能
- **参数限制**: 最多5个参数，超过时使用对象参数

### 2. 类型安全实践
- **接口优先**: 使用interface而非type
- **严格模式**: 启用TypeScript严格模式
- **类型守卫**: 使用类型守卫确保运行时安全
- **泛型约束**: 合理使用泛型约束

### 3. 安全编码实践
- **输入验证**: 验证所有外部输入
- **输出编码**: 防止XSS攻击
- **权限检查**: 实施最小权限原则
- **错误处理**: 不暴露敏感信息

## 🚨 异常处理流程

### 质量门禁失败处理
1. **立即停止**: 代码不能合并到主分支
2. **问题分析**: 查看质量报告，识别具体问题
3. **优先修复**: 按error→warning→其他的顺序修复
4. **重新检查**: 修复后重新运行质量检查
5. **文档更新**: 如有必要，更新相关文档

### 规则豁免申请
1. **充分理由**: 提供技术和业务理由
2. **影响评估**: 评估对代码质量的影响
3. **临时性**: 豁免应该是临时的
4. **定期审查**: 定期审查豁免的必要性

## 📈 质量指标监控

### 日常监控
- **每日构建**: 自动运行质量检查
- **趋势分析**: 跟踪质量指标变化
- **问题预警**: 质量下降时及时预警

### 定期报告
- **周报**: 质量指标周度总结
- **月报**: 质量趋势月度分析
- **季报**: 质量改进计划评估

## 🎓 团队培训

### 新人入职
- **质量标准培训**: 了解企业级质量要求
- **工具使用培训**: 掌握ESLint和质量监控工具
- **最佳实践培训**: 学习代码质量最佳实践

### 持续教育
- **技术分享**: 定期分享质量改进经验
- **案例分析**: 分析质量问题和解决方案
- **标准更新**: 及时传达标准变更

## 📖 附录：完整规则列表

### 复杂度控制规则
| 规则名称 | 级别 | 阈值 | 作用说明 |
|----------|------|------|----------|
| `max-lines-per-function` | error | 120 | 限制函数最大行数 |
| `complexity` | error | 15 | 限制圈复杂度 |
| `max-depth` | error | 4 | 限制嵌套深度 |
| `max-params` | error | 5 | 限制函数参数数量 |
| `max-lines` | error | 500 | 限制文件最大行数 |
| `max-statements` | error | 30 | 限制函数最大语句数 |

### TypeScript规则
| 规则名称 | 级别 | 作用说明 |
|----------|------|----------|
| `@typescript-eslint/no-explicit-any` | error | 严格禁止any类型 |
| `@typescript-eslint/no-unused-vars` | error | 禁止未使用变量 |
| `@typescript-eslint/no-unused-expressions` | error | 禁止未使用表达式 |

### 安全规则
| 规则名称 | 级别 | 作用说明 |
|----------|------|----------|
| `security/detect-object-injection` | error | 防止对象注入攻击 |
| `security/detect-non-literal-regexp` | error | 防止动态正则表达式 |
| `security/detect-unsafe-regex` | error | 检测不安全的正则 |
| `security/detect-eval-with-expression` | error | 禁止eval使用 |

### React特化规则
| 规则名称 | 级别 | 作用说明 |
|----------|------|----------|
| `react-hooks/exhaustive-deps` | warn | 检查Hook依赖完整性 |
| `react-you-might-not-need-an-effect/*` | error | 优化useEffect使用 |

---

**文档版本**: v1.0
**最后更新**: 2025-09-06
**维护者**: 开发团队
