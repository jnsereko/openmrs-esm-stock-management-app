import { describe, expect, it } from 'vitest';
import { daysUntilExpiry, expiringWithin } from './expiry.utils';

const now = new Date('2026-11-12T10:00:00Z');

describe('expiry utils', () => {
  it('counts the days to expiry', () => {
    expect(daysUntilExpiry('2026-12-31T00:00:00.000+0000', now)).toBe(49);
    expect(daysUntilExpiry('2026-11-01T00:00:00.000+0000', now)).toBeLessThan(0);
    expect(daysUntilExpiry(null, now)).toBeNull();
  });

  it('keeps the batches that expire within six months, not the expired or later ones', () => {
    const batches = [
      { id: 'dec', expiration: '2026-12-31T00:00:00.000+0000' },
      { id: 'expired', expiration: '2026-11-01T00:00:00.000+0000' },
      { id: 'next-year', expiration: '2027-12-31T00:00:00.000+0000' },
      { id: 'none', expiration: null },
    ];
    expect(expiringWithin(batches, 180, now).map((b) => b.id)).toEqual(['dec']);
  });
});
