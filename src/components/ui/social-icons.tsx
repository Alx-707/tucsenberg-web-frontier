/**
 * Social Media Icons Component
 *
 * Provides SVG icons for social media platforms used in the footer.
 * Based on the reference design with clean, minimal styling.
 */

import type { FC } from 'react';

interface SocialIconProps {
  'className'?: string;
  'size'?: number;
  'data-testid'?: string;
}

// Twitter/X Icon
export const TwitterIcon: FC<SocialIconProps> = ({
  className = '',
  size = 20,
  'data-testid': dataTestId,
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='currentColor'
    className={className}
    aria-hidden='true'
    {...(dataTestId && { 'data-testid': dataTestId })}
  >
    <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
  </svg>
);

// LinkedIn Icon
export const LinkedInIcon: FC<SocialIconProps> = ({
  className = '',
  size = 20,
  'data-testid': dataTestId,
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='currentColor'
    className={className}
    aria-hidden='true'
    {...(dataTestId && { 'data-testid': dataTestId })}
  >
    <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
  </svg>
);

// External Link Icon (for external links)
export const ExternalLinkIcon: FC<SocialIconProps> = ({
  className = '',
  size = 16,
  'data-testid': dataTestId,
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
    aria-hidden='true'
    {...(dataTestId && { 'data-testid': dataTestId })}
  >
    <path d='M7 17L17 7' />
    <path d='M7 7h10v10' />
  </svg>
);

// Social Icon Mapper
interface SocialIconMapperProps {
  'icon': string;
  'className'?: string;
  'size'?: number;
  'data-testid'?: string;
}

export const SocialIconMapper: FC<SocialIconMapperProps> = ({
  icon,
  className,
  size,
  'data-testid': dataTestId,
}) => {
  const iconProps = {
    ...(className && { className }),
    ...(size && { size }),
    ...(dataTestId && { 'data-testid': dataTestId }),
  };

  switch (icon.toLowerCase()) {
    case 'twitter':
    case 'x':
      return <TwitterIcon {...iconProps} />;
    case 'linkedin':
      return <LinkedInIcon {...iconProps} />;
    default:
      return null;
  }
};

// Social Icon with Link Component
interface SocialIconLinkProps {
  'href': string;
  'icon': string;
  'label': string;
  'ariaLabel': string;
  'className'?: string;
  'iconSize'?: number;
  'data-testid'?: string;
}

export const SocialIconLink: FC<SocialIconLinkProps> = ({
  href,
  icon,
  label,
  ariaLabel,
  className = '',
  iconSize = 20,
  'data-testid': dataTestId,
}) => (
  <a
    href={href}
    target='_blank'
    rel='noopener noreferrer'
    aria-label={ariaLabel}
    className={`inline-flex items-center gap-2 text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 ${className}`}
    {...(dataTestId && { 'data-testid': dataTestId })}
  >
    <SocialIconMapper
      icon={icon}
      size={iconSize}
    />
    <span className='text-sm'>{label}</span>
  </a>
);

export default SocialIconMapper;
