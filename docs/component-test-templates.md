# 组件测试模板

## 📋 测试模板概述

本文档提供标准化的组件测试模板，确保测试的一致性和完整性。

## 🎯 测试覆盖率目标

- **核心UI组件**: 90%覆盖率
- **布局组件**: 85%覆盖率  
- **业务组件**: 80%覆盖率
- **工具组件**: 75%覆盖率
- **展示组件**: 60%覆盖率

## 📝 通用测试结构

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../ComponentName';

// Mock dependencies if needed
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without errors', () => {
      render(<ComponentName />);
      expect(screen.getByRole('...')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const customClass = 'custom-class';
      render(<ComponentName className={customClass} />);
      expect(screen.getByRole('...')).toHaveClass(customClass);
    });
  });

  describe('Props and State', () => {
    // Props testing
  });

  describe('User Interactions', () => {
    // Event handling testing
  });

  describe('Accessibility', () => {
    // A11y testing
  });

  describe('Edge Cases', () => {
    // Error handling and edge cases
  });
});
```

## 🔧 核心UI组件测试模板

### Button组件测试模板

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render button with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary');
    });

    it('should render with different variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];
      variants.forEach(variant => {
        render(<Button variant={variant as any}>Test</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should render with different sizes', () => {
      const sizes = ['default', 'sm', 'lg', 'icon'];
      sizes.forEach(size => {
        render(<Button size={size as any}>Test</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should support keyboard navigation', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard('{Space}');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle asChild prop correctly', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      render(<Button disabled>Loading...</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
```

### Input组件测试模板

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render input with default props', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with different types', () => {
      const types = ['text', 'email', 'password', 'number'];
      types.forEach(type => {
        render(<Input type={type} data-testid={`input-${type}`} />);
        expect(screen.getByTestId(`input-${type}`)).toHaveAttribute('type', type);
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test value');
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('test value');
    });

    it('should handle focus and blur events', async () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation States', () => {
    it('should handle disabled state', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should handle readonly state', () => {
      render(<Input readOnly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('should handle required state', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Input 
          aria-label="Custom input"
          aria-describedby="help-text"
          aria-invalid="true"
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Custom input');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
```

## 🏗️ 布局组件测试模板

### Header组件测试模板

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../header';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

describe('Header Component', () => {
  describe('Basic Rendering', () => {
    it('should render header with navigation', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render logo', () => {
      render(<Header />);
      expect(screen.getByRole('link', { name: /logo/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render navigation items', () => {
      render(<Header />);
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    });

    it('should highlight active navigation item', () => {
      // Mock usePathname to return specific path
      render(<Header />);
      // Test active state logic
    });
  });

  describe('Responsive Behavior', () => {
    it('should show mobile menu button on small screens', () => {
      // Test responsive behavior
    });

    it('should hide desktop navigation on mobile', () => {
      // Test mobile navigation
    });
  });

  describe('Accessibility', () => {
    it('should have proper landmark roles', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      // Test keyboard navigation
    });
  });
});
```

## 💼 业务组件测试模板

### ContactForm组件测试模板

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../contact-form';

// Mock form submission
const mockSubmit = vi.fn();
vi.mock('../hooks/useContactForm', () => ({
  useContactForm: () => ({
    handleSubmit: mockSubmit,
    isSubmitting: false,
    errors: {},
  }),
}));

describe('ContactForm Component', () => {
  beforeEach(() => {
    mockSubmit.mockClear();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<ContactForm />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should render with proper form structure', () => {
      render(<ContactForm />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Test message');
      
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Test message',
        });
      });
    });

    it('should show loading state during submission', async () => {
      // Mock loading state
      render(<ContactForm />);
      // Test loading state
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<ContactForm />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    it('should associate error messages with fields', async () => {
      // Test ARIA error associations
    });
  });
});
```

## 🛠️ 工具组件测试模板

### AnimatedCounter组件测试模板

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatedCounter } from '../animated-counter';

describe('AnimatedCounter Component', () => {
  describe('Basic Rendering', () => {
    it('should render with initial value', () => {
      render(<AnimatedCounter value={100} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should render with custom format', () => {
      render(<AnimatedCounter value={1000} format={(n) => `$${n.toLocaleString()}`} />);
      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });
  });

  describe('Animation Behavior', () => {
    it('should animate from 0 to target value', async () => {
      render(<AnimatedCounter value={100} duration={100} />);
      
      // Should start from 0
      expect(screen.getByText('0')).toBeInTheDocument();
      
      // Should reach target value after animation
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should animate value changes', async () => {
      const { rerender } = render(<AnimatedCounter value={50} duration={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
      });
      
      rerender(<AnimatedCounter value={100} duration={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Performance', () => {
    it('should handle large numbers efficiently', async () => {
      render(<AnimatedCounter value={1000000} duration={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('1000000')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should cleanup animation on unmount', () => {
      const { unmount } = render(<AnimatedCounter value={100} />);
      unmount();
      // Should not cause memory leaks
    });
  });
});
```

## 📊 测试质量检查清单

### 每个组件测试应包含：

- [ ] **基础渲染测试** - 组件能正常渲染
- [ ] **属性传递测试** - 所有props正确传递和应用
- [ ] **交互行为测试** - 用户交互正确响应
- [ ] **状态管理测试** - 内部状态正确更新
- [ ] **错误处理测试** - 边界条件和错误情况
- [ ] **可访问性测试** - ARIA属性和键盘导航
- [ ] **响应式测试** - 不同屏幕尺寸的行为
- [ ] **性能测试** - 渲染性能和内存泄漏

### 测试命名规范：

- 使用描述性的测试名称
- 遵循 "should + 动作 + 预期结果" 格式
- 按功能分组测试用例
- 使用一致的describe结构

### Mock策略：

- 只Mock必要的外部依赖
- 使用vi.mock()进行模块级Mock
- 在beforeEach中清理Mock状态
- 为异步操作提供合适的等待时间

---

**下一步**: 使用这些模板为低覆盖率组件创建或增强测试用例。
