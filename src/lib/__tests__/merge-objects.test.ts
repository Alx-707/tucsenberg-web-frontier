import { describe, expect, it } from 'vitest';
import { mergeObjects } from '@/lib/merge-objects';

describe('mergeObjects', () => {
  it('merges defined source values and preserves target when source is undefined', () => {
    const target = { a: 1, b: 'x' } satisfies Record<string, unknown>;
    const source = { a: 2, b: undefined } satisfies Record<string, unknown>;

    const merged = mergeObjects(target, source);

    expect(merged).toEqual({ a: 2, b: 'x' });
    expect(target).toEqual({ a: 1, b: 'x' });
  });

  it('deep merges nested plain objects and keeps target-only keys', () => {
    const target = {
      nested: { keep: 1, change: 1 },
    } satisfies Record<string, unknown>;
    const source = {
      nested: { change: 2 },
    } satisfies Record<string, unknown>;

    const merged = mergeObjects(target, source);

    expect(merged).toEqual({ nested: { keep: 1, change: 2 } });
  });

  it('replaces arrays instead of deep merging them', () => {
    const target = { items: [1, 2] } satisfies Record<string, unknown>;
    const source = { items: [3] } satisfies Record<string, unknown>;

    const merged = mergeObjects(target, source);

    expect(merged).toEqual({ items: [3] });
  });

  it('ignores inherited enumerable properties on source', () => {
    const source = Object.create({ inherited: 'nope' }) as Record<
      string,
      unknown
    >;
    source.own = 'ok';

    const merged = mergeObjects({}, source);

    expect(merged).toEqual({ own: 'ok' });
  });
});
