// @mostajs/ticketing — Validity checker (pure functions, zero coupling)
// Author: Dr Hamid MADANI drmdh@msn.com
import type { ValidityMode } from '../types/index';

/**
 * Compute the expiration date for a ticket based on validity mode.
 *
 * - day_reentry  → end of current day (23:59:59.999)
 * - time_slot    → now + duration minutes
 * - single_use   → null (expires on use)
 * - unlimited    → null (no expiration)
 */
export function computeValidUntil(mode: ValidityMode, durationMinutes: number | null): Date | null {
  const now = new Date();
  switch (mode) {
    case 'day_reentry': {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    case 'time_slot': {
      if (!durationMinutes) return null;
      return new Date(now.getTime() + durationMinutes * 60_000);
    }
    case 'single_use':
    case 'unlimited':
    default:
      return null;
  }
}

/**
 * Check if a ticket is expired based on its validUntil date.
 */
export function isExpired(validUntil: string | Date | null): boolean {
  if (!validUntil) return false;
  return new Date() > new Date(validUntil);
}

/**
 * Check if a timestamp falls within today (since midnight).
 */
export function isToday(date: string | Date): boolean {
  const d = new Date(date);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return d >= start;
}
