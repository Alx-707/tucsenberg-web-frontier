'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getBlurPlaceholder } from '@/lib/image';
import { cn } from '@/lib/utils';

export interface ProductGalleryProps {
  /** Array of image URLs */
  images: string[];
  /** Product title for alt text */
  title: string;
  /** Custom class name */
  className?: string;
}

/**
 * Product image gallery with thumbnail navigation.
 *
 * Client Component for interactive image selection.
 * Displays a main image with clickable thumbnails below.
 */
export function ProductGallery({
  images,
  title,
  className,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Early return for empty array
  const firstImage = images.at(0);
  if (firstImage === undefined) {
    return null;
  }

  // Safe access with fallback to first image (using .at() to avoid object injection warning)
  const selectedImage = images.at(selectedIndex) ?? firstImage;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Image */}
      <div className='relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted'>
        <Image
          src={selectedImage}
          alt={`${title} - Image ${selectedIndex + 1}`}
          fill
          sizes='(max-width: 768px) 100vw, 50vw'
          className='object-cover'
          priority={selectedIndex === 0}
          {...getBlurPlaceholder('shimmer')}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className='flex gap-2 overflow-x-auto pb-2'>
          {images.map((image, index) => (
            <button
              key={index}
              type='button'
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative aspect-square w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all',
                'hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                index === selectedIndex
                  ? 'border-primary'
                  : 'border-transparent',
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : undefined}
            >
              <Image
                src={image}
                alt={`${title} - Thumbnail ${index + 1}`}
                fill
                sizes='64px'
                className='object-cover'
                {...getBlurPlaceholder('neutral')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
