// @mostajs/ticketing — Ticket number generation (Wiegand 24-bit format)
// Adapted from MostaGare ticketService.ts
// Author: Dr Hamid MADANI drmdh@msn.com
//
// Format: Ticket = ((Annee % 4) x 32 + (JourAnnee % 32)) x 131072 + Sequence
// - Annee encodee sur 2 bits (0-3) -> Cycle tous les 4 ans
// - Jour encode sur 5 bits (0-31) -> Cycle tous les 32 jours
// - Combinaison sur 7 bits (0-127) -> 128 combinaisons uniques
// - Sequence sur 17 bits (0-131071) -> 131k tickets/jour
// - Max: 16 777 215 (24-bit compatible)

export const DAY_MULTIPLIER = 131072;   // 2^17
export const DAY_MODULO = 32;           // 2^5
export const YEAR_MODULO = 4;           // Cycle de 4 ans
export const MAX_SEQUENCE = 131071;     // 2^17 - 1
export const MAX_TICKET_VALUE = 16777215; // 2^24 - 1

/**
 * Calcule le jour de l'annee (1-366)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Calcule le combinedDay pour une date donnee
 */
export function computeCombinedDay(date: Date): number {
  const yearPart = date.getFullYear() % YEAR_MODULO;
  const dayPart = getDayOfYear(date) % DAY_MODULO;
  return (yearPart * DAY_MODULO) + dayPart;
}

/**
 * Extrait le combinedDay (annee + jour encodes, 0-127) d'un numero de ticket
 */
export function extractCombinedDayFromTicket(ticketNumber: string | number): number {
  const value = typeof ticketNumber === 'string' ? parseInt(ticketNumber, 10) : ticketNumber;
  return Math.floor(value / DAY_MULTIPLIER);
}

/**
 * Extrait le jour encode (0-31) d'un numero de ticket
 */
export function extractDayFromTicket(ticketNumber: string | number): number {
  const combinedDay = extractCombinedDayFromTicket(ticketNumber);
  return combinedDay % DAY_MODULO;
}

/**
 * Extrait l'annee encodee (0-3) d'un numero de ticket
 */
export function extractYearFromTicket(ticketNumber: string | number): number {
  const combinedDay = extractCombinedDayFromTicket(ticketNumber);
  return Math.floor(combinedDay / DAY_MODULO);
}

/**
 * Extrait la sequence d'un numero de ticket
 */
export function extractSequenceFromTicket(ticketNumber: string | number): number {
  const value = typeof ticketNumber === 'string' ? parseInt(ticketNumber, 10) : ticketNumber;
  return value % DAY_MULTIPLIER;
}

/**
 * Verifie si un ticket correspond au jour et annee actuels (anti-replay)
 */
export function isTicketFromToday(ticketNumber: string | number): boolean {
  const ticketCombinedDay = extractCombinedDayFromTicket(ticketNumber);
  const todayCombinedDay = computeCombinedDay(new Date());
  return ticketCombinedDay === todayCombinedDay;
}

/**
 * Verifie si un numero de ticket est valide (dans les limites 24-bit)
 */
export function isValidTicketFormat(ticketNumber: string | number): boolean {
  const value = typeof ticketNumber === 'string' ? parseInt(ticketNumber, 10) : ticketNumber;
  return !isNaN(value) && value >= 1 && value <= MAX_TICKET_VALUE;
}
