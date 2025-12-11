import { describe, expect, it } from 'vitest';
import type { ZodIssue, ZodIssueCode } from 'zod';
import { mapZodIssueToErrorKey } from '../contact-form-error-utils';

// Helper to create ZodIssue
function createZodIssue(
  overrides: Partial<ZodIssue> & {
    path: (string | number)[];
    code: ZodIssueCode;
  },
): ZodIssue {
  return {
    message: '',
    ...overrides,
  } as ZodIssue;
}

describe('contact-form-error-utils', () => {
  describe('mapZodIssueToErrorKey', () => {
    describe('field error key mapping', () => {
      it('should return errors.firstName for firstName field', () => {
        const issue = createZodIssue({
          code: 'invalid_type',
          path: ['firstName'],
          expected: 'string',
          received: 'undefined',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.firstName.invalid');
      });

      it('should return errors.lastName for lastName field', () => {
        const issue = createZodIssue({
          code: 'invalid_type',
          path: ['lastName'],
          expected: 'string',
          received: 'undefined',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.lastName.invalid');
      });

      it('should return errors.email for email field', () => {
        const issue = createZodIssue({
          code: 'invalid_type',
          path: ['email'],
          expected: 'string',
          received: 'undefined',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.email.invalid');
      });

      it('should return errors.company for company field', () => {
        const issue = createZodIssue({
          code: 'invalid_type',
          path: ['company'],
          expected: 'string',
          received: 'undefined',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.company.invalid');
      });

      it('should return errors.message for message field', () => {
        const issue = createZodIssue({
          code: 'invalid_type',
          path: ['message'],
          expected: 'string',
          received: 'undefined',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.message.invalid');
      });

      it('should return errors.phone for phone field', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['phone'],
          message: 'Invalid phone number',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.phone.invalid');
      });

      it('should return errors.subject for subject field', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['subject'],
          message: 'Invalid subject',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.subject.length');
      });

      it('should return errors.acceptPrivacy for acceptPrivacy field', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['acceptPrivacy'],
          message: 'Must accept privacy policy',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe(
          'errors.acceptPrivacy.required',
        );
      });

      it('should return errors.website for website field', () => {
        const issue = createZodIssue({
          code: 'too_big',
          path: ['website'],
          type: 'string',
          maximum: 0,
          inclusive: true,
        });

        expect(mapZodIssueToErrorKey(issue)).toBe(
          'errors.website.shouldBeEmpty',
        );
      });

      it('should return errors.generic.invalid for unknown field', () => {
        const issue = createZodIssue({
          code: 'invalid_type',
          path: ['unknownField'],
          expected: 'string',
          received: 'undefined',
        });

        // invalid_type code returns .invalid suffix
        expect(mapZodIssueToErrorKey(issue)).toBe('errors.generic.invalid');
      });

      it('should return errors.generic.invalid for numeric path', () => {
        const issue = createZodIssue({
          code: 'invalid_type',
          path: [0],
          expected: 'string',
          received: 'undefined',
        });

        // invalid_type code returns .invalid suffix
        expect(mapZodIssueToErrorKey(issue)).toBe('errors.generic.invalid');
      });
    });

    describe('required message handling', () => {
      it('should return .required suffix when message contains "required"', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['firstName'],
          message: 'This field is required',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.firstName.required');
      });

      it('should return .required for case-insensitive Required', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['email'],
          message: 'Email is REQUIRED for submission',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.email.required');
      });
    });

    describe('too_small code handling', () => {
      it('should return .required for minimum of 1', () => {
        const issue = createZodIssue({
          code: 'too_small',
          path: ['firstName'],
          type: 'string',
          minimum: 1,
          inclusive: true,
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.firstName.required');
      });

      it('should return .required for minimum of 0', () => {
        const issue = createZodIssue({
          code: 'too_small',
          path: ['lastName'],
          type: 'string',
          minimum: 0,
          inclusive: true,
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.lastName.required');
      });

      it('should return .tooShort for minimum > 1', () => {
        const issue = createZodIssue({
          code: 'too_small',
          path: ['message'],
          type: 'string',
          minimum: 10,
          inclusive: true,
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.message.tooShort');
      });
    });

    describe('too_big code handling', () => {
      it('should return .tooLong for regular fields', () => {
        const issue = createZodIssue({
          code: 'too_big',
          path: ['message'],
          type: 'string',
          maximum: 1000,
          inclusive: true,
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.message.tooLong');
      });

      it('should return .shouldBeEmpty for website field', () => {
        const issue = createZodIssue({
          code: 'too_big',
          path: ['website'],
          type: 'string',
          maximum: 0,
          inclusive: true,
        });

        expect(mapZodIssueToErrorKey(issue)).toBe(
          'errors.website.shouldBeEmpty',
        );
      });

      it('should return errors.generic.tooLong for unknown fields', () => {
        const issue = createZodIssue({
          code: 'too_big',
          path: ['unknownField'],
          type: 'string',
          maximum: 100,
          inclusive: true,
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.generic.tooLong');
      });
    });

    describe('custom code handling', () => {
      it('should return .domainNotAllowed for email with domain error', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['email'],
          message: 'Email domain not allowed',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe(
          'errors.email.domainNotAllowed',
        );
      });

      it('should return .invalid for email without domain error', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['email'],
          message: 'Invalid email format',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.email.invalid');
      });

      it('should return errors.generic for unknown field custom error', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['unknownField'],
          message: 'Custom error',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.generic');
      });
    });

    describe('invalid_type code handling', () => {
      it('should return .invalid for invalid_type', () => {
        const issue = createZodIssue({
          code: 'invalid_type',
          path: ['firstName'],
          expected: 'string',
          received: 'number',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.firstName.invalid');
      });
    });

    describe('default handling', () => {
      it('should use handleCustomIssue for unhandled codes', () => {
        const issue = createZodIssue({
          code: 'invalid_enum_value',
          path: ['firstName'],
          options: ['a', 'b'],
          received: 'c',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.firstName.invalid');
      });
    });

    describe('edge cases', () => {
      it('should handle empty path', () => {
        const issue = createZodIssue({
          code: 'invalid_type',
          path: [],
          expected: 'object',
          received: 'string',
        });

        // invalid_type code returns .invalid suffix
        expect(mapZodIssueToErrorKey(issue)).toBe('errors.generic.invalid');
      });

      it('should handle undefined message', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['email'],
        });
        // Remove message property entirely
        delete (issue as { message?: string }).message;

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.email.invalid');
      });

      it('should handle null-ish message gracefully', () => {
        const issue = createZodIssue({
          code: 'custom',
          path: ['firstName'],
          message: '',
        });

        expect(mapZodIssueToErrorKey(issue)).toBe('errors.firstName.invalid');
      });
    });
  });
});
