import * as React from 'react';
import { useForm } from 'react-hook-form';
import type { ContactFormData } from '@/lib/validations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Name fields component
 */
interface NameFieldsProps {
  register: ReturnType<typeof useForm<ContactFormData>>['register'];
  errors: ReturnType<typeof useForm<ContactFormData>>['formState']['errors'];
  isSubmitting: boolean;
  t: (_key: string) => string;
}

export function NameFields({
  register,
  errors,
  isSubmitting,
  t,
}: NameFieldsProps) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <div className='space-y-2'>
        <Label
          htmlFor='firstName'
          className="after:ml-0.5 after:text-red-500 after:content-['*']"
        >
          {t('firstName')}
        </Label>
        <Input
          id='firstName'
          placeholder={t('firstNamePlaceholder')}
          disabled={isSubmitting}
          className={
            errors.firstName ? 'border-red-500 focus:border-red-500' : ''
          }
          aria-invalid={Boolean(errors.firstName)}
          {...register('firstName')}
        />
        {errors.firstName && (
          <p
            className='text-sm text-red-500'
            role='alert'
          >
            {errors.firstName.message}
          </p>
        )}
      </div>

      <div className='space-y-2'>
        <Label
          htmlFor='lastName'
          className="after:ml-0.5 after:text-red-500 after:content-['*']"
        >
          {t('lastName')}
        </Label>
        <Input
          id='lastName'
          placeholder={t('lastNamePlaceholder')}
          disabled={isSubmitting}
          className={
            errors.lastName ? 'border-red-500 focus:border-red-500' : ''
          }
          aria-invalid={Boolean(errors.lastName)}
          {...register('lastName')}
        />
        {errors.lastName && (
          <p
            className='text-sm text-red-500'
            role='alert'
          >
            {errors.lastName.message}
          </p>
        )}
      </div>
    </div>
  );
}
