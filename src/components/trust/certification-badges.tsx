import Image from 'next/image';
import { getBlurPlaceholder } from '@/lib/image';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface Certification {
  /** Unique identifier */
  id: string;
  /** Certification name */
  name: string;
  /** Short description */
  description: string | undefined;
  /** Badge/logo URL */
  badge: string | undefined;
  /** Issuing organization */
  issuer: string | undefined;
}

export interface CertificationBadgesProps {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle: string | undefined;
  /** Certifications to display */
  certifications: Certification[];
  /** Custom class name */
  className?: string;
}

// Certification badge item component
function CertificationBadgeItem({
  certification,
}: {
  certification: Certification;
}) {
  return (
    <Card className='h-full text-center'>
      <CardContent className='pt-6'>
        {certification.badge !== undefined ? (
          <Image
            src={certification.badge}
            alt={certification.name}
            width={64}
            height={64}
            className='mx-auto mb-4 h-16 w-16 object-contain'
            {...getBlurPlaceholder('neutral')}
          />
        ) : (
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <span className='text-2xl font-bold text-primary'>
              {certification.name.charAt(0)}
            </span>
          </div>
        )}

        <h3 className='mb-1 font-semibold'>{certification.name}</h3>

        {certification.issuer !== undefined && (
          <p className='mb-2 text-xs text-muted-foreground'>
            {certification.issuer}
          </p>
        )}

        {certification.description !== undefined && (
          <p className='text-sm text-muted-foreground'>
            {certification.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Certification badges section component.
 * Displays quality certifications and standards for trust building.
 */
export function CertificationBadges({
  title,
  subtitle,
  certifications,
  className,
}: CertificationBadgesProps) {
  if (certifications.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-12 md:py-16', className)}>
      <div className='container mx-auto px-4'>
        <div className='mb-10 text-center'>
          <h2 className='mb-2 text-2xl font-bold'>{title}</h2>
          {subtitle !== undefined && (
            <p className='text-muted-foreground'>{subtitle}</p>
          )}
        </div>

        <div className='grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {certifications.map((certification) => (
            <CertificationBadgeItem
              key={certification.id}
              certification={certification}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
