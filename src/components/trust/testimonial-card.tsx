import Image from 'next/image';
import { Quote } from 'lucide-react';
import { getBlurPlaceholder } from '@/lib/image';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface Testimonial {
  /** Unique identifier */
  id: string;
  /** Client name */
  name: string;
  /** Client role/position */
  role: string;
  /** Company name */
  company: string;
  /** Testimonial content */
  content: string;
  /** Optional avatar URL */
  avatar: string | undefined;
  /** Optional rating (1-5) */
  rating: number | undefined;
}

export interface TestimonialCardProps {
  /** Testimonial data */
  testimonial: Testimonial;
  /** Custom class name */
  className?: string;
}

// Avatar component
function Avatar({ src, name }: { src: string | undefined; name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src !== undefined) {
    return (
      <Image
        src={src}
        alt={name}
        width={48}
        height={48}
        className='h-12 w-12 rounded-full object-cover'
        {...getBlurPlaceholder('neutral')}
      />
    );
  }

  return (
    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary'>
      {initials}
    </div>
  );
}

// Rating stars component
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className='flex gap-1'>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted text-muted',
          )}
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
        </svg>
      ))}
    </div>
  );
}

/**
 * Testimonial card component for displaying client reviews.
 * Suitable for B2B trust building sections.
 */
export function TestimonialCard({
  testimonial,
  className,
}: TestimonialCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardContent className='pt-6'>
        <div className='mb-4 text-primary/20'>
          <Quote className='h-8 w-8' />
        </div>

        <p className='mb-6 text-sm leading-relaxed text-muted-foreground'>
          {testimonial.content}
        </p>

        {testimonial.rating !== undefined && (
          <div className='mb-4'>
            <RatingStars rating={testimonial.rating} />
          </div>
        )}

        <div className='flex items-center gap-3'>
          <Avatar
            src={testimonial.avatar}
            name={testimonial.name}
          />
          <div>
            <div className='font-medium'>{testimonial.name}</div>
            <div className='text-xs text-muted-foreground'>
              {testimonial.role}, {testimonial.company}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
