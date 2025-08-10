'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

// 常量定义
const VALIDATION_CONSTANTS = {
  MIN_NAME_LENGTH: 2,
  MIN_MESSAGE_LENGTH: 10,
  FORM_SUBMIT_DELAY: 1000,
} as const;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  message?: string;
}

// 辅助函数：验证名字字段
const validateNameField = (
  value: string,
  t: (_key: string) => string,
  fieldType: 'firstName' | 'lastName',
): string | undefined => {
  if (!value.trim()) {
    return t(`validation.${fieldType}Required`);
  }
  if (value.trim().length < VALIDATION_CONSTANTS.MIN_NAME_LENGTH) {
    return t(`validation.${fieldType}TooShort`);
  }
  return undefined;
};

// 辅助函数：验证邮箱
const validateEmail = (
  email: string,
  t: (_key: string) => string,
): string | undefined => {
  if (!email.trim()) {
    return t('validation.emailRequired');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return t('validation.emailInvalid');
  }
  return undefined;
};

// 辅助函数：验证消息
const validateMessage = (
  message: string,
  t: (_key: string) => string,
): string | undefined => {
  if (!message.trim()) {
    return t('validation.messageRequired');
  }
  if (message.trim().length < VALIDATION_CONSTANTS.MIN_MESSAGE_LENGTH) {
    return t('validation.messageTooShort');
  }
  return undefined;
};

// 表单字段组件
interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (_value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  isTextarea?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
  isTextarea = false,
}) => (
  <div>
    <Label
      htmlFor={id}
      data-testid={`contact-label-${id}`}
    >
      {label}
    </Label>
    {isTextarea ? (
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none ${
          error ? 'border-red-500' : ''
        }`}
        placeholder={placeholder}
        data-testid={`contact-input-${id}`}
      />
    ) : (
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
        data-testid={`contact-input-${id}`}
      />
    )}
    {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
  </div>
);

// 状态消息组件
interface StatusMessageProps {
  status: 'success' | 'error';
  message: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, message }) => {
  const baseClasses = 'mb-4 rounded-md p-4 border';
  const statusClasses =
    status === 'success'
      ? 'bg-green-50 text-green-800 border-green-200'
      : 'bg-red-50 text-red-800 border-red-200';

  return <div className={`${baseClasses} ${statusClasses}`}>{message}</div>;
};

// 初始表单数据
const getInitialFormData = (): FormData => ({
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  message: '',
});

// 表单字段渲染组件
interface ContactFormFieldsProps {
  formData: FormData;
  errors: FormErrors;
  onInputChange: (_field: keyof FormData, _value: string) => void;
  t: (_key: string) => string;
}

const ContactFormFields: React.FC<ContactFormFieldsProps> = ({
  formData,
  errors,
  onInputChange,
  t,
}) => (
  <>
    <div className='grid grid-cols-2 gap-4'>
      <FormField
        id='firstName'
        label={t('firstName')}
        value={formData.firstName}
        onChange={(value) => onInputChange('firstName', value)}
        placeholder={t('firstNamePlaceholder')}
        {...(errors.firstName && { error: errors.firstName })}
      />
      <FormField
        id='lastName'
        label={t('lastName')}
        value={formData.lastName}
        onChange={(value) => onInputChange('lastName', value)}
        placeholder={t('lastNamePlaceholder')}
        {...(errors.lastName && { error: errors.lastName })}
      />
    </div>

    <FormField
      id='email'
      label={t('email')}
      type='email'
      value={formData.email}
      onChange={(value) => onInputChange('email', value)}
      placeholder={t('emailPlaceholder')}
      {...(errors.email && { error: errors.email })}
    />

    <FormField
      id='company'
      label={t('company')}
      value={formData.company}
      onChange={(value) => onInputChange('company', value)}
      placeholder={t('companyPlaceholder')}
    />

    <FormField
      id='message'
      label={t('message')}
      value={formData.message}
      onChange={(value) => onInputChange('message', value)}
      placeholder={t('messagePlaceholder')}
      {...(errors.message && { error: errors.message })}
      isTextarea={true}
    />
  </>
);

/**
 * 表单验证逻辑
 */
function useFormValidation(formData: FormData, t: (_key: string) => string) {
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // 使用辅助函数进行验证
    const firstNameError = validateNameField(formData.firstName, t, 'firstName');
    const lastNameError = validateNameField(formData.lastName, t, 'lastName');
    const emailError = validateEmail(formData.email, t);
    const messageError = validateMessage(formData.message, t);

    if (firstNameError) newErrors.firstName = firstNameError;
    if (lastNameError) newErrors.lastName = lastNameError;
    if (emailError) newErrors.email = emailError;
    if (messageError) newErrors.message = messageError;

    // 过滤掉undefined的错误
    const filteredErrors: FormErrors = {};
    Object.entries(newErrors).forEach(([key, value]) => {
      if (value) {
        filteredErrors[key as keyof FormErrors] = value;
      }
    });

    return filteredErrors;
  };

  return { validateForm };
}

/**
 * 表单提交逻辑
 */
function useFormSubmission(
  formData: FormData,
  validateForm: () => FormErrors,
  setErrors: (_errors: FormErrors) => void,
  setFormData: (_data: FormData) => void,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // 调用实际的API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormData(getInitialFormData());
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitStatus,
    handleSubmit,
  };
}

/**
 * 输入处理逻辑
 */
function useInputHandling(
  setFormData: React.Dispatch<React.SetStateAction<FormData>>,
  errors: FormErrors,
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>,
) {
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // 清除该字段的错误 - 使用安全的属性访问
    const validFields: Array<keyof FormErrors> = [
      'firstName',
      'lastName',
      'email',
      'company',
      'message',
    ];

    if (
      validFields.includes(field as keyof FormErrors) &&
      errors[field as keyof FormErrors]
    ) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return { handleInputChange };
}

export function ContactForm() {
  const t = useTranslations('contact.form');
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [errors, setErrors] = useState<FormErrors>({});

  const { validateForm } = useFormValidation(formData, t);
  const { handleInputChange } = useInputHandling(setFormData, errors, setErrors);
  const { isSubmitting, submitStatus, handleSubmit } = useFormSubmission(
    formData,
    validateForm,
    setErrors,
    setFormData,
  );

  return (
    <Card className='p-6'>
      <h2 className='mb-6 text-2xl font-semibold'>{t('title')}</h2>

      {submitStatus === 'success' && (
        <StatusMessage
          status='success'
          message={t('success')}
        />
      )}

      {submitStatus === 'error' && (
        <StatusMessage
          status='error'
          message={t('error')}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className='space-y-4'
      >
        <ContactFormFields
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          t={t}
        />

        <Button
          type='submit'
          className='w-full'
          disabled={isSubmitting}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Card>
  );
}
