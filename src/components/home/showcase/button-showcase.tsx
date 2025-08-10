import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ButtonShowcaseProps {
  t: (_key: string) => string;
}

export function ButtonShowcase({ t }: ButtonShowcaseProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('components.buttons.title')}</CardTitle>
        <CardDescription>{t('components.buttons.description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap gap-2'>
          <Button>{t('components.buttons.primary')}</Button>
          <Button variant='secondary'>
            {t('components.buttons.secondary')}
          </Button>
          <Button variant='outline'>{t('components.buttons.outline')}</Button>
          <Button variant='ghost'>{t('components.buttons.ghost')}</Button>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button size='sm'>{t('components.buttons.small')}</Button>
          <Button size='default'>{t('components.buttons.default')}</Button>
          <Button size='lg'>{t('components.buttons.large')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
