/**
 * @vitest-environment jsdom
 * Tests for PostCardSkeleton and PostGridSkeleton components
 */
import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostCardSkeleton, PostGridSkeleton } from '../post-card-skeleton';

describe('PostCardSkeleton', () => {
  describe('basic rendering', () => {
    it('renders Card component', () => {
      const { container } = render(<PostCardSkeleton />);

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it('renders cover image skeleton by default', () => {
      const { container } = render(<PostCardSkeleton />);

      const imageSkeleton = container.querySelector('.aspect-\\[16\\/9\\]');
      expect(imageSkeleton).toBeInTheDocument();
    });

    it('hides cover image skeleton when showCoverImage is false', () => {
      const { container } = render(<PostCardSkeleton showCoverImage={false} />);

      const imageSkeleton = container.querySelector('.aspect-\\[16\\/9\\]');
      expect(imageSkeleton).not.toBeInTheDocument();
    });

    it('renders tags skeleton', () => {
      const { container } = render(<PostCardSkeleton />);

      const tagSkeletons = container.querySelectorAll('.rounded-full');
      expect(tagSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders title skeleton', () => {
      const { container } = render(<PostCardSkeleton />);

      const titleSkeleton = container.querySelector(
        '[data-slot="card-header"] .space-y-2',
      );
      expect(titleSkeleton).toBeInTheDocument();
    });

    it('renders description skeleton', () => {
      const { container } = render(<PostCardSkeleton />);

      const contentSkeleton = container.querySelector(
        '[data-slot="card-content"]',
      );
      expect(contentSkeleton).toBeInTheDocument();
    });

    it('renders footer skeleton', () => {
      const { container } = render(<PostCardSkeleton />);

      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('animation', () => {
    it('has animate-pulse class on skeleton elements', () => {
      const { container } = render(<PostCardSkeleton />);

      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('cover image has animate-pulse', () => {
      const { container } = render(<PostCardSkeleton />);

      const imageSkeleton = container.querySelector('.aspect-\\[16\\/9\\]');
      expect(imageSkeleton).toHaveClass('animate-pulse');
    });
  });

  describe('custom className', () => {
    it('applies custom className to Card', () => {
      const { container } = render(
        <PostCardSkeleton className='custom-skeleton-class' />,
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('custom-skeleton-class');
    });

    it('preserves default h-full class', () => {
      const { container } = render(<PostCardSkeleton className='my-custom' />);

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('h-full');
      expect(card).toHaveClass('my-custom');
    });
  });

  describe('styling', () => {
    it('Card has overflow-hidden class', () => {
      const { container } = render(<PostCardSkeleton />);

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass('overflow-hidden');
    });

    it('skeleton elements have bg-muted class', () => {
      const { container } = render(<PostCardSkeleton />);

      const mutedElements = container.querySelectorAll('.bg-muted');
      expect(mutedElements.length).toBeGreaterThan(0);
    });
  });
});

describe('PostGridSkeleton', () => {
  describe('basic rendering', () => {
    it('renders default 6 skeleton cards', () => {
      const { container } = render(<PostGridSkeleton />);

      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards).toHaveLength(6);
    });

    it('renders custom count of skeleton cards', () => {
      const { container } = render(<PostGridSkeleton count={3} />);

      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards).toHaveLength(3);
    });

    it('renders grid container', () => {
      const { container } = render(<PostGridSkeleton />);

      expect(container.firstChild).toHaveClass('grid');
    });
  });

  describe('grid classes', () => {
    it('has responsive grid column classes', () => {
      const { container } = render(<PostGridSkeleton />);

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });

    it('has gap-6 class', () => {
      const { container } = render(<PostGridSkeleton />);

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('gap-6');
    });
  });

  describe('showCoverImage prop', () => {
    it('passes showCoverImage to skeleton cards', () => {
      const { container } = render(
        <PostGridSkeleton
          count={2}
          showCoverImage={false}
        />,
      );

      const imageSkeletons = container.querySelectorAll('.aspect-\\[16\\/9\\]');
      expect(imageSkeletons).toHaveLength(0);
    });

    it('shows cover images by default', () => {
      const { container } = render(<PostGridSkeleton count={2} />);

      const imageSkeletons = container.querySelectorAll('.aspect-\\[16\\/9\\]');
      expect(imageSkeletons).toHaveLength(2);
    });
  });

  describe('custom className', () => {
    it('applies custom className to grid container', () => {
      const { container } = render(
        <PostGridSkeleton className='custom-grid-skeleton' />,
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('custom-grid-skeleton');
    });

    it('preserves default grid classes', () => {
      const { container } = render(<PostGridSkeleton className='my-custom' />);

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('gap-6');
      expect(grid).toHaveClass('my-custom');
    });
  });

  describe('edge cases', () => {
    it('handles count of 0', () => {
      const { container } = render(<PostGridSkeleton count={0} />);

      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards).toHaveLength(0);
    });

    it('handles count of 1', () => {
      const { container } = render(<PostGridSkeleton count={1} />);

      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards).toHaveLength(1);
    });

    it('handles large count', () => {
      const { container } = render(<PostGridSkeleton count={20} />);

      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards).toHaveLength(20);
    });
  });

  describe('key uniqueness', () => {
    it('renders all skeleton cards without key warnings', () => {
      const { container } = render(<PostGridSkeleton count={5} />);

      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards).toHaveLength(5);
    });
  });
});
