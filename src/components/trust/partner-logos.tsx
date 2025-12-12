import Image from 'next/image';
import { getBlurPlaceholder } from '@/lib/image';
import { cn } from '@/lib/utils';

export interface Partner {
  /** Unique identifier */
  id: string;
  /** Partner name */
  name: string;
  /** Logo URL */
  logo: string;
  /** Optional website URL */
  website: string | undefined;
}

export interface PartnerLogosProps {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle: string | undefined;
  /** Partners to display */
  partners: Partner[];
  /** Custom class name */
  className?: string;
}

// Partner logo item component
function PartnerLogoItem({ partner }: { partner: Partner }) {
  const LogoImage = (
    <Image
      src={partner.logo}
      alt={partner.name}
      width={120}
      height={48}
      className='h-12 max-w-[120px] object-contain grayscale transition-all hover:grayscale-0'
      {...getBlurPlaceholder('neutral')}
    />
  );

  if (partner.website !== undefined) {
    return (
      <a
        href={partner.website}
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center justify-center p-4'
        title={partner.name}
      >
        {LogoImage}
      </a>
    );
  }

  return (
    <div
      className='flex items-center justify-center p-4'
      title={partner.name}
    >
      {LogoImage}
    </div>
  );
}

/**
 * Partner logos section component.
 * Displays partner/client logos in a grid for trust building.
 */
export function PartnerLogos({
  title,
  subtitle,
  partners,
  className,
}: PartnerLogosProps) {
  if (partners.length === 0) {
    return null;
  }

  return (
    <section className={cn('bg-muted/30 py-12 md:py-16', className)}>
      <div className='container mx-auto px-4'>
        <div className='mb-10 text-center'>
          <h2 className='mb-2 text-2xl font-bold'>{title}</h2>
          {subtitle !== undefined && (
            <p className='text-muted-foreground'>{subtitle}</p>
          )}
        </div>

        <div className='flex flex-wrap items-center justify-center gap-8'>
          {partners.map((partner) => (
            <PartnerLogoItem
              key={partner.id}
              partner={partner}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
