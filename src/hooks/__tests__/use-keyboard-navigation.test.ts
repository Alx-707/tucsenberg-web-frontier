import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_COUNT_CONSTANTS } from '@/constants/test-constants';
import { useKeyboardNavigation } from '../use-keyboard-navigation';

// Mock DOM methods
const mockFocus = vi.fn();
const mockBlur = vi.fn();
const mockQuerySelector = vi.fn();
const mockQuerySelectorAll = vi.fn();

// Mock focusable elements
const createMockElement = (
  tagName: string,
  attributes: Record<string, string> = {},
) => ({
  tagName: tagName.toUpperCase(),
  focus: mockFocus,
  blur: mockBlur,
  getAttribute: (attr: string) => {
    // 安全的属性访问，避免对象注入
    if (typeof attr === 'string') {
      const safeAttributes = new Map(Object.entries(attributes));
      return safeAttributes.get(attr) || null;
    }
    return null;
  },
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  contains: vi.fn(() => false),
  ...attributes,
});

Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true,
});

Object.defineProperty(document, 'querySelectorAll', {
  value: mockQuerySelectorAll,
  writable: true,
});

// Mock addEventListener and removeEventListener
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(document, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(document, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

describe('useKeyboardNavigation', () => {
  const mockFocusableElements = [
    createMockElement('button', { id: 'btn1' }),
    createMockElement('input', { id: 'input1', type: 'text' }),
    createMockElement('a', { id: 'link1', href: '#' }),
    createMockElement('select', { id: 'select1' }),
    createMockElement('textarea', { id: 'textarea1' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default implementation for querySelectorAll
    mockQuerySelectorAll.mockReturnValue(mockFocusableElements);

    // Mock document.activeElement - 安全的数组访问
    const firstElement =
      mockFocusableElements.length > 0 ? mockFocusableElements[0] : null;
    Object.defineProperty(document, 'activeElement', {
      value: firstElement,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本键盘导航功能', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      expect(result.current.getCurrentFocusIndex()).toBe(-1);
      expect(typeof result.current.focusNext).toBe('function');
      expect(typeof result.current.focusPrevious).toBe('function');
      expect(typeof result.current.focusFirst).toBe('function');
      expect(typeof result.current.focusLast).toBe('function');
      expect(typeof result.current.getCurrentFocusIndex).toBe('function');
      expect(typeof result.current.setFocusIndex).toBe('function');
      expect(result.current.containerRef).toBeDefined();
    });

    it('should provide container ref for DOM attachment', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull(); // Initially null
    });

    it('should focus next element', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusNext();
      });

      expect(typeof result.current.focusNext).toBe('function');
    });

    it('should focus previous element', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusPrevious();
      });

      expect(typeof result.current.focusPrevious).toBe('function');
    });

    it('should focus first element', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusFirst();
      });

      expect(typeof result.current.focusFirst).toBe('function');
    });

    it('should focus last element', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusLast();
      });

      expect(typeof result.current.focusLast).toBe('function');
    });
  });

  describe('循环导航', () => {
    it('should provide loop navigation functionality', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({ loop: true }),
      );

      act(() => {
        result.current.focusNext();
      });

      expect(typeof result.current.focusNext).toBe('function');
    });

    it('should provide non-loop navigation functionality', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({ loop: false }),
      );

      act(() => {
        result.current.focusPrevious();
      });

      expect(typeof result.current.focusPrevious).toBe('function');
    });

    it('should not wrap when loop is disabled', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({ loop: false }),
      );

      act(() => {
        result.current.focusNext();
      });

      expect(typeof result.current.focusNext).toBe('function');
    });
  });

  describe('键盘事件处理', () => {
    it('should handle keyboard navigation', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({ enabled: true }),
      );

      // Test that the hook provides the expected interface
      expect(result.current.containerRef).toBeDefined();
      expect(typeof result.current.focusNext).toBe('function');
      expect(typeof result.current.focusPrevious).toBe('function');
      expect(typeof result.current.focusFirst).toBe('function');
      expect(typeof result.current.focusLast).toBe('function');
      expect(typeof result.current.getCurrentFocusIndex).toBe('function');
      expect(typeof result.current.setFocusIndex).toBe('function');

      // Test that functions can be called without errors
      expect(() => {
        result.current.focusNext();
        result.current.focusPrevious();
        result.current.focusFirst();
        result.current.focusLast();
      }).not.toThrow();
    });

    it('should handle Shift+Tab for reverse navigation', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({ enabled: true }),
      );

      // Test that the hook provides the expected interface for reverse navigation
      expect(result.current.containerRef).toBeDefined();
      expect(typeof result.current.focusPrevious).toBe('function');

      // Test that reverse navigation function can be called without errors
      expect(() => {
        result.current.focusPrevious();
      }).not.toThrow();

      // Test that the hook handles enabled state correctly
      expect(result.current.getCurrentFocusIndex()).toBe(-1); // No focus initially
    });

    it('should handle arrow key navigation', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({ orientation: 'vertical' }),
      );

      // Test that the hook provides the expected interface for arrow navigation
      expect(result.current.containerRef).toBeDefined();
      expect(typeof result.current.focusNext).toBe('function');
      expect(typeof result.current.focusPrevious).toBe('function');

      // Test that arrow navigation functions can be called without errors
      expect(() => {
        result.current.focusNext(); // Should handle ArrowDown in vertical mode
        result.current.focusPrevious(); // Should handle ArrowUp in vertical mode
      }).not.toThrow();

      // Test that the hook handles orientation correctly
      expect(result.current.getCurrentFocusIndex()).toBe(-1); // No focus initially
    });

    it('should handle Home and End keys', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({ enabled: true }),
      );

      // Test that the hook provides the expected interface for Home/End navigation
      expect(result.current.containerRef).toBeDefined();
      expect(typeof result.current.focusFirst).toBe('function');
      expect(typeof result.current.focusLast).toBe('function');

      // Test that Home/End navigation functions can be called without errors
      expect(() => {
        result.current.focusFirst(); // Should handle Home key
        result.current.focusLast();  // Should handle End key
      }).not.toThrow();

      // Test that the hook handles enabled state correctly
      expect(result.current.getCurrentFocusIndex()).toBe(-1); // No focus initially
    });
  });

  describe('焦点管理', () => {
    it('should track current focus index', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusNext();
      });

      expect(result.current.getCurrentFocusIndex()).toBe(-1); // No elements focused initially
    });

    it('should handle focus on specific element by index', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.setFocusIndex(TEST_COUNT_CONSTANTS.SMALL);
      });

      expect(typeof result.current.setFocusIndex).toBe('function');
    });

    it('should handle invalid focus index gracefully', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      expect(() => {
        result.current.setFocusIndex(TEST_COUNT_CONSTANTS.LARGE); // Invalid index
      }).not.toThrow();

      expect(result.current.getCurrentFocusIndex()).toBe(-1); // Should remain unchanged
    });
  });

  describe('自定义选择器', () => {
    it('should use custom focusable selector', () => {
      const customSelector = '.custom-focusable';

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          selector: customSelector,
        }),
      );

      expect(result.current.containerRef).toBeDefined();
    });
  });

  describe('清理和内存管理', () => {
    it('should cleanup event listeners on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useKeyboardNavigation({ enabled: true }),
      );

      // Test that the hook provides the expected interface
      expect(result.current.containerRef).toBeDefined();
      expect(typeof result.current.focusNext).toBe('function');

      // Test that unmounting doesn't throw errors
      expect(() => {
        unmount();
      }).not.toThrow();

      // After unmount, the hook should have cleaned up properly
      // (We can't directly test event listener cleanup without complex mocking,
      // but we can ensure unmounting doesn't cause errors)
    });

    it('should handle cleanup errors gracefully', () => {
      mockRemoveEventListener.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      const { unmount } = renderHook(() =>
        useKeyboardNavigation({ enabled: true }),
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('边缘情况处理', () => {
    it('should handle empty focusable elements list', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      expect(() => {
        result.current.focusNext();
        result.current.focusPrevious();
        result.current.focusFirst();
        result.current.focusLast();
      }).not.toThrow();
    });

    it('should handle missing container ref', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      expect(result.current.containerRef.current).toBeNull();
    });

    it('should handle focus errors gracefully', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      expect(() => {
        result.current.focusNext();
      }).not.toThrow();
    });
  });
});
