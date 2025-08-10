import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface BadgeShowcaseProps {
  t: (_key: string) => string;
}

export function BadgeShowcase({ t }: BadgeShowcaseProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('components.badges.title')}</CardTitle>
        <CardDescription>{t('components.badges.description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap gap-2'>
          <Badge>{t('components.badges.default')}</Badge>
          <Badge variant='secondary'>{t('components.badges.secondary')}</Badge>
          <Badge variant='outline'>{t('components.badges.outline')}</Badge>
          <Badge variant='destructive'>
            {t('components.badges.destructive')}
          </Badge>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Badge className='bg-green-500'>
            {t('components.badges.success')}
          </Badge>
          <Badge className='bg-yellow-500'>
            {t('components.badges.warning')}
          </Badge>
          <Badge className='bg-blue-500'>{t('components.badges.info')}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
