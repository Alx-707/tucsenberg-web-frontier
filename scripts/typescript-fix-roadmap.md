# TypeScript错误修复路线图

## 当前状态
- **总错误数**: 3099个（从3889个减少了790个，20.3%改善）
- **Export * 数量**: 26个（已达标<30个目标）
- **主要工具**: 错误分析和自动修复脚本已完善

## 下一阶段修复计划

### 阶段1: 批量修复剩余TS1205错误 (预计减少300-400个错误)
**目标文件**:
- `src/lib/locale-storage-types.ts` (85个错误)
- `src/lib/locale-storage-manager.ts` (80个错误)
- `src/lib/locale-storage-maintenance-operations.ts` (43个错误)
- `src/lib/locale-storage-history-query.ts` (34个错误)

**修复策略**:
```bash
# 使用现有工具继续修复
node scripts/fix-import-type-issues.js

# 手动修复复杂的重新导出
# 将 export { ... } 改为 export type { ... } 和 export { ... } 分离
```

### 阶段2: 测试文件Mock类型优化 (预计减少200-300个错误)
**目标文件**:
- `src/lib/__tests__/enhanced-web-vitals-core.test.ts` (47个错误)
- `src/components/__tests__/theme-toggle/setup.tsx` (44个错误)
- `src/lib/__tests__/performance-analytics.test.ts` (37个错误)
- `src/lib/__tests__/translation-manager-core.test.ts` (37个错误)

**修复策略**:
```typescript
// 创建专用的Mock类型定义
interface MockFunction<T = any> {
  (...args: any[]): T;
  mockReturnValue: (value: T) => MockFunction<T>;
  mockResolvedValue: (value: T) => MockFunction<Promise<T>>;
}

// 统一Mock对象类型
interface MockObject {
  [key: string]: MockFunction | any;
}
```

### 阶段3: 业务逻辑类型完善 (预计减少400-500个错误)
**主要错误类型**:
- TS2322 (类型不匹配): ~600个
- TS2339 (属性不存在): ~450个

**修复策略**:
1. **组件Props类型完善**
2. **API响应类型定义**
3. **事件处理器类型**
4. **状态管理类型**

### 阶段4: 代码清理优化 (预计减少250个错误)
**目标错误**:
- TS6196 (未使用声明): 177个
- TS6133 (未使用变量): 127个
- TS7006 (隐式any): 44个

**修复策略**:
```bash
# 自动移除未使用的导入
npx eslint --fix src/**/*.{ts,tsx}

# 添加类型注解
# 手动为隐式any参数添加类型
```

### 阶段5: 安全性检查增强 (预计减少200-300个错误)
**目标错误**:
- TS18046 (可能为undefined): 99个
- TS2532 (对象可能为undefined): 68个
- TS2571 (对象可能为null): 74个

**修复策略**:
```typescript
// 添加安全检查
if (obj?.property) {
  // 安全访问
}

// 使用空值合并
const value = obj?.property ?? defaultValue;

// 类型守卫
function isNotNull<T>(value: T | null | undefined): value is T {
  return value != null;
}
```

## 预期最终目标
- **TypeScript错误**: 从3099个减少到1500个以下（60%改善）
- **代码质量**: 消除所有安全性风险
- **维护性**: 完善的类型定义和接口
- **开发体验**: 更好的IDE支持和错误提示

## 执行顺序
1. 继续批量修复TS1205错误（最容易，效果最明显）
2. 优化测试文件Mock类型（提升测试质量）
3. 完善业务逻辑类型（提升代码质量）
4. 代码清理优化（提升维护性）
5. 安全性检查增强（提升健壮性）

## 成功指标
- 每个阶段完成后运行 `pnpm arch:metrics` 验证改善效果
- 每个阶段完成后运行 `pnpm type-check` 确认错误减少
- 每个阶段完成后运行 `pnpm test` 确保功能正常
- 最终目标：TypeScript错误数量 < 1500个
