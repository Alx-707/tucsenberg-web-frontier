/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuPortal,
    DropdownMenuTrigger,
} from '../dropdown-menu';

describe('DropdownMenu - Basic Components', () => {
  describe('DropdownMenu', () => {
    it('renders dropdown menu root', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <div>Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByText('Open');
      expect(trigger).toBeInTheDocument();
    });

    it('accepts defaultOpen prop', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid='content'>
            <div>Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
    });

    it('accepts open and onOpenChange props', () => {
      const onOpenChange = vi.fn();
      render(
        <DropdownMenu open={true} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid='content'>
            <div>Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('DropdownMenuPortal', () => {
    it('renders portal component', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent data-testid='portal-content'>
              <div>Portal Content</div>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('portal-content');
      expect(content).toBeInTheDocument();
    });

    it('accepts container prop', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuPortal container={container}>
            <DropdownMenuContent data-testid='portal-content'>
              <div>Portal Content</div>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('portal-content');
      expect(content).toBeInTheDocument();
      expect(container.contains(content)).toBe(true);

      document.body.removeChild(container);
    });
  });

  describe('DropdownMenuTrigger', () => {
    it('renders trigger button', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid='trigger'>
            Open Menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div>Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Open Menu');
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger className='custom-trigger' data-testid='trigger'>
            Open Menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div>Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('supports asChild prop', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-testid='custom-trigger'>Custom Trigger</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div>Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByTestId('custom-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Custom Trigger');
    });

    it('handles disabled state', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger disabled data-testid='trigger'>
            Disabled Trigger
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div>Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeDisabled();
    });
  });

  describe('DropdownMenuContent', () => {
    it('renders content with default props', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid='content'>
            <div>Menu Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Menu Content');
    });

    it('applies default classes', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid='content'>
            <div>Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveClass(
        'z-50',
        'min-w-[8rem]',
        'overflow-hidden',
        'rounded-md',
        'border',
        'bg-popover',
        'p-1',
        'text-popover-foreground',
        'shadow-md',
      );
    });

    it('applies custom className', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className='custom-content' data-testid='content'>
            <div>Content</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });

    it('supports different side positions', () => {
      const sides = ['top', 'right', 'bottom', 'left'] as const;
      
      sides.forEach((side) => {
        const { unmount } = render(
          <DropdownMenu defaultOpen>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent side={side} data-testid={`content-${side}`}>
              <div>Content {side}</div>
            </DropdownMenuContent>
          </DropdownMenu>,
        );

        const content = screen.getByTestId(`content-${side}`);
        expect(content).toBeInTheDocument();
        
        unmount();
      });
    });

    it('supports different alignments', () => {
      const alignments = ['start', 'center', 'end'] as const;
      
      alignments.forEach((align) => {
        const { unmount } = render(
          <DropdownMenu defaultOpen>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent align={align} data-testid={`content-${align}`}>
              <div>Content {align}</div>
            </DropdownMenuContent>
          </DropdownMenu>,
        );

        const content = screen.getByTestId(`content-${align}`);
        expect(content).toBeInTheDocument();
        
        unmount();
      });
    });

    it('supports sideOffset and alignOffset', () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent 
            sideOffset={10} 
            alignOffset={5} 
            data-testid='content'
          >
            <div>Content with offsets</div>
          </DropdownMenuContent>
        </DropdownMenu>,
      );

      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
    });
  });
});
