import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { mockDynamicCalls, loaderPromises } = vi.hoisted(() => ({
  mockDynamicCalls: vi.fn(),
  loaderPromises: [] as Array<Promise<unknown>>,
}));

vi.mock('@/components/cookie/cookie-banner', () => ({
  CookieBanner: ({ className }: { className?: string }) => (
    <div
      data-testid='cookie-banner'
      data-class={className ?? ''}
    />
  ),
}));

vi.mock('next/dynamic', () => ({
  default: (
    loader: () => Promise<unknown>,
    options?: { ssr?: boolean; loading?: () => React.ReactNode },
  ) => {
    mockDynamicCalls(options);
    loaderPromises.push(loader());
    const DynamicComponent = ({ className }: { className?: string }) => (
      <div
        data-testid='dynamic-cookie-banner'
        data-class={className ?? ''}
      />
    );
    DynamicComponent.displayName = 'MockDynamicCookieBanner';
    return DynamicComponent;
  },
}));

describe('LazyCookieBanner', () => {
  it('uses next/dynamic with ssr disabled', async () => {
    const { LazyCookieBanner } = await import('../lazy-cookie-banner');

    render(<LazyCookieBanner className='banner-class' />);

    await Promise.all(loaderPromises);
    expect(mockDynamicCalls).toHaveBeenCalledWith(
      expect.objectContaining({ ssr: false }),
    );
    expect(screen.getByTestId('dynamic-cookie-banner')).toHaveAttribute(
      'data-class',
      'banner-class',
    );
  });
});
