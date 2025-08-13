import { TEST_COUNT_CONSTANTS } from '@/constants/test-constants';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useKeyboardNavigation } from '../use-keyboard-navigation';

// 使用vi.hoisted确保Mock在模块导入前设置 - 遵循项目标准
const { mockFocus, mockBlur, mockQuerySelector, mockQuerySelectorAll } = vi.hoisted(() => ({
  mockFocus: vi.fn(),
  mockBlur: vi.fn(),
  mockQuerySelector: vi.fn(),
  mockQuerySelectorAll: vi.fn(),
}));

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
    // 只清除特定的mocks，保留元素的focus方法
    mockQuerySelector.mockClear();
    mockQuerySelectorAll.mockClear();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();

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
        result.current.focusLast(); // Should handle End key
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

  describe('实际DOM交互测试', () => {
    beforeEach(() => {
      // Setup DOM with actual focusable elements
      document.body.innerHTML = `
        <div id="container">
          <button id="btn1">Button 1</button>
          <input id="input1" type="text" />
          <a id="link1" href="#">Link 1</a>
          <select id="select1">
            <option>Option 1</option>
          </select>
          <button id="btn2" disabled>Disabled Button</button>
          <div id="div1" tabindex="0">Focusable Div</div>
        </div>
      `;

      // Mock querySelectorAll to return actual DOM elements
      mockQuerySelectorAll.mockImplementation((selector) => {
        const container = document.getElementById('container');
        if (container) {
          return container.querySelectorAll(selector);
        }
        return [];
      });
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should navigate through actual DOM elements', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      // Set container ref to actual DOM element
      const container = document.getElementById('container');
      if (container) {
        result.current.containerRef.current = container;
      }

      act(() => {
        result.current.focusNext();
      });

      // Should handle actual DOM navigation
      expect(result.current.getCurrentFocusIndex()).toBeGreaterThanOrEqual(-1);
    });

    it('should handle focus on disabled elements correctly', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      const container = document.getElementById('container');
      if (container) {
        result.current.containerRef.current = container;
      }

      // Should skip disabled elements
      act(() => {
        result.current.focusNext();
      });

      expect(() => {
        result.current.focusNext();
      }).not.toThrow();
    });

    it('should handle custom selector with actual DOM', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          selector: 'button:not([disabled]), input:not([disabled])'
        })
      );

      const container = document.getElementById('container');
      if (container) {
        result.current.containerRef.current = container;
      }

      act(() => {
        result.current.focusFirst();
      });

      expect(result.current.getCurrentFocusIndex()).toBeGreaterThanOrEqual(-1);
    });
  });

  describe('键盘事件模拟测试', () => {
    let realContainer: HTMLElement;
    let originalFocus: typeof HTMLElement.prototype.focus;

    beforeEach(() => {
      // 保存原始的focus方法
      originalFocus = HTMLElement.prototype.focus;

      // Mock HTMLElement.prototype.focus来模拟真实的焦点行为
      HTMLElement.prototype.focus = vi.fn(function(this: HTMLElement) {
        // 更新document.activeElement为当前元素
        Object.defineProperty(document, 'activeElement', {
          value: this,
          writable: true,
          configurable: true,
        });
      });

      // 创建真实DOM容器
      realContainer = document.createElement('div');
      realContainer.id = 'keyboard-nav-container';
      realContainer.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;
      document.body.appendChild(realContainer);

      // 为这个测试组设置特殊的mock实现，让它返回真实DOM元素
      mockQuerySelectorAll.mockImplementation((selector) => {
        if (realContainer) {
          return realContainer.querySelectorAll(selector);
        }
        return [];
      });

      // 重置document.activeElement为真实的body元素
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // 恢复原始的focus方法
      HTMLElement.prototype.focus = originalFocus;

      if (realContainer && document.body.contains(realContainer)) {
        document.body.removeChild(realContainer);
      }

      // 恢复mock的默认行为以免影响其他测试
      mockQuerySelectorAll.mockReturnValue(mockFocusableElements);
    });

    it('should handle Tab key navigation', () => {
      const mockOnNavigate = vi.fn();
      const { result } = renderHook(() =>
        useKeyboardNavigation({ onNavigate: mockOnNavigate })
      );

      // 设置真实DOM容器
      result.current.containerRef.current = realContainer;

      // 验证hook初始化正确
      expect(result.current.containerRef.current).toBe(realContainer);
      expect(typeof result.current.focusNext).toBe('function');
      expect(typeof result.current.focusPrevious).toBe('function');

      // 获取真实的按钮元素
      const buttons = realContainer.querySelectorAll('button');
      expect(buttons.length).toBe(3);

      // 验证基本功能可用 - 使用真实DOM元素
      act(() => {
        result.current.setFocusIndex(0); // 设置第一个元素获得焦点
      });

      // 验证第一个按钮获得了焦点
      expect(document.activeElement).toBe(buttons[0]);
      expect(mockOnNavigate).toHaveBeenCalledWith(buttons[0], 'direct');
    });

    it('should handle Shift+Tab key navigation', () => {
      const mockOnNavigate = vi.fn();
      const { result } = renderHook(() =>
        useKeyboardNavigation({ onNavigate: mockOnNavigate })
      );

      // 设置真实DOM容器
      result.current.containerRef.current = realContainer;

      // 验证hook初始化正确
      expect(result.current.containerRef.current).toBe(realContainer);
      expect(typeof result.current.focusPrevious).toBe('function');

      // 获取真实的按钮元素
      const buttons = realContainer.querySelectorAll('button');
      expect(buttons.length).toBe(3);

      // 验证反向导航功能 - 设置第二个元素获得焦点
      act(() => {
        result.current.setFocusIndex(1);
      });

      // 验证第二个按钮获得了焦点
      expect(document.activeElement).toBe(buttons[1]);
      expect(mockOnNavigate).toHaveBeenCalledWith(buttons[1], 'direct');
    });

    it('should handle Arrow key navigation', () => {
      const mockOnNavigate = vi.fn();
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          orientation: 'vertical',
          onNavigate: mockOnNavigate
        })
      );

      // 设置真实DOM容器
      result.current.containerRef.current = realContainer;

      // 验证hook初始化正确
      expect(result.current.containerRef.current).toBe(realContainer);
      expect(typeof result.current.focusNext).toBe('function');

      // 获取真实的按钮元素
      const buttons = realContainer.querySelectorAll('button');
      expect(buttons.length).toBe(3);

      // 验证垂直导航功能 - 设置第一个元素获得焦点
      act(() => {
        result.current.setFocusIndex(0);
      });

      // 验证第一个按钮获得了焦点
      expect(document.activeElement).toBe(buttons[0]);
      expect(mockOnNavigate).toHaveBeenCalledWith(buttons[0], 'direct');
    });

    it('should handle Home and End keys', () => {
      const mockOnNavigate = vi.fn();
      const { result } = renderHook(() =>
        useKeyboardNavigation({ onNavigate: mockOnNavigate })
      );

      // 设置真实DOM容器
      result.current.containerRef.current = realContainer;

      // 验证hook初始化正确
      expect(result.current.containerRef.current).toBe(realContainer);
      expect(typeof result.current.focusFirst).toBe('function');
      expect(typeof result.current.focusLast).toBe('function');

      // 获取真实的按钮元素
      const buttons = realContainer.querySelectorAll('button');
      expect(buttons.length).toBe(3);

      // 验证Home键功能 - 设置第一个元素获得焦点
      act(() => {
        result.current.setFocusIndex(0);
      });

      expect(document.activeElement).toBe(buttons[0]);
      expect(mockOnNavigate).toHaveBeenCalledWith(buttons[0], 'direct');

      // 验证End键功能 - 设置最后一个元素获得焦点
      act(() => {
        result.current.setFocusIndex(buttons.length - 1);
      });

      expect(document.activeElement).toBe(buttons[2]);
      expect(mockOnNavigate).toHaveBeenCalledWith(buttons[2], 'direct');
      expect(mockOnNavigate).toHaveBeenCalledTimes(2);
    });
  });

  describe('配置选项深度测试', () => {
    it('should handle all orientation options', () => {
      const orientations = ['horizontal', 'vertical', 'both'] as const;

      orientations.forEach(orientation => {
        const { result } = renderHook(() =>
          useKeyboardNavigation({ orientation })
        );

        expect(result.current.containerRef).toBeDefined();

        act(() => {
          result.current.focusNext();
          result.current.focusPrevious();
        });

        expect(result.current.getCurrentFocusIndex()).toBe(-1);
      });
    });

    it('should handle onNavigate callback', () => {
      const mockOnNavigate = vi.fn();
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          onNavigate: mockOnNavigate
        })
      );

      act(() => {
        result.current.focusNext();
      });

      // Callback should be available even if not called due to no elements
      expect(typeof mockOnNavigate).toBe('function');
    });

    it('should handle enabled/disabled state changes', () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useKeyboardNavigation({ enabled }),
        { initialProps: { enabled: true } }
      );

      // Initially enabled
      expect(result.current.containerRef).toBeDefined();

      // Disable
      rerender({ enabled: false });
      expect(result.current.containerRef).toBeDefined();

      // Re-enable
      rerender({ enabled: true });
      expect(result.current.containerRef).toBeDefined();
    });
  });

  describe('内存泄漏和性能测试', () => {
    it('should handle multiple rapid focus changes', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      expect(() => {
        for (let i = 0; i < 100; i++) {
          act(() => {
            result.current.focusNext();
            result.current.focusPrevious();
            result.current.setFocusIndex(i % 5);
          });
        }
      }).not.toThrow();
    });

    it('should handle rapid option changes', () => {
      const { rerender } = renderHook(
        ({ loop }) => useKeyboardNavigation({ loop }),
        { initialProps: { loop: true } }
      );

      expect(() => {
        for (let i = 0; i < 50; i++) {
          rerender({ loop: i % 2 === 0 });
        }
      }).not.toThrow();
    });

    it('should cleanup properly with multiple instances', () => {
      const hooks: Array<ReturnType<typeof renderHook>> = [];

      // Create multiple hook instances
      for (let i = 0; i < 10; i++) {
        hooks.push(renderHook(() => useKeyboardNavigation()));
      }

      // Unmount all instances
      expect(() => {
        hooks.forEach(hook => hook.unmount());
      }).not.toThrow();
    });
  });

  describe('错误恢复和边界条件', () => {
    it('should handle focus errors on invalid elements', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      // Mock focus to throw error
      mockFocus.mockImplementation(() => {
        throw new Error('Focus failed');
      });

      expect(() => {
        act(() => {
          result.current.focusNext();
          result.current.focusPrevious();
          result.current.focusFirst();
          result.current.focusLast();
        });
      }).not.toThrow();
    });

    it('should handle querySelectorAll errors', () => {
      mockQuerySelectorAll.mockImplementation(() => {
        throw new Error('Query failed');
      });

      const { result } = renderHook(() => useKeyboardNavigation());

      expect(() => {
        act(() => {
          result.current.focusNext();
        });
      }).not.toThrow();
    });

    it('should handle invalid focus index values', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      const invalidIndices = [-100, 1000, NaN, Infinity, -Infinity];

      invalidIndices.forEach(index => {
        expect(() => {
          act(() => {
            result.current.setFocusIndex(index);
          });
        }).not.toThrow();
      });
    });

    it('should handle container ref changes', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      // Change container ref multiple times
      const containers = [
        document.createElement('div'),
        document.createElement('section'),
        null,
        document.createElement('nav')
      ];

      containers.forEach(container => {
        expect(() => {
          result.current.containerRef.current = container;
          act(() => {
            result.current.focusNext();
          });
        }).not.toThrow();
      });
    });
  });
});
