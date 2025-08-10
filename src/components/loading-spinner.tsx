import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  text,
  className = '',
}: LoadingSpinnerProps) {
  // Use switch statement to prevent object injection
  let sizeClass: string;
  switch (size) {
    case 'sm':
      sizeClass = 'h-4 w-4';
      break;
    case 'lg':
      sizeClass = 'h-8 w-8';
      break;
    case 'md':
    default:
      sizeClass = 'h-6 w-6';
      break;
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClass}`} />
      {text && <span className='text-muted-foreground text-sm'>{text}</span>}
    </div>
  );
}

export function PageLoadingSpinner() {
  const t = useTranslations('common');

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <LoadingSpinner
        size='lg'
        text={t('loading')}
      />
    </div>
  );
}
