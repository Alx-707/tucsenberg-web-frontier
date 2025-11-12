import { contactFieldValidators } from '@/lib/form-schema/contact-field-validators';
import {
  CONTACT_FORM_CONFIG,
  createContactFormSchemaFromConfig,
  type ContactFormFieldValues,
} from '@/config/contact-form-config';

export const contactFormSchema = createContactFormSchemaFromConfig(
  CONTACT_FORM_CONFIG,
  contactFieldValidators,
);

export type ContactFormData = ContactFormFieldValues;
