'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Turnstile } from '@marsidev/react-turnstile';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

import {
  ContactFormData,
  contactFormSchema,
  FormSubmissionStatus,
  validationHelpers
} from '@/lib/validations';
import { logger } from '@/lib/logger';



/**
 * 状态消息组件
 * Status message component
 */
interface StatusMessageProps {
  status: 'success' | 'error';
  message: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, message }) => (
  <div
    className={`p-4 rounded-md mb-4 ${
      status === 'success'
        ? 'bg-green-50 text-green-800 border border-green-200'
        : 'bg-red-50 text-red-800 border border-red-200'
    }`}
    role="alert"
  >
    <p className="text-sm font-medium">{message}</p>
  </div>
);

/**
 * 表单字段组件
 * Form fields component
 */
interface ContactFormFieldsProps {
  register: ReturnType<typeof useForm<ContactFormData>>['register'];
  errors: ReturnType<typeof useForm<ContactFormData>>['formState']['errors'];
  isSubmitting: boolean;
  t: (key: string) => string;
}

function ContactFormFields({ register, errors, isSubmitting, t }: ContactFormFieldsProps) {
  return (
    <>
      {/* 姓名字段 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            {t('firstName')}
          </Label>
          <Input
            id="firstName"
            placeholder={t('firstNamePlaceholder')}
            disabled={isSubmitting}
            className={errors.firstName ? 'border-red-500 focus:border-red-500' : ''}
            aria-invalid={!!errors.firstName}
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500" role="alert">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            {t('lastName')}
          </Label>
          <Input
            id="lastName"
            placeholder={t('lastNamePlaceholder')}
            disabled={isSubmitting}
            className={errors.lastName ? 'border-red-500 focus:border-red-500' : ''}
            aria-invalid={!!errors.lastName}
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500" role="alert">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* 邮箱和公司 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            {t('email')}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            disabled={isSubmitting}
            className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            {t('company')}
          </Label>
          <Input
            id="company"
            placeholder={t('companyPlaceholder')}
            disabled={isSubmitting}
            className={errors.company ? 'border-red-500 focus:border-red-500' : ''}
            aria-invalid={!!errors.company}
            {...register('company')}
          />
          {errors.company && (
            <p className="text-sm text-red-500" role="alert">
              {errors.company.message}
            </p>
          )}
        </div>
      </div>

      {/* 可选字段 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t('phone')}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder={t('phonePlaceholder')}
            disabled={isSubmitting}
            className={errors.phone ? 'border-red-500 focus:border-red-500' : ''}
            aria-invalid={!!errors.phone}
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-sm text-red-500" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">{t('subject')}</Label>
          <Input
            id="subject"
            placeholder={t('subjectPlaceholder')}
            disabled={isSubmitting}
            className={errors.subject ? 'border-red-500 focus:border-red-500' : ''}
            aria-invalid={!!errors.subject}
            {...register('subject')}
          />
          {errors.subject && (
            <p className="text-sm text-red-500" role="alert">
              {errors.subject.message}
            </p>
          )}
        </div>
      </div>

      {/* 消息 */}
      <div className="space-y-2">
        <Label htmlFor="message" className="after:content-['*'] after:ml-0.5 after:text-red-500">
          {t('message')}
        </Label>
        <Textarea
          id="message"
          placeholder={t('messagePlaceholder')}
          disabled={isSubmitting}
          rows={5}
          className={errors.message ? 'border-red-500 focus:border-red-500' : ''}
          aria-invalid={!!errors.message}
          {...register('message')}
        />
        {errors.message && (
          <p className="text-sm text-red-500" role="alert">
            {errors.message.message}
          </p>
        )}
      </div>
    </>
  );
}

/**
 * 复选框组件
 * Checkbox component
 */
interface ContactFormCheckboxesProps {
  register: ReturnType<typeof useForm<ContactFormData>>['register'];
  errors: ReturnType<typeof useForm<ContactFormData>>['formState']['errors'];
  isSubmitting: boolean;
  watchedValues: ContactFormData;
  setValue: ReturnType<typeof useForm<ContactFormData>>['setValue'];
  t: (key: string) => string;
}

