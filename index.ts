// @mostajs/ticketing — Main barrel exports
// Author: Dr Hamid MADANI drmdh@msn.com

// ── Schemas ────────────────────────────────────────────────────────
export {
  TicketSchema,
  ClientAccessSchema,
  ScanLogSchema,
  SubscriptionPlanSchema,
  ActivitySchema,
  CounterSchema,
} from './schemas/index';

// ── Repositories ───────────────────────────────────────────────────
export {
  TicketRepository,
  ClientAccessRepository,
  ScanLogRepository,
  SubscriptionPlanRepository,
  ActivityRepository,
} from './repositories/index';

export type {
  TicketDTO,
  ClientAccessDTO,
  ScanLogDTO,
  SubscriptionPlanDTO,
  PlanActivityDTO,
  ActivityDTO,
  ActivityScheduleDTO,
} from './repositories/index';

// ── Core logic (pure functions) ────────────────────────────────────
export { processScan } from './lib/scan-processor';
export type { ScanDeps } from './lib/scan-processor';

export { computeValidUntil, isExpired, isToday } from './lib/validity-checker';
export { decrementQuota, isQuotaDepleted, wouldExceedQuota } from './lib/quota-manager';

// ── Ticket number (Wiegand 24-bit) ───────────────────────────────
export {
  DAY_MULTIPLIER,
  DAY_MODULO,
  YEAR_MODULO,
  MAX_SEQUENCE,
  MAX_TICKET_VALUE,
  getDayOfYear,
  computeCombinedDay,
  extractCombinedDayFromTicket,
  extractDayFromTicket,
  extractYearFromTicket,
  extractSequenceFromTicket,
  isTicketFromToday,
  isValidTicketFormat,
} from './lib/ticket-number';

// ── API route factories ────────────────────────────────────────────
export { createScanHandler } from './api/scan.route';
export { createTicketsHandler } from './api/tickets.route';

// ── Types ──────────────────────────────────────────────────────────
export type {
  CodeFormat,
  ValidityMode,
  TicketStatus,
  ScanResult,
  ScanMethod,
  AccessType,
  AccessStatus,
  ActivityStatus,
  PlanType,
  DenyReason,
  ScanInput,
  ScanOutput,
  ScanGrantedResult,
  ScanDeniedResult,
  TicketInfo,
  ClientInfo,
  AccessInfo,
  CreateTicketInput,
  ScanHandlerConfig,
  TicketsHandlerConfig,
} from './types/index';
