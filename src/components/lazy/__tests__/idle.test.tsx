/**
 * @vitest-environment jsdom
 * Tests for Idle component
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Idle } from '../idle';

// Mock useIntersectionObserver hook
const mockRef = { current: null };
const mockUseIntersectionObserver = vi.hoisted(() =>
  vi.fn(() => ({
    ref: mockRef,
    isVisible: false,
    hasBeenVisible: false,
  })),
);

vi.mock('@/hooks/use-intersection-observer', () => ({
  useIntersectionObserver: mockUseIntersectionObserver,
}));

describe('Idle', () => {
  let mockRequestIdleCallback: ReturnType<typeof vi.fn>;
  let mockCancelIdleCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock requestIdleCallback
    mockRequestIdleCallback = vi.fn((cb: () => void) => {
      const id = setTimeout(cb, 0);
      return id as unknown as number;
    });
    mockCancelIdleCallback = vi.fn((id: number) => {
      clearTimeout(id);
    });

    Object.defineProperty(window, 'requestIdleCallback', {
      value: mockRequestIdleCallback,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'cancelIdleCallback', {
      value: mockCancelIdleCallback,
      writable: true,
      configurable: true,
    });

    // Reset mock
    mockUseIntersectionObserver.mockReturnValue({
      ref: mockRef,
      isVisible: false,
      hasBeenVisible: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('idle strategy', () => {
    it('renders children after requestIdleCallback fires', async () => {
      render(
        <Idle strategy='idle'>
          <span>Idle Content</span>
        </Idle>,
      );

      // Initially not rendered
      expect(screen.queryByText('Idle Content')).not.toBeInTheDocument();

      // Fire idle callback
      await act(async () => {
        vi.runAllTimers();
      });

      expect(screen.getByText('Idle Content')).toBeInTheDocument();
    });

    it('uses idle strategy by default', async () => {
      render(
        <Idle>
          <span>Default Strategy</span>
        </Idle>,
      );

      expect(mockRequestIdleCallback).toHaveBeenCalled();

      await act(async () => {
        vi.runAllTimers();
      });

      expect(screen.getByText('Default Strategy')).toBeInTheDocument();
    });

    it('cleans up idle callback on unmount', () => {
      const { unmount } = render(
        <Idle strategy='idle'>
          <span>Content</span>
        </Idle>,
      );

      unmount();

      expect(mockCancelIdleCallback).toHaveBeenCalled();
    });
  });

  describe('timeout strategy', () => {
    it('renders children after timeout', async () => {
      render(
        <Idle
          strategy='timeout'
          timeoutMs={500}
        >
          <span>Timeout Content</span>
        </Idle>,
      );

      // Initially not rendered
      expect(screen.queryByText('Timeout Content')).not.toBeInTheDocument();

      // Advance by timeout
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByText('Timeout Content')).toBeInTheDocument();
    });

    it('uses default timeout of 1200ms', async () => {
      render(
        <Idle strategy='timeout'>
          <span>Default Timeout</span>
        </Idle>,
      );

      // Not rendered before timeout
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByText('Default Timeout')).not.toBeInTheDocument();

      // Rendered after timeout
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByText('Default Timeout')).toBeInTheDocument();
    });

    it('cleans up timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = render(
        <Idle
          strategy='timeout'
          timeoutMs={500}
        >
          <span>Content</span>
        </Idle>,
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('visible strategy', () => {
    it('renders children when visible', () => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: mockRef,
        isVisible: true,
        hasBeenVisible: true,
      });

      render(
        <Idle strategy='visible'>
          <span>Visible Content</span>
        </Idle>,
      );

      expect(screen.getByText('Visible Content')).toBeInTheDocument();
    });

    it('does not render children when not visible', () => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: mockRef,
        isVisible: false,
        hasBeenVisible: false,
      });

      render(
        <Idle strategy='visible'>
          <span>Visible Content</span>
        </Idle>,
      );

      expect(screen.queryByText('Visible Content')).not.toBeInTheDocument();
    });

    it('renders children if hasBeenVisible', () => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: mockRef,
        isVisible: false,
        hasBeenVisible: true,
      });

      render(
        <Idle strategy='visible'>
          <span>Previously Visible</span>
        </Idle>,
      );

      expect(screen.getByText('Previously Visible')).toBeInTheDocument();
    });

    it('wraps content in span with ref', () => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: mockRef,
        isVisible: true,
        hasBeenVisible: true,
      });

      const { container } = render(
        <Idle strategy='visible'>
          <span>Content</span>
        </Idle>,
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('SPAN');
      expect(wrapper.style.display).toBe('inline-block');
    });
  });

  describe('intersection observer options', () => {
    it('passes rootMargin to useIntersectionObserver', () => {
      render(
        <Idle
          strategy='visible'
          rootMargin='100px 0px'
        >
          <span>Content</span>
        </Idle>,
      );

      expect(mockUseIntersectionObserver).toHaveBeenCalledWith(
        expect.objectContaining({
          rootMargin: '100px 0px',
        }),
      );
    });

    it('passes threshold to useIntersectionObserver', () => {
      render(
        <Idle
          strategy='visible'
          threshold={0.5}
        >
          <span>Content</span>
        </Idle>,
      );

      expect(mockUseIntersectionObserver).toHaveBeenCalledWith(
        expect.objectContaining({
          threshold: 0.5,
        }),
      );
    });

    it('passes triggerOnce to useIntersectionObserver', () => {
      render(
        <Idle
          strategy='visible'
          triggerOnce={false}
        >
          <span>Content</span>
        </Idle>,
      );

      expect(mockUseIntersectionObserver).toHaveBeenCalledWith(
        expect.objectContaining({
          triggerOnce: false,
        }),
      );
    });

    it('uses default values', () => {
      render(
        <Idle strategy='visible'>
          <span>Content</span>
        </Idle>,
      );

      expect(mockUseIntersectionObserver).toHaveBeenCalledWith({
        rootMargin: '300px 0px 300px 0px',
        threshold: 0,
        triggerOnce: true,
      });
    });
  });

  describe('fallback when requestIdleCallback unavailable', () => {
    it('falls back to not rendering immediately when requestIdleCallback not available', async () => {
      // Remove requestIdleCallback from window completely
      // @ts-expect-error - intentionally deleting for test
      delete (window as Record<string, unknown>).requestIdleCallback;

      render(
        <Idle strategy='idle'>
          <span>Fallback Content</span>
        </Idle>,
      );

      // Without requestIdleCallback, idle strategy won't set ready
      // This tests that the component handles missing requestIdleCallback gracefully
      expect(screen.queryByText('Fallback Content')).not.toBeInTheDocument();
    });
  });
});
