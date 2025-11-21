/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WhatsAppFloatingButton } from '@/components/whatsapp/whatsapp-floating-button';

// 局部 Mock lucide-react，避免集中 Mock/真实包体在极端环境下的解析开销
vi.mock('lucide-react', () => ({
  Phone: ({ className, ...props }: React.ComponentProps<'svg'>) => (
    <svg
      data-testid='mock-phone-icon'
      className={className}
      {...props}
    >
      <circle
        cx='12'
        cy='12'
        r='10'
      />
    </svg>
  ),
}));

// Mock react-draggable 以简化测试
vi.mock('react-draggable', () => ({
  default: ({
    children,
    nodeRef: _nodeRef,
  }: {
    children: React.ReactNode;
    nodeRef: React.RefObject<HTMLElement>;
  }) => <div data-testid='draggable-wrapper'>{children}</div>,
}));

describe('WhatsAppFloatingButton', () => {
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear();
  });

  it('renders link with normalized phone number', () => {
    render(<WhatsAppFloatingButton number='+1 (555) 123-4567' />);

    const button = screen.getByRole('link', {
      name: /chat with us on whatsapp/i,
    });
    expect(button).toHaveAttribute('href', 'https://wa.me/15551234567');
  });

  it('skips rendering when number is invalid', () => {
    render(<WhatsAppFloatingButton number='invalid' />);
    expect(
      screen.queryByRole('link', { name: /chat with us on whatsapp/i }),
    ).toBeNull();
  });

  it('renders draggable wrapper', () => {
    render(<WhatsAppFloatingButton number='+1 (555) 123-4567' />);

    const draggableWrapper = screen.getByTestId('draggable-wrapper');
    expect(draggableWrapper).toBeInTheDocument();
  });

  it('renders drag handle with cursor-move class', () => {
    render(<WhatsAppFloatingButton number='+1 (555) 123-4567' />);

    const dragHandle = screen.getByLabelText('Drag to move');
    expect(dragHandle).toHaveClass('drag-handle', 'cursor-move');
  });
});
