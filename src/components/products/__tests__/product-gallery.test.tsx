/**
 * @vitest-environment jsdom
 * Tests for ProductGallery component
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductGallery } from '../product-gallery';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    sizes: _sizes,
    className,
    priority,
    ...rest
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    className?: string;
    priority?: boolean;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid={alt.includes('Thumbnail') ? 'thumbnail-image' : 'main-image'}
      data-priority={priority ? 'true' : undefined}
      {...rest}
    />
  ),
}));

describe('ProductGallery', () => {
  const sampleImages = [
    '/images/product-1.jpg',
    '/images/product-2.jpg',
    '/images/product-3.jpg',
  ];

  describe('basic rendering', () => {
    it('renders main image with first image', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const mainImage = screen.getByTestId('main-image');
      expect(mainImage).toHaveAttribute('src', '/images/product-1.jpg');
      expect(mainImage).toHaveAttribute('alt', 'Test Product - Image 1');
    });

    it('renders container with space-y-4 class', () => {
      const { container } = render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      expect(container.firstChild).toHaveClass('space-y-4');
    });

    it('returns null for empty images array', () => {
      const { container } = render(
        <ProductGallery
          images={[]}
          title='Test Product'
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders single image without thumbnails', () => {
      render(
        <ProductGallery
          images={['/images/single.jpg']}
          title='Single Product'
        />,
      );

      expect(screen.getByTestId('main-image')).toBeInTheDocument();
      expect(screen.queryAllByTestId('thumbnail-image')).toHaveLength(0);
      expect(
        screen.queryByRole('button', { name: /view image/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('thumbnail rendering', () => {
    it('renders thumbnails for multiple images', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const thumbnails = screen.getAllByTestId('thumbnail-image');
      expect(thumbnails).toHaveLength(3);
    });

    it('renders thumbnail buttons with aria-label', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      expect(
        screen.getByRole('button', { name: 'View image 1' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'View image 2' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'View image 3' }),
      ).toBeInTheDocument();
    });

    it('marks first thumbnail as current by default', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const firstButton = screen.getByRole('button', { name: 'View image 1' });
      expect(firstButton).toHaveAttribute('aria-current', 'true');
    });

    it('applies border-primary to selected thumbnail', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const firstButton = screen.getByRole('button', { name: 'View image 1' });
      expect(firstButton).toHaveClass('border-primary');
    });

    it('applies border-transparent to non-selected thumbnails', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const secondButton = screen.getByRole('button', { name: 'View image 2' });
      expect(secondButton).toHaveClass('border-transparent');
    });
  });

  describe('image selection', () => {
    it('changes main image when thumbnail is clicked', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const mainImage = screen.getByTestId('main-image');
      expect(mainImage).toHaveAttribute('src', '/images/product-1.jpg');

      fireEvent.click(screen.getByRole('button', { name: 'View image 2' }));

      expect(mainImage).toHaveAttribute('src', '/images/product-2.jpg');
      expect(mainImage).toHaveAttribute('alt', 'Test Product - Image 2');
    });

    it('updates aria-current when thumbnail is clicked', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const firstButton = screen.getByRole('button', { name: 'View image 1' });
      const secondButton = screen.getByRole('button', { name: 'View image 2' });

      expect(firstButton).toHaveAttribute('aria-current', 'true');
      expect(secondButton).not.toHaveAttribute('aria-current');

      fireEvent.click(secondButton);

      expect(firstButton).not.toHaveAttribute('aria-current');
      expect(secondButton).toHaveAttribute('aria-current', 'true');
    });

    it('updates border styling when thumbnail is clicked', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const firstButton = screen.getByRole('button', { name: 'View image 1' });
      const secondButton = screen.getByRole('button', { name: 'View image 2' });

      expect(firstButton).toHaveClass('border-primary');
      expect(secondButton).toHaveClass('border-transparent');

      fireEvent.click(secondButton);

      expect(firstButton).toHaveClass('border-transparent');
      expect(secondButton).toHaveClass('border-primary');
    });

    it('clicking same thumbnail does not cause issues', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const firstButton = screen.getByRole('button', { name: 'View image 1' });
      fireEvent.click(firstButton);

      expect(firstButton).toHaveAttribute('aria-current', 'true');
      expect(screen.getByTestId('main-image')).toHaveAttribute(
        'src',
        '/images/product-1.jpg',
      );
    });
  });

  describe('image priority', () => {
    it('sets priority on first image', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const mainImage = screen.getByTestId('main-image');
      expect(mainImage).toHaveAttribute('data-priority', 'true');
    });

    it('removes priority when switching to non-first image', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'View image 2' }));

      const mainImage = screen.getByTestId('main-image');
      expect(mainImage).not.toHaveAttribute('data-priority');
    });
  });

  describe('custom className', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
          className='custom-class'
        />,
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('preserves default space-y-4 with custom className', () => {
      const { container } = render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
          className='mt-8'
        />,
      );

      expect(container.firstChild).toHaveClass('space-y-4');
      expect(container.firstChild).toHaveClass('mt-8');
    });
  });

  describe('alt text', () => {
    it('generates correct alt text for main image', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Premium Widget'
        />,
      );

      expect(screen.getByTestId('main-image')).toHaveAttribute(
        'alt',
        'Premium Widget - Image 1',
      );
    });

    it('generates correct alt text for thumbnails', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Premium Widget'
        />,
      );

      const thumbnails = screen.getAllByTestId('thumbnail-image');
      expect(thumbnails[0]).toHaveAttribute(
        'alt',
        'Premium Widget - Thumbnail 1',
      );
      expect(thumbnails[1]).toHaveAttribute(
        'alt',
        'Premium Widget - Thumbnail 2',
      );
      expect(thumbnails[2]).toHaveAttribute(
        'alt',
        'Premium Widget - Thumbnail 3',
      );
    });

    it('updates main image alt when selection changes', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Premium Widget'
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'View image 3' }));

      expect(screen.getByTestId('main-image')).toHaveAttribute(
        'alt',
        'Premium Widget - Image 3',
      );
    });
  });

  describe('accessibility', () => {
    it('thumbnail buttons have type="button"', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('thumbnail buttons have focus-visible ring styles', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const button = screen.getByRole('button', { name: 'View image 1' });
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-ring');
    });

    it('only selected thumbnail has aria-current', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test Product'
        />,
      );

      const buttons = screen.getAllByRole('button');
      const withCurrent = buttons.filter((b) => b.hasAttribute('aria-current'));
      expect(withCurrent).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('handles two images correctly', () => {
      render(
        <ProductGallery
          images={['/img1.jpg', '/img2.jpg']}
          title='Two Image Product'
        />,
      );

      expect(screen.getAllByTestId('thumbnail-image')).toHaveLength(2);
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('handles many images', () => {
      const manyImages = Array.from(
        { length: 10 },
        (_, i) => `/images/img-${i}.jpg`,
      );
      render(
        <ProductGallery
          images={manyImages}
          title='Many Images'
        />,
      );

      expect(screen.getAllByTestId('thumbnail-image')).toHaveLength(10);
    });

    it('handles images with query parameters', () => {
      const imagesWithParams = [
        '/images/product.jpg?w=800',
        '/images/product.jpg?w=400',
      ];
      render(
        <ProductGallery
          images={imagesWithParams}
          title='Query Params'
        />,
      );

      expect(screen.getByTestId('main-image')).toHaveAttribute(
        'src',
        '/images/product.jpg?w=800',
      );
    });

    it('navigates through all images sequentially', () => {
      render(
        <ProductGallery
          images={sampleImages}
          title='Test'
        />,
      );

      const mainImage = screen.getByTestId('main-image');

      expect(mainImage).toHaveAttribute('src', '/images/product-1.jpg');

      fireEvent.click(screen.getByRole('button', { name: 'View image 2' }));
      expect(mainImage).toHaveAttribute('src', '/images/product-2.jpg');

      fireEvent.click(screen.getByRole('button', { name: 'View image 3' }));
      expect(mainImage).toHaveAttribute('src', '/images/product-3.jpg');

      fireEvent.click(screen.getByRole('button', { name: 'View image 1' }));
      expect(mainImage).toHaveAttribute('src', '/images/product-1.jpg');
    });
  });
});
