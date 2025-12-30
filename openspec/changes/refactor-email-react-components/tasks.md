# Tasks: Refactor Email Templates to React Email Components

## 1. Dependencies

- [ ] 1.1 Install `@react-email/components` (runtime)
- [ ] 1.2 Install `@react-email/render` (runtime, for plainText generation)
- [ ] 1.3 Install `react-email` (dev, for preview CLI)

## 2. Component Structure

- [ ] 2.1 Create `src/components/emails/` directory
- [ ] 2.2 Create `theme.ts` with color/font/spacing constants
- [ ] 2.3 Create `EmailLayout.tsx` shared layout component
- [ ] 2.4 Create `EmailField.tsx` primitive component

## 3. Email Templates

- [ ] 3.1 Create `ContactFormEmail.tsx`
- [ ] 3.2 Create `ConfirmationEmail.tsx`
- [ ] 3.3 Create `ProductInquiryEmail.tsx`
- [ ] 3.4 Create `index.ts` unified export

## 4. Core Service Migration

- [ ] 4.1 Rename `src/lib/resend-core.ts` → `src/lib/resend-core.tsx`
- [ ] 4.2 Update imports to use React Email components
- [ ] 4.3 Replace `html/text` with `react` + `render()` for plainText
- [ ] 4.4 Update `src/lib/resend.ts` export if needed

## 5. Testing

- [ ] 5.1 Update `src/lib/__tests__/resend.test.ts` assertions (`html` → `react`)
- [ ] 5.2 Run `pnpm type-check` and fix any errors
- [ ] 5.3 Run `pnpm test` and verify all tests pass

## 6. Developer Experience

- [ ] 6.1 Add `email:dev` script to `package.json`: `"email:dev": "email dev --dir src/components/emails --port 3001"`
- [ ] 6.2 Verify preview works with `pnpm email:dev`

## 7. Quality Assurance

- [ ] 7.1 Visual comparison: Compare rendered output with current HTML templates
- [ ] 7.2 Cross-client verification: Test in Outlook, Gmail, and Apple Mail (or use Litmus/Email on Acid)
- [ ] 7.3 PlainText verification: Confirm `text` property contains readable content

## 8. Cleanup

- [ ] 8.1 Mark `src/lib/resend-templates.ts` as deprecated (add JSDoc comment)
- [ ] 8.2 Update any documentation references
