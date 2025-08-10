# 测试模板使用指南

本指南详细说明如何使用ThemeToggle项目创建的可复用测试模板和工具库。

## 🚀 快速开始

### 1. 导入测试模板

```typescript
import { ComponentTestStructure, TestUtils, TestPatterns } from '@/testing/templates/component-test-template';
import { ThemeTestUtils, ThemeTestAssertions, ThemeTestMockFactory } from '@/testing/utils/theme-test-utilities';
```

### 2. 创建基础测试文件

```typescript
/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { TEST_CONSTANTS } from '@/constants/test-constants';
import { fireEvent, render } from '@testing-library/react';
import { ComponentTestStructure } from '@/testing/templates/component-test-template';
import { YourComponent } from '../your-component';

// 创建测试结构
const testStructure = new ComponentTestStructure({
  componentName: 'YourComponent',
  Component: YourComponent,
  defaultProps: {},
  mockSetup: () => {
    // 初始化Mock
  },
  mockCleanup: () => {
    // 清理Mock
  },
});

// 生成测试套件
describe('YourComponent', () => {
  // 使用模板生成的测试结构
});
```

## 🎭 Mock工厂使用

### 1. 主题相关组件测试

```typescript
import { ThemeTestMockFactory } from '@/testing/utils/theme-test-utilities';

describe('ThemeRelatedComponent', () => {
  let testEnv: ReturnType<typeof ThemeTestMockFactory.createThemeTestEnvironment>;

  beforeEach(() => {
    // 创建完整测试环境
    testEnv = ThemeTestMockFactory.createThemeTestEnvironment();
    
    // Mock主题Hook
    jest.mock('@/hooks/use-theme-toggle', () => ({
      useThemeToggle: () => testEnv.themeHookMock,
    }));
  });

  afterEach(() => {
    testEnv.reset();
  });

  it('should handle theme changes', () => {
    // 更新主题状态
    testEnv.updateTheme({ theme: 'dark' });
    
    render(<ThemeRelatedComponent />);
    
    // 验证主题应用
    ThemeTestAssertions.verifyThemeButton('[data-testid="theme-button"]', 'dark');
  });
});
```

### 2. 通用组件测试

```typescript
import { TestUtils } from '@/testing/templates/component-test-template';

describe('GenericComponent', () => {
  it('should handle user interactions', () => {
    const mockHandler = TestUtils.createMockFactory();
    
    render(<GenericComponent onAction={mockHandler} />);
    
    const button = TestUtils.verifyElement.exists('[data-testid="action-button"]');
    TestUtils.simulateUserInteraction.click(button);
    
    expect(mockHandler).toHaveBeenCalledWith(expect.any(Object));
  });
});
```

## 📋 测试用例生成

### 1. 使用测试模式

```typescript
import { TestPatterns } from '@/testing/templates/component-test-template';

describe('Component Rendering', () => {
  const patterns = TestPatterns.basicRendering('MyComponent');
  
  it(patterns.architectureValidation, () => {
    expect(() => {
      render(<MyComponent />);
    }).not.toThrow();
  });
  
  it(patterns.domStructure, () => {
    render(<MyComponent />);
    TestUtils.verifyElement.exists('[data-testid="my-component"]');
  });
  
  it(patterns.accessibility, () => {
    render(<MyComponent />);
    const element = TestUtils.verifyElement.exists('[data-testid="my-component"]');
    TestUtils.verifyElement.hasAttribute(element, 'aria-label');
  });
});
```

### 2. 生成交互测试

```typescript
describe('Component Interactions', () => {
  it(TestPatterns.interaction.click('menu toggle'), () => {
    const mockToggle = TestUtils.createMockFactory();
    
    render(<MyComponent onToggle={mockToggle} />);
    
    const button = TestUtils.verifyElement.exists('[data-testid="toggle-button"]');
    TestUtils.simulateUserInteraction.click(button);
    
    expect(mockToggle).toHaveBeenCalled();
  });
  
  it(TestPatterns.interaction.keyboard('Enter', 'activation'), () => {
    const mockActivate = TestUtils.createMockFactory();
    
    render(<MyComponent onActivate={mockActivate} />);
    
    const element = TestUtils.verifyElement.exists('[data-testid="activatable"]');
    TestUtils.simulateUserInteraction.keyDown(element, 'Enter');
    
    expect(mockActivate).toHaveBeenCalled();
  });
});
```

## 🔧 高级用法

### 1. 自定义Mock环境

