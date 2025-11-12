import { describe, expect, it } from 'vitest';
import { WhatsAppFloatingButton } from '@/components/whatsapp/whatsapp-floating-button';
import { render, screen } from '@/test/utils';

describe('WhatsAppFloatingButton', () => {
  it('renders link with normalized phone number', () => {
    render(<WhatsAppFloatingButton number='+1 (555) 123-4567' />);

    const button = screen.getByRole('link', {
      name: /chat with us on whatsapp/i,
    });
    expect(button).toHaveAttribute('href', 'https://wa.me/15551234567');
  });

  it('skips rendering when number is invalid', () => {
    render(<WhatsAppFloatingButton number='invalid' />);
    expect(
      screen.queryByRole('link', { name: /chat with us on whatsapp/i }),
    ).toBeNull();
  });
});
