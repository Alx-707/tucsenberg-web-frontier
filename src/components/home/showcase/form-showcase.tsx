import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormShowcaseProps {
  t: (_key: string) => string;
}

export function FormShowcase({ t }: FormShowcaseProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('components.forms.title')}</CardTitle>
        <CardDescription>{t('components.forms.description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='demo-name'>{t('components.forms.name')}</Label>
          <Input
            id='demo-name'
            placeholder={t('components.forms.namePlaceholder')}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='demo-email'>{t('components.forms.email')}</Label>
          <Input
            id='demo-email'
            type='email'
            placeholder={t('components.forms.emailPlaceholder')}
          />
        </div>
        <Button className='w-full'>{t('components.forms.submit')}</Button>
      </CardContent>
    </Card>
  );
}