```typescript
import { ThemeTestUtils } from '@/testing/utils/theme-test-utilities';

describe('Advanced Component', () => {
  let customMock: ReturnType<typeof ThemeTestUtils.createThemeHookMock>;

  beforeEach(() => {
    // 创建自定义Mock
    customMock = ThemeTestUtils.createThemeHookMock({
      theme: 'dark',
      supportsViewTransitions: false,
      prefersReducedMotion: true,
    });
    
    // 应用Mock
    jest.mock('@/hooks/use-theme-toggle', () => ({
      useThemeToggle: () => customMock,
    }));
  });

  it('should work with custom configuration', () => {
    render(<AdvancedComponent />);
    
    // 验证自定义配置生效
    expect(customMock.theme).toBe('dark');
    expect(customMock.supportsViewTransitions).toBe(false);
  });
});
```

### 2. 批量测试场景

```typescript
import { ThemeTestUtils } from '@/testing/utils/theme-test-utilities';

describe('Theme Scenarios', () => {
  const scenarios = ThemeTestUtils.getThemeScenarios();
  
  scenarios.forEach(scenario => {
    it(scenario.description, () => {
      const testEnv = ThemeTestMockFactory.createThemeTestEnvironment();
      testEnv.updateTheme({ theme: scenario.theme });
      
      render(<ThemeComponent />);
      
      ThemeTestAssertions.verifyThemeButton(
        '[data-testid="theme-button"]',
        scenario.theme
      );
    });
  });
});
```

### 3. 边缘情况测试

```typescript
describe('Edge Cases', () => {
  const edgeCases = ThemeTestUtils.getEdgeCaseScenarios();
  
  edgeCases.forEach(edgeCase => {
    it(edgeCase.description, () => {
      const testEnv = ThemeTestMockFactory.createThemeTestEnvironment();
      
      // 应用边缘情况设置
      edgeCase.setup?.(testEnv.themeHookMock);
      
      // 组件应该优雅处理边缘情况
      expect(() => {
        render(<RobustComponent />);
      }).not.toThrow();
    });
  });
});
```

## 📊 质量检查

### 1. 使用质量检查清单

```typescript
// 在测试文件末尾添加质量检查
describe('Quality Checks', () => {
  it('should meet performance requirements', async () => {
    const startTime = performance.now();
    
    render(<Component />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // 渲染时间应该小于50ms
    expect(renderTime).toBeLessThan(50);
  });
  
  it('should have proper cleanup', () => {
    const { unmount } = render(<Component />);
    
    unmount();
    
    // 验证组件完全清理
    expect(document.querySelector('[data-testid="component"]')).not.toBeInTheDocument();
  });
});
```

### 2. 覆盖率验证

```bash
# 运行覆盖率检查
npm test -- --coverage --collectCoverageFrom="src/components/your-component.tsx"

# 期望结果
# Statements: >65%
# Branches: >90%
# Functions: >80%
# Lines: >80%
```

## 🎯 最佳实践

### 1. 测试命名

```typescript
// ✅ 好的命名
it('should render without errors (architecture validation)', () => {});
it('should switch to dark theme when dark menu item is clicked', () => {});
it('should handle keyboard navigation with Enter key', () => {});

// ❌ 避免的命名
it('test component', () => {});
it('should work correctly', () => {});
it('check theme', () => {});
```

### 2. Mock管理

```typescript
// ✅ 集中管理Mock
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  
  // 重置所有Mock到默认状态
  testEnv.reset();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});
```

### 3. 断言策略

```typescript
// ✅ 具体的断言
expect(element).toHaveAttribute('aria-current', 'dark');
expect(mockFunction).toHaveBeenCalledWith('dark', expect.any(Object));
expect(mockFunction).toHaveBeenCalledTimes(1);

// ❌ 模糊的断言
expect(element).toBeTruthy();
expect(mockFunction).toHaveBeenCalled();
```

## 🔍 故障排除

### 1. 常见问题

**问题**: Mock状态更新不生效
```typescript
// 解决方案：使用Object.assign完整更新
Object.assign(mockHook, newState);
```

**问题**: 异步测试不稳定
```typescript
// 解决方案：使用fake timers
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
```

**问题**: DOM查询失败
```typescript
// 解决方案：使用TestUtils验证
const element = TestUtils.verifyElement.exists('[data-testid="target"]');
```

### 2. 调试技巧

```typescript
// 调试DOM结构
console.log(container.innerHTML);

// 调试Mock调用
console.log(mockFunction.mock.calls);

// 调试状态
console.log(mockHook);
```

## 📚 参考资源

- [ThemeToggle测试案例](../src/components/__tests__/theme-toggle.test.tsx)
- [组件测试最佳实践](./component-testing-best-practices.md)
- [测试质量验证报告](./theme-toggle-test-report.md)

---

**指南版本**: v1.0.0  
**最后更新**: 2025年8月6日  
**适用项目**: Next.js 15 + React 19 + TypeScript 5.8
