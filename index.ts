// @mostajs/ticketing — Client-safe barrel (merged: ticketing + scan + face)
// Author: Dr Hamid MADANI drmdh@msn.com
// For server-side code (repos), use '@mostajs/ticketing/server'

// Schemas (pure data — no ORM)
export { TicketSchema, ScanLogSchema, CounterSchema } from './schemas/index'

// Core logic (pure functions — no ORM)
export { processScan } from './lib/scan-processor'
export type { ScanDeps } from './lib/scan-processor'
export { computeValidUntil, isExpired, isToday } from './lib/validity-checker'
export { decrementQuota, isQuotaDepleted, wouldExceedQuota } from './lib/quota-manager'

// Ticket number (Wiegand 24-bit)
export {
  DAY_MULTIPLIER, DAY_MODULO, YEAR_MODULO, MAX_SEQUENCE, MAX_TICKET_VALUE,
  getDayOfYear, computeCombinedDay,
  extractCombinedDayFromTicket, extractDayFromTicket, extractYearFromTicket, extractSequenceFromTicket,
  isTicketFromToday, isValidTicketFormat,
} from './lib/ticket-number'

// Permissions
export { TICKETING_PERMISSIONS, TICKETING_PERMISSION_DEFINITIONS, TICKETING_CATEGORY_DEFINITIONS } from './lib/permissions'
export type { TicketingPermission } from './lib/permissions'

// Menu
export { ticketingMenuContribution } from './lib/menu'

// ── Scan UI (from @mostajs/scan) ───────────────────────────────────
export { default as ScannerView } from './components/ScannerView'
export { default as ScanResultCard, ScanEmptyState } from './components/ScanResultCard'
export { useScan } from './hooks/useScan'
export { playBeep, playGranted, playDenied } from './lib/audio'

// ── Face (from @mostajs/face) ──────────────────────────────────────
export { loadModels, isLoaded, detectFace, detectAllFaces, extractDescriptor } from './lib/face-api'
export { compareFaces, findMatch, findAllMatches } from './lib/face-matcher'
export { descriptorToArray, arrayToDescriptor, isValidDescriptor, drawDetection } from './lib/face-utils'
export { useCamera } from './hooks/useCamera'
export { useFaceDetection } from './hooks/useFaceDetection'
export { default as FaceDetector } from './components/FaceDetector'
export type { FaceDetectorProps } from './components/FaceDetector'

// Types (all merged)
export type {
  CodeFormat, ValidityMode, TicketStatus, ScanResult, ScanMethod,
  DenyReason, ScanInput, ScanOutput, ScanGrantedResult, ScanDeniedResult,
  TicketInfo, ClientInfo, AccessInfo, CreateTicketInput,
  ScanHandlerConfig, TicketsHandlerConfig,
  // Scan UI types
  ScanResultData, ScanTicketInfo, ScanClientInfo, ScanAccessInfo,
  ScannerViewProps, ScanResultCardProps, UseScanOptions, UseScanReturn,
  // Face types
  MostaFaceConfig, FaceDetectionResult, FaceMatchResult, FaceDescriptor, FaceSettings,
} from './types/index'
export { DEFAULT_FACE_SETTINGS } from './types/index'
