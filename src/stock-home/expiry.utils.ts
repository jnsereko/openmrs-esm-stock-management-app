const DAY_MS = 1000 * 60 * 60 * 24;

/** Days from now to the batch's expiry: negative once expired, `null` without an expiry date. */
export function daysUntilExpiry(expiration: Date | string | null | undefined, now = new Date()) {
  if (!expiration) return null;
  const time = new Date(expiration).getTime();
  return Number.isFinite(time) ? Math.ceil((time - now.getTime()) / DAY_MS) : null;
}

/** Batches that expire within the next `days` days, not yet expired. */
export function expiringWithin<T extends { expiration?: Date | string | null }>(
  batches: Array<T>,
  days: number,
  now = new Date(),
) {
  return batches.filter((batch) => {
    const remaining = daysUntilExpiry(batch.expiration, now);
    return remaining !== null && remaining >= 0 && remaining <= days;
  });
}