function ContactFormCheckboxes({ errors, isSubmitting, watchedValues, setValue, t }: ContactFormCheckboxesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="acceptPrivacy"
            checked={watchedValues.acceptPrivacy}
            onCheckedChange={(checked) => setValue('acceptPrivacy', !!checked)}
            disabled={isSubmitting}
            aria-invalid={!!errors.acceptPrivacy}
          />
          <Label
            htmlFor="acceptPrivacy"
            className="text-sm after:content-['*'] after:ml-0.5 after:text-red-500"
          >
            {t('acceptPrivacy')}
          </Label>
        </div>
        {errors.acceptPrivacy && (
          <p className="text-sm text-red-500" role="alert">
            {errors.acceptPrivacy.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="marketingConsent"
            checked={watchedValues.marketingConsent || false}
            onCheckedChange={(checked) => setValue('marketingConsent', !!checked)}
            disabled={isSubmitting}
          />
          <Label htmlFor="marketingConsent" className="text-sm">
            {t('marketingConsent')}
          </Label>
        </div>
      </div>
    </div>
  );
}

/**
 * 主要联系表单组件
 * Main contact form component with React Hook Form
 */
export function ContactForm() {
  const t = useTranslations('contact.form');
  const [submitStatus, setSubmitStatus] = useState<FormSubmissionStatus>('idle');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(null);

  // React Hook Form 设置
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      message: '',
      phone: '',
      subject: '',
      acceptPrivacy: false,
      marketingConsent: false,
      website: '', // 蜜罐字段
    },
  });

  // 监听表单值变化
  const watchedValues = watch();

  /**
   * 表单提交处理
   * Form submission handler
   */
  const onSubmit = async (data: ContactFormData) => {
    try {
      setSubmitStatus('submitting');

      // 检查提交频率限制
      const COOLDOWN_MINUTES = 5;
      if (validationHelpers.isSubmissionRateLimited(lastSubmissionTime, COOLDOWN_MINUTES)) {
        throw new Error('Please wait before submitting again');
      }

      // 检查垃圾邮件
      if (validationHelpers.isSpamContent(data.message)) {
        throw new Error('Message contains inappropriate content');
      }

      // 检查蜜罐字段
      if (data.website && data.website.length > 0) {
        logger.warn('Bot detected via honeypot field', { email: data.email });
        throw new Error('Invalid submission');
      }

      // 准备提交数据
      const submissionData = {
        ...data,
        turnstileToken,
        submittedAt: new Date().toISOString(),
      };

      // 提交到API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit form');
      }

      // 成功处理
      setSubmitStatus('success');
      setLastSubmissionTime(new Date());
      reset(); // 重置表单
      setTurnstileToken(''); // 重置Turnstile

      logger.info('Contact form submitted successfully', {
        email: data.email,
        company: data.company,
        messageId: result.messageId,
      });

    } catch (error) {
      setSubmitStatus('error');
      logger.error('Contact form submission failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: data.email,
      });
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">{t('title')}</h2>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      {/* 状态消息 */}
      {submitStatus === 'success' && (
        <StatusMessage
          status="success"
          message={t('success')}
        />
      )}

      {submitStatus === 'error' && (
        <StatusMessage
          status="error"
          message={t('error')}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ContactFormFields
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
          t={t}
        />

        {/* 蜜罐字段（隐藏） */}
        <input
          type="text"
          {...register('website')}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />

        <ContactFormCheckboxes
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
          watchedValues={watchedValues}
          setValue={setValue}
          t={t}
        />

        {/* Cloudflare Turnstile */}
        <div className="flex justify-center">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || 'test-key'}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken('')}
            onExpire={() => setTurnstileToken('')}
            options={{
              theme: 'light',
              size: 'normal',
            }}
          />
        </div>

        {/* 提交按钮 */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !turnstileToken}
          size="lg"
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Card>
  );
}
