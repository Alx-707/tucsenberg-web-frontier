import { describe, expect, it } from 'vitest';
import { siteFacts } from '@/config/site-facts';

describe('site-facts', () => {
  it('exports site facts with expected shape', () => {
    expect(siteFacts).toBeTruthy();

    expect(typeof siteFacts.company.name).toBe('string');
    expect(typeof siteFacts.company.established).toBe('number');
    expect(typeof siteFacts.company.location.country).toBe('string');
    expect(typeof siteFacts.company.location.city).toBe('string');

    expect(typeof siteFacts.contact.phone).toBe('string');
    expect(typeof siteFacts.contact.email).toBe('string');

    expect(Array.isArray(siteFacts.certifications)).toBe(true);
    expect(typeof siteFacts.stats).toBe('object');
    expect(typeof siteFacts.social).toBe('object');
  });
});
