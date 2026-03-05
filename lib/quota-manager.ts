// @mostajs/ticketing — Quota manager (pure functions, zero coupling)
// Author: Dr Hamid MADANI drmdh@msn.com

export interface QuotaUpdate {
  remainingQuota: number;
  status?: 'depleted';
}

/**
 * Compute the new quota after decrementing by 1.
 * Returns null if the access has no quota (unlimited).
 */
export function decrementQuota(remainingQuota: number | null): QuotaUpdate | null {
  if (remainingQuota == null) return null;
  const newQuota = Math.max(0, remainingQuota - 1);
  const update: QuotaUpdate = { remainingQuota: newQuota };
  if (newQuota === 0) {
    update.status = 'depleted';
  }
  return update;
}

/**
 * Check if a quota is exhausted.
 */
export function isQuotaDepleted(remainingQuota: number | null): boolean {
  return remainingQuota != null && remainingQuota <= 0;
}

/**
 * Check if generating a new ticket would exceed the total quota.
 */
export function wouldExceedQuota(totalQuota: number | null, currentCount: number): boolean {
  if (totalQuota == null) return false;
  return currentCount >= totalQuota;
}
