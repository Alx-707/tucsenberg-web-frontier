# 组件测试最佳实践指南

基于ThemeToggle组件测试优化的成功经验，本文档提供了标准化的组件测试最佳实践。

## 📋 目录

1. [测试架构原则](#测试架构原则)
2. [测试结构标准](#测试结构标准)
3. [Mock策略指南](#mock策略指南)
4. [测试用例设计](#测试用例设计)
5. [质量标准](#质量标准)
6. [常见问题解决](#常见问题解决)

## 🏗️ 测试架构原则

### 1. 分层测试策略

```
基础渲染测试 (5个用例)
├── 架构验证 - 组件无错误渲染
├── DOM结构 - 正确的DOM元素
├── 可访问性 - ARIA属性验证
├── 视觉元素 - 图标和文本
└── 选项验证 - 所有功能选项

功能测试 (8个用例)
├── 核心功能 - 主要交互逻辑
├── 状态变化 - 状态转换验证
├── API集成 - 外部API调用
├── 动画控制 - 时序和动画
├── 用户偏好 - 个性化设置
├── 快速操作 - 连续交互处理
└── UI交互 - 界面元素交互

状态管理测试 (6个用例)
├── 数据持久化 - 本地存储
├── 状态同步 - 组件与Hook同步
├── 初始化 - 默认状态处理
├── 错误恢复 - 异常状态处理
└── 数据验证 - 输入输出验证

边缘情况测试 (8个用例)
├── 浏览器兼容性 - 不同环境支持
├── API不可用 - 降级处理
├── 网络异常 - 错误处理
├── 组件生命周期 - 挂载卸载
├── 快速操作 - 防抖和节流
├── 内存管理 - 泄漏防护
├── 异常恢复 - 状态修复
└── 功能降级 - 核心功能保持

可访问性测试 (6个用例)
├── 键盘导航 - 完整键盘支持
├── 屏幕阅读器 - ARIA兼容性
├── 状态管理 - ARIA状态同步
├── 用户偏好 - 高对比度/减少动画
└── 焦点管理 - 焦点流转控制
```

### 2. 测试优先级

**P0 (必须)**: 基础渲染 + 核心功能
**P1 (重要)**: 状态管理 + 可访问性
**P2 (建议)**: 边缘情况 + 性能优化

## 📁 测试结构标准

### 文件组织

```typescript
/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { TEST_CONSTANTS } from '@/constants/test-constants';
import { fireEvent, render } from '@testing-library/react';
import { ComponentName } from '../component-name';

// 1. Mock配置区域 (行1-100)
// 2. 测试环境设置 (行101-150)
// 3. 基础渲染测试 (行151-250)
// 4. 功能测试 (行251-400)
// 5. 状态管理测试 (行401-500)
// 6. 边缘情况测试 (行501-650)
// 7. 可访问性测试 (行651-800)
```

### 标准测试模板

```typescript
describe('ComponentName Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Mock重置
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    // 清理工作
  });

  describe('Basic Rendering', () => {
    // 5个基础渲染测试
  });

  describe('Functionality', () => {
    // 8个功能测试
  });

  describe('State Management', () => {
    // 6个状态管理测试
  });

  describe('Edge Cases & Error Handling', () => {
    // 8个边缘情况测试
  });

  describe('Accessibility & Keyboard Navigation', () => {
    // 6个可访问性测试
  });
});
```

## 🎭 Mock策略指南

### 1. Hook Mock模式

```typescript
// 完整Hook Mock
const mockUseComponentHook = {
  state: 'default',
  isOpen: false,
  setState: jest.fn(),
  handleAction: jest.fn(),
  ariaAttributes: {
    'aria-label': '组件标签',
    'aria-expanded': 'false',
  },
};

// 动态更新Mock
Object.assign(mockUseComponentHook, {
  state: 'updated',
  ariaAttributes: {
    ...mockUseComponentHook.ariaAttributes,
    'aria-expanded': 'true',
  },
});
```

### 2. API Mock模式

```typescript
// 浏览器API Mock
const mockStartViewTransition = jest.fn();
Object.defineProperty(document, 'startViewTransition', {
  value: mockStartViewTransition,
  writable: true,
});

// 存储API Mock
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});
```

### 3. UI组件Mock模式

```typescript
// 第三方组件Mock
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, open }: any) => (
    <div data-testid="dropdown-menu" data-open={open}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children }: any) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
}));
```

## 🧪 测试用例设计

### 1. 命名规范

```typescript
// 好的命名
it('should render without errors (architecture validation)', () => {});
it('should switch to dark theme when dark option is clicked', () => {});
it('should handle View Transitions API unavailability gracefully', () => {});

// 避免的命名
it('test component', () => {});
it('should work', () => {});
it('check functionality', () => {});
```

### 2. 测试结构

```typescript
it('should perform specific action under specific condition', () => {
  // 1. Arrange - 设置测试环境
  Object.assign(mockHook, { state: 'initial' });

  // 2. Act - 执行操作
  render(<Component />);
  const element = document.querySelector('[data-testid="target"]');
  fireEvent.click(element as Element);

  // 3. Assert - 验证结果
  expect(mockHook.handleAction).toHaveBeenCalledWith('expected', expect.any(Object));
});
```

### 3. 断言模式

```typescript
// DOM断言
expect(element).toBeInTheDocument();
expect(element).toHaveAttribute('aria-current', 'active');
expect(element).toHaveTextContent('Expected Text');

// Mock断言
expect(mockFunction).toHaveBeenCalledWith('param', expect.any(Object));
expect(mockFunction).toHaveBeenCalledTimes(1);

// 状态断言
expect(mockHook.state).toBe('expected');
expect(mockHook.ariaAttributes['aria-expanded']).toBe('true');
```

## 📊 质量标准

### 1. 覆盖率目标

- **语句覆盖率**: >65% (组件层测试)
- **分支覆盖率**: >90% (必须)
- **函数覆盖率**: >80%
- **行覆盖率**: >80%

### 2. 性能标准

- **执行时间**: <1.5秒 (33个测试用例)
- **平均每个测试**: <50ms
- **稳定性**: 连续5次运行100%通过

### 3. 代码质量

- **ESLint**: 0错误 (警告可接受)
- **TypeScript**: 0类型错误
- **文件长度**: <1200行 (测试文件可适当放宽)

## 🔧 常见问题解决

### 1. Mock状态同步问题

```typescript
// 问题：Mock状态更新不生效
// 解决：使用Object.assign完整更新
Object.assign(mockHook, {
  state: 'new',
  ariaAttributes: {
    'aria-label': '标签',
    'aria-current': 'new',
  },
});
```

### 2. 异步操作测试

```typescript
// 问题：异步操作测试不稳定
// 解决：使用jest.useFakeTimers()
beforeEach(() => {
  jest.useFakeTimers();
});

it('should handle async operation', () => {
  // 触发异步操作
  fireEvent.click(element);

  // 快进时间
  jest.advanceTimersByTime(TEST_CONSTANTS.TIMEOUT.DEFAULT);

  // 验证结果
  expect(mockFunction).toHaveBeenCalled();
});
```

### 3. 焦点管理测试

```typescript
// 问题：焦点测试在测试环境中不稳定
// 解决：验证元素存在性和交互能力
it('should manage focus correctly', () => {
  render(<Component />);

  const button = document.querySelector('button') as HTMLElement;
  button.focus();

  // 验证焦点设置
  expect(document.activeElement).toBe(button);

  // 验证键盘交互
  fireEvent.keyDown(button, { key: 'Enter' });
  expect(mockHandler).toHaveBeenCalled();
});
```

### 4. 内存泄漏防护

```typescript
// 问题：组件卸载后仍有引用
// 解决：验证清理机制
it('should prevent memory leaks', () => {
  const { unmount } = render(<Component />);

  // 卸载组件
  unmount();

  // 验证DOM清理
  expect(document.querySelector('[data-testid="component"]')).not.toBeInTheDocument();

  // 验证事件监听器清理
  jest.advanceTimersByTime(1000);
  expect(mockHandler.mock.calls.length).toBe(0);
});
```

## 🚀 实施建议

### 1. 渐进式实施

1. **第一阶段**: 基础渲染测试 (5个用例)
2. **第二阶段**: 核心功能测试 (8个用例)
3. **第三阶段**: 状态管理测试 (6个用例)
4. **第四阶段**: 边缘情况测试 (8个用例)
5. **第五阶段**: 可访问性测试 (6个用例)

### 2. 团队协作

- **代码审查**: 重点关注测试覆盖率和质量
- **知识分享**: 定期分享测试最佳实践
- **工具统一**: 使用统一的测试工具和模板

### 3. 持续改进

- **定期评估**: 每月评估测试质量和效率
- **模板更新**: 根据新需求更新测试模板
- **工具优化**: 持续优化测试工具和流程

## 📋 质量检查清单

### 测试完整性检查

- [ ] **基础渲染测试** (5个用例)
  - [ ] 架构验证 - 组件无错误渲染
  - [ ] DOM结构验证 - 正确的DOM元素
  - [ ] 可访问性验证 - ARIA属性完整
  - [ ] 视觉元素验证 - 图标和文本正确
  - [ ] 功能选项验证 - 所有选项可用

- [ ] **功能测试** (8个用例)
  - [ ] 核心功能测试 - 主要交互逻辑
  - [ ] 状态变化测试 - 状态转换正确
  - [ ] API集成测试 - 外部API调用
  - [ ] 动画控制测试 - 时序和动画
  - [ ] 用户偏好测试 - 个性化设置
  - [ ] 快速操作测试 - 连续交互处理
  - [ ] UI交互测试 - 界面元素交互

- [ ] **状态管理测试** (6个用例)
  - [ ] 数据持久化测试 - 本地存储
  - [ ] 状态同步测试 - 组件与Hook同步
  - [ ] 初始化测试 - 默认状态处理
  - [ ] 错误恢复测试 - 异常状态处理
  - [ ] 数据验证测试 - 输入输出验证

- [ ] **边缘情况测试** (8个用例)
  - [ ] 浏览器兼容性 - 不同环境支持
  - [ ] API不可用处理 - 降级处理
  - [ ] 网络异常处理 - 错误处理
  - [ ] 组件生命周期 - 挂载卸载
  - [ ] 快速操作处理 - 防抖和节流
  - [ ] 内存管理 - 泄漏防护
  - [ ] 异常恢复 - 状态修复
  - [ ] 功能降级 - 核心功能保持

- [ ] **可访问性测试** (6个用例)
  - [ ] 键盘导航 - 完整键盘支持
  - [ ] 屏幕阅读器 - ARIA兼容性
  - [ ] 状态管理 - ARIA状态同步
  - [ ] 用户偏好 - 高对比度/减少动画
  - [ ] 焦点管理 - 焦点流转控制

### 质量标准检查

- [ ] **覆盖率指标**
  - [ ] 语句覆盖率 ≥ 65%
  - [ ] 分支覆盖率 ≥ 90%
  - [ ] 函数覆盖率 ≥ 80%
  - [ ] 行覆盖率 ≥ 80%

- [ ] **性能指标**
  - [ ] 总执行时间 < 1.5秒
  - [ ] 平均每个测试 < 50ms
  - [ ] 连续5次运行100%通过

- [ ] **代码质量**
  - [ ] ESLint检查通过 (0错误)
  - [ ] TypeScript检查通过 (0类型错误)
  - [ ] 测试命名规范符合标准
  - [ ] Mock配置完整且正确

### 验收标准

- [ ] **功能验收**
  - [ ] 所有测试用例通过
  - [ ] 覆盖率达到目标
  - [ ] 性能指标符合要求
  - [ ] 无随机失败

- [ ] **质量验收**
  - [ ] 代码审查通过
  - [ ] 文档完整
  - [ ] 可复用性验证
  - [ ] 团队培训完成

---

**文档版本**: v1.0.0
**最后更新**: 2025年8月6日
**基于项目**: ThemeToggle测试优化成功案例
