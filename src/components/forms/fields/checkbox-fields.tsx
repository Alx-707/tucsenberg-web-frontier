import * as React from 'react';
import { useForm } from 'react-hook-form';
import type { ContactFormData } from '@/lib/validations';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

/**
 * Checkbox fields component
 */
interface CheckboxFieldsProps {
  errors: ReturnType<typeof useForm<ContactFormData>>['formState']['errors'];
  isSubmitting: boolean;
  watchedValues: ContactFormData;
  setValue: ReturnType<typeof useForm<ContactFormData>>['setValue'];
  t: (_key: string) => string;
}

export function CheckboxFields({
  errors,
  isSubmitting,
  watchedValues,
  setValue,
  t,
}: CheckboxFieldsProps) {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='acceptPrivacy'
            checked={watchedValues.acceptPrivacy}
            onCheckedChange={(checked) =>
              setValue('acceptPrivacy', Boolean(checked))
            }
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.acceptPrivacy)}
          />
          <Label
            htmlFor='acceptPrivacy'
            className="text-sm after:ml-0.5 after:text-red-500 after:content-['*']"
          >
            {t('acceptPrivacy')}
          </Label>
        </div>
        {errors.acceptPrivacy && (
          <p
            className='text-sm text-red-500'
            role='alert'
          >
            {errors.acceptPrivacy.message}
          </p>
        )}
      </div>

      <div className='space-y-2'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='marketingConsent'
            checked={watchedValues.marketingConsent || false}
            onCheckedChange={(checked) =>
              setValue('marketingConsent', Boolean(checked))
            }
            disabled={isSubmitting}
          />
          <Label
            htmlFor='marketingConsent'
            className='text-sm'
          >
            {t('marketingConsent')}
          </Label>
        </div>
      </div>
    </div>
  );
}
