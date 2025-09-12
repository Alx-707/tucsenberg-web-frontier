import * as React from 'react';
import { useForm } from 'react-hook-form';
import type { ContactFormData } from '@/lib/validations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Contact fields component
 */
interface ContactFieldsProps {
  register: ReturnType<typeof useForm<ContactFormData>>['register'];
  errors: ReturnType<typeof useForm<ContactFormData>>['formState']['errors'];
  isSubmitting: boolean;
  t: (_key: string) => string;
}

export function ContactFields({
  register,
  errors,
  isSubmitting,
  t,
}: ContactFieldsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <div className='space-y-2'>
        <Label
          htmlFor='email'
          className="after:ml-0.5 after:text-red-500 after:content-['*']"
        >
          {t('email')}
        </Label>
        <Input
          id='email'
          type='email'
          placeholder={t('emailPlaceholder')}
          disabled={isSubmitting}
          className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && (
          <p
            className='text-sm text-red-500'
            role='alert'
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='company'>{t('company')}</Label>
        <Input
          id='company'
          placeholder={t('companyPlaceholder')}
          disabled={isSubmitting}
          className={
            errors.company ? 'border-red-500 focus:border-red-500' : ''
          }
          aria-invalid={Boolean(errors.company)}
          {...register('company')}
        />
        {errors.company && (
          <p
            className='text-sm text-red-500'
            role='alert'
          >
            {errors.company.message}
          </p>
        )}
      </div>
    </div>
  );
}
