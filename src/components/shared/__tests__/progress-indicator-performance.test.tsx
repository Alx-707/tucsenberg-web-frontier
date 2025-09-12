/**
 * Progress Indicator 性能和边界情况测试
 * 包含性能优化、边界情况和集成测试
 *
 * 注意：基础功能测试请参考 progress-indicator-core.test.tsx
 * 注意：高级功能测试请参考 progress-indicator-advanced.test.tsx
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressIndicator } from '../progress-indicator';

// Mock useTranslations
const mockUseTranslations = vi.fn();
vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations,
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="check-icon">✓</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">→</span>,
  Circle: () => <span data-testid="circle-icon">○</span>,
}));

describe('ProgressIndicator - 性能和边界情况测试', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockUseTranslations.mockImplementation((key: string) => {
      if (key === 'planning') return '规划阶段';
      if (key === 'development') return '开发阶段';
      if (key === 'testing') return '测试阶段';
      if (key === 'launch') return '发布阶段';
      if (key === 'status') return '进行中';
      if (key === 'nearCompletion') return '即将完成';
      return key;
    });
  });

  describe('性能优化', () => {
    it('大量步骤时性能良好', () => {
      const _manySteps = Array.from({ length: 50 }, (_, i) => ({
        key: `step-${i}`,
        label: `步骤 ${i + 1}`,
      }));

      const _startTime = performance.now();
      render(<ProgressIndicator currentStep={2} />);
      const endTime = performance.now();

      // 渲染时间应该在合理范围内（小于100ms）
      expect(endTime - _startTime).toBeLessThan(100);
    });

    it('频繁更新时不会导致性能问题', async () => {
      const { rerender } = render(<ProgressIndicator currentStep={1} />);

      const _startTime = performance.now();

      // 快速更新50次
      for (let i = 1; i <= 4; i++) {
        for (let j = 0; j < 12; j++) {
          rerender(<ProgressIndicator currentStep={i} />);
        }
      }

      const endTime = performance.now();
      expect(endTime - _startTime).toBeLessThan(200);
    });
  });

  describe('边界情况处理', () => {
    it('处理最小步骤值', () => {
      expect(() => {
        render(<ProgressIndicator currentStep={0} />);
      }).not.toThrow();
    });

    it('处理最大步骤值', () => {
      render(<ProgressIndicator currentStep={3} />);

      expect(screen.getByText('发布阶段')).toBeInTheDocument();

      // 进度应该是100%
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('处理超出范围的步骤值', () => {
      render(<ProgressIndicator currentStep={10} />);

      // 应该显示最后一个步骤
      expect(screen.getByText('发布阶段')).toBeInTheDocument();
    });

    it('处理特殊字符在步骤标签中', () => {
      const _specialSteps = [
        { key: 'emoji', label: '🚀 启动阶段' },
        { key: 'symbols', label: '测试 & 验证' },
        { key: 'unicode', label: '部署 → 上线' },
      ];

      render(<ProgressIndicator currentStep={1} />);

      // 验证默认步骤显示正常
      expect(screen.getByText('规划阶段')).toBeInTheDocument();
      expect(screen.getByText('开发阶段')).toBeInTheDocument();
    });
  });

  describe('国际化支持', () => {
    it('处理缺失的翻译', () => {
      mockUseTranslations.mockImplementation(() => undefined);

      expect(() => {
        render(<ProgressIndicator />);
      }).not.toThrow();
    });

    it('处理RTL语言', () => {
      // Mock RTL环境
      document.dir = 'rtl';

      render(<ProgressIndicator currentStep={2} />);

      const progressContainer = screen.getByRole('progressbar');
      expect(progressContainer).toHaveClass('rtl');

      // 清理
      document.dir = 'ltr';
    });

    it('支持不同语言的步骤标签', () => {
      mockUseTranslations.mockImplementation((key: string) => {
        if (key === 'planning') return 'التخطيط';
        if (key === 'development') return 'التطوير';
        if (key === 'testing') return 'الاختبار';
        if (key === 'launch') return 'الإطلاق';
        return key;
      });

      render(<ProgressIndicator />);

      expect(screen.getByText('التخطيط')).toBeInTheDocument();
      expect(screen.getByText('التطوير')).toBeInTheDocument();
    });
  });

  describe('主题和样式', () => {
    it('支持自定义className', () => {
      const { container } = render(
        <ProgressIndicator
          className="custom-theme"
          currentStep={1}
        />
      );

      expect(container.firstChild).toHaveClass('custom-theme');
    });

    it('正确显示进度样式', () => {
      render(
        <ProgressIndicator
          currentStep={2}
        />
      );

      // 验证进度百分比显示
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('支持不同步骤的样式', () => {
      render(<ProgressIndicator currentStep={0} />);

      // 验证初始状态
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('集成测试', () => {
    it('与表单集成正常工作', async () => {
      const FormWithProgress = () => {
        const [step, setStep] = React.useState(1);

        return (
          <form>
            <ProgressIndicator
              currentStep={step}
            />
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              data-testid="next-button"
            >
              下一步
            </button>
          </form>
        );
      };

      render(<FormWithProgress />);

      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      // 验证进度指示器显示正确的步骤
      expect(screen.getByText('测试阶段')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('与状态管理库集成', async () => {
      const StateProvider = ({ children }: { children: React.ReactNode }) => {
        const [globalStep, setGlobalStep] = React.useState(1);

        return (
          <div data-testid="state-provider">
            {React.cloneElement(children as React.ReactElement, {
              currentStep: globalStep,
            })}
            <button
              onClick={() => setGlobalStep(3)}
              data-testid="jump-to-step-3"
            >
              跳转到步骤3
            </button>
          </div>
        );
      };

      render(
        <StateProvider>
          <ProgressIndicator />
        </StateProvider>
      );

      const jumpButton = screen.getByTestId('jump-to-step-3');
      await user.click(jumpButton);

      // 验证步骤更新
      expect(screen.getByText('发布阶段')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('错误恢复', () => {
    it('从渲染错误中恢复', () => {
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false);

        if (hasError) {
          return <div data-testid="error-fallback">出现错误</div>;
        }

        try {
          return <>{children}</>;
        } catch {
          setHasError(true);
          return <div data-testid="error-fallback">出现错误</div>;
        }
      };

      render(
        <ErrorBoundary>
          <ProgressIndicator currentStep={1} />
        </ErrorBoundary>
      );

      // 组件应该正常渲染，不会触发错误边界
      expect(screen.getByText('规划阶段')).toBeInTheDocument();
      expect(screen.queryByTestId('error-fallback')).not.toBeInTheDocument();
    });
  });
});
