import { describe, expect, it } from 'vitest';
import { toDateOnlyString } from './datetimeUtils';

describe('toDateOnlyString', () => {
  it('keeps the local calendar day the date picker returned', () => {
    // Local midnight, as the date picker returns it. East of UTC, toISOString() gives the day before.
    expect(toDateOnlyString(new Date(2026, 11, 31))).toBe('2026-12-31');
    expect(toDateOnlyString(new Date(2027, 0, 1))).toBe('2027-01-01');
  });

  it('leaves an empty expiration empty', () => {
    expect(toDateOnlyString(null)).toBeNull();
    expect(toDateOnlyString(undefined)).toBeUndefined();
  });
});
