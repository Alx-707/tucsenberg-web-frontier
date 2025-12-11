/**
 * @vitest-environment jsdom
 * Tests for LocaleDetectionDemo component
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocaleDetectionDemo } from '../locale-detection-demo';

// Mock dependencies
const {
  mockDetectClientLocale,
  mockGetStats,
  mockGetUserPreference,
  mockClearUserOverride,
} = vi.hoisted(() => ({
  mockDetectClientLocale: vi.fn(),
  mockGetStats: vi.fn(),
  mockGetUserPreference: vi.fn(),
  mockClearUserOverride: vi.fn(),
}));

vi.mock('@/lib/locale-detection', () => ({
  useClientLocaleDetection: vi.fn(() => ({
    detectClientLocale: mockDetectClientLocale,
  })),
}));

vi.mock('@/lib/locale-storage', () => ({
  useLocaleStorage: vi.fn(() => ({
    getStats: mockGetStats,
    getUserPreference: mockGetUserPreference,
    clearUserOverride: mockClearUserOverride,
  })),
}));

vi.mock('@/components/i18n/enhanced-locale-switcher', () => ({
  EnhancedLocaleSwitcher: ({
    showDetectionInfo,
  }: {
    showDetectionInfo?: boolean;
  }) => (
    <div
      data-testid='locale-switcher'
      data-show-detection-info={showDetectionInfo}
    >
      Locale Switcher
    </div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span
      data-testid='badge'
      data-variant={variant}
      className={className}
    >
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
  }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card'>{children}</div>
  ),
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <h3 className={className}>{children}</h3>,
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid='separator' />,
}));

function createMockDetection(
  overrides: Partial<{
    locale: string;
    source: string;
    confidence: number;
    details?: { browserLanguages?: string[] };
  }> = {},
) {
  return {
    locale: 'en',
    source: 'browser',
    confidence: 0.9,
    ...overrides,
  };
}

function createMockPreference(
  overrides: Partial<{
    locale: string;
    source: string;
    confidence: number;
    timestamp: number;
  }> = {},
) {
  return {
    locale: 'en',
    source: 'user',
    confidence: 1,
    timestamp: Date.now(),
    ...overrides,
  };
}

function createMockStats(
  overrides: Partial<{
    hasOverride: boolean;
    historyStats: { totalEntries: number };
  }> = {},
) {
  return {
    success: true,
    data: {
      hasOverride: false,
      historyStats: { totalEntries: 5 },
      ...overrides,
    },
  };
}

// Helper to render with act for microtask completion
async function renderWithMicrotask(ui: React.ReactElement) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(ui);
    // Wait for queueMicrotask in useEffect to complete
    await new Promise((resolve) => {
      queueMicrotask(resolve);
    });
  });
  return result!;
}

describe('LocaleDetectionDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock returns
    mockDetectClientLocale.mockReturnValue(createMockDetection());
    mockGetStats.mockReturnValue(createMockStats());
    mockGetUserPreference.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the card with title', async () => {
      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('智能语言检测演示')).toBeInTheDocument();
    });

    it('renders description', async () => {
      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText(/展示智能语言检测系统/)).toBeInTheDocument();
    });

    it('renders locale switcher with detection info', async () => {
      await renderWithMicrotask(<LocaleDetectionDemo />);

      const switcher = screen.getByTestId('locale-switcher');
      expect(switcher).toHaveAttribute('data-show-detection-info', 'true');
    });

    it('renders refresh button', async () => {
      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(
        screen.getByRole('button', { name: '刷新数据' }),
      ).toBeInTheDocument();
    });
  });

  describe('detection result', () => {
    it('displays detected locale', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ locale: 'zh' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      // Check for locale in badges - zh appears twice (detection and current)
      const zhBadges = screen.getAllByText('zh');
      expect(zhBadges.length).toBeGreaterThan(0);
    });

    it('displays detection source with icon', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ source: 'browser' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText(/🌐 browser/)).toBeInTheDocument();
    });

    it('displays geo source icon', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ source: 'geo' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText(/🌍 geo/)).toBeInTheDocument();
    });

    it('displays user source icon', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ source: 'user' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText(/👤 user/)).toBeInTheDocument();
    });

    it('displays default source icon for unknown source', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ source: 'unknown' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText(/⚙️ unknown/)).toBeInTheDocument();
    });

    it('displays confidence percentage', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ confidence: 0.85 }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('displays browser languages when available', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({
          details: { browserLanguages: ['en-US', 'zh-CN'] },
        }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText(/en-US, zh-CN/)).toBeInTheDocument();
    });
  });

  describe('confidence color coding', () => {
    it('shows green for high confidence (>80%)', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ confidence: 0.9 }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      const badges = screen.getAllByTestId('badge');
      const confidenceBadge = badges.find((b) => b.textContent === '90%');
      expect(confidenceBadge).toHaveClass('bg-green-100');
    });

    it('shows yellow for medium confidence (50-80%)', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ confidence: 0.6 }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      const badges = screen.getAllByTestId('badge');
      const confidenceBadge = badges.find((b) => b.textContent === '60%');
      expect(confidenceBadge).toHaveClass('bg-yellow-100');
    });

    it('shows red for low confidence (<50%)', async () => {
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ confidence: 0.3 }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      const badges = screen.getAllByTestId('badge');
      const confidenceBadge = badges.find((b) => b.textContent === '30%');
      expect(confidenceBadge).toHaveClass('bg-red-100');
    });
  });

  describe('storage stats', () => {
    it('shows preference status when has preference', async () => {
      mockGetUserPreference.mockReturnValue(createMockPreference());

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('有偏好设置:')).toBeInTheDocument();
      // Find badges with '是' - one for hasPreference
      const yesBadges = screen.getAllByText('是');
      expect(yesBadges.length).toBeGreaterThan(0);
    });

    it('shows no preference when null', async () => {
      mockGetUserPreference.mockReturnValue(null);

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('有偏好设置:')).toBeInTheDocument();
      // Find badges with '否' - one for hasPreference, one for hasOverride
      const noBadges = screen.getAllByText('否');
      expect(noBadges.length).toBe(2);
    });

    it('shows override status when user_override source', async () => {
      mockGetUserPreference.mockReturnValue(
        createMockPreference({ source: 'user_override' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('有用户覆盖:')).toBeInTheDocument();
      // Both '是' badges - one for hasPreference, one for hasOverride
      const yesBadges = screen.getAllByText('是');
      expect(yesBadges.length).toBe(2);
    });

    it('shows detection count', async () => {
      mockGetStats.mockReturnValue(
        createMockStats({
          historyStats: { totalEntries: 42 },
        }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('检测次数:')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('shows current locale', async () => {
      mockGetUserPreference.mockReturnValue(
        createMockPreference({ locale: 'zh' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('当前语言:')).toBeInTheDocument();
    });
  });

  describe('clear override button', () => {
    it('shows clear button when override exists via preference source', async () => {
      mockGetUserPreference.mockReturnValue(
        createMockPreference({ source: 'user_override' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(
        screen.getByRole('button', { name: '清除用户覆盖' }),
      ).toBeInTheDocument();
    });

    it('shows clear button when override exists via stats', async () => {
      mockGetStats.mockReturnValue(createMockStats({ hasOverride: true }));

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(
        screen.getByRole('button', { name: '清除用户覆盖' }),
      ).toBeInTheDocument();
    });

    it('calls clearUserOverride when clear button clicked', async () => {
      mockGetUserPreference.mockReturnValue(
        createMockPreference({ source: 'user_override' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '清除用户覆盖' }));
      });

      expect(mockClearUserOverride).toHaveBeenCalled();
    });

    it('refreshes data after clearing override', async () => {
      mockGetUserPreference.mockReturnValue(
        createMockPreference({ source: 'user_override' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      // Clear call counts before clicking
      mockGetStats.mockClear();
      mockDetectClientLocale.mockClear();
      mockGetUserPreference.mockClear();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '清除用户覆盖' }));
      });

      expect(mockGetStats).toHaveBeenCalled();
      expect(mockDetectClientLocale).toHaveBeenCalled();
      expect(mockGetUserPreference).toHaveBeenCalled();
    });
  });

  describe('preference details', () => {
    it('shows preference details when preference exists', async () => {
      mockGetUserPreference.mockReturnValue(
        createMockPreference({
          locale: 'zh',
          source: 'user',
          confidence: 1,
          timestamp: 1700000000000,
        }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('偏好详情')).toBeInTheDocument();
      expect(screen.getByText(/语言: zh/)).toBeInTheDocument();
      expect(screen.getByText(/来源: user/)).toBeInTheDocument();
      expect(screen.getByText(/置信度: 100%/)).toBeInTheDocument();
    });

    it('does not show preference details when no preference', async () => {
      mockGetUserPreference.mockReturnValue(null);

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.queryByText('偏好详情')).not.toBeInTheDocument();
    });
  });

  describe('refresh functionality', () => {
    it('calls all data functions when refresh clicked', async () => {
      await renderWithMicrotask(<LocaleDetectionDemo />);

      // Clear initial calls
      mockGetStats.mockClear();
      mockDetectClientLocale.mockClear();
      mockGetUserPreference.mockClear();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: '刷新数据' }));
      });

      expect(mockGetStats).toHaveBeenCalled();
      expect(mockDetectClientLocale).toHaveBeenCalled();
      expect(mockGetUserPreference).toHaveBeenCalled();
    });
  });

  describe('browser info', () => {
    it('displays browser info section', async () => {
      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('浏览器信息')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles null detection gracefully', async () => {
      mockDetectClientLocale.mockReturnValue(null);

      await renderWithMicrotask(<LocaleDetectionDemo />);

      // Should still render without crashing
      expect(screen.getByText('智能语言检测演示')).toBeInTheDocument();
    });

    it('handles failed stats gracefully', async () => {
      mockGetStats.mockReturnValue({ success: false, data: null });

      await renderWithMicrotask(<LocaleDetectionDemo />);

      // Should still render without crashing
      expect(screen.getByText('智能语言检测演示')).toBeInTheDocument();
    });

    it('falls back to detection locale when no preference', async () => {
      mockGetUserPreference.mockReturnValue(null);
      mockDetectClientLocale.mockReturnValue(
        createMockDetection({ locale: 'en' }),
      );

      await renderWithMicrotask(<LocaleDetectionDemo />);

      expect(screen.getByText('当前语言:')).toBeInTheDocument();
    });
  });
});
