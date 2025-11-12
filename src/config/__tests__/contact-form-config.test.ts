import { describe, expect, it, vi } from 'vitest';
import { contactFieldValidators } from '@/lib/form-schema/contact-field-validators';
import {
  buildFormFieldsFromConfig,
  CONTACT_FORM_CONFIG,
  createContactFormSchemaFromConfig,
} from '@/config/contact-form-config';

vi.unmock('zod');

describe('contact form configuration builder', () => {
  it('返回字段顺序并响应特性开关', () => {
    const fields = buildFormFieldsFromConfig(CONTACT_FORM_CONFIG);
    expect(fields.map((field) => field.key)).toEqual([
      'firstName',
      'lastName',
      'email',
      'company',
      'phone',
      'subject',
      'message',
      'acceptPrivacy',
      'marketingConsent',
      'website',
    ]);

    const toggledConfig = {
      ...CONTACT_FORM_CONFIG,
      features: {
        ...CONTACT_FORM_CONFIG.features,
        showPrivacyCheckbox: false,
      },
    };
    const filteredFields = buildFormFieldsFromConfig(toggledConfig);
    expect(filteredFields.some((field) => field.key === 'acceptPrivacy')).toBe(
      false,
    );
  });

  it('支持邮箱域白名单', () => {
    const whitelistConfig = {
      ...CONTACT_FORM_CONFIG,
      validation: {
        ...CONTACT_FORM_CONFIG.validation,
        emailDomainWhitelist: ['allowed.com'],
      },
    };
    const schema = createContactFormSchemaFromConfig(
      whitelistConfig,
      contactFieldValidators,
    );
    const basePayload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@allowed.com',
      company: 'Test Company',
      message: 'Hello there, this is a valid message.',
      acceptPrivacy: true,
      website: '',
      marketingConsent: false,
    };

    expect(schema.safeParse(basePayload).success).toBe(true);

    const invalidPayload = {
      ...basePayload,
      email: 'john.doe@blocked.com',
    };
    const result = schema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const domainIssue = result.error.issues.find(
        (issue) => issue.path[0] === 'email',
      );
      expect(domainIssue?.message).toContain('domain is not allowed');
    }
  });
});
