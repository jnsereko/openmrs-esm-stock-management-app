import { describe, expect, it } from 'vitest';
import { formatExpiryDate, formatListDate, toDateOnlyString } from './datetimeUtils';

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

describe('formatListDate', () => {
  // The Operations list showed 12-Nov-2026 beside expiry dates such as « 30 mars 2028 » (#638)
  it('formats a list date as expiry dates are formatted, never as « Today »', () => {
    expect(formatListDate).toBe(formatExpiryDate);
    expect(formatListDate(null)).toBe('');
  });
});
