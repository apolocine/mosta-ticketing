// @mostajs/ticketing — Types
// Author: Dr Hamid MADANI drmdh@msn.com

// ── Code formats (QR + barcode types) ──────────────────────────────
export type CodeFormat =
  | 'qrcode'      // QR Code (2D, most common)
  | 'code128'     // Code 128 (1D, alphanumeric, logistics)
  | 'code39'      // Code 39 (1D, alphanumeric, industry)
  | 'ean13'       // EAN-13 (1D, 13 digits, retail EU)
  | 'ean8'        // EAN-8 (1D, 8 digits, small products)
  | 'upc_a'       // UPC-A (1D, 12 digits, retail US)
  | 'itf'         // Interleaved 2 of 5 (1D, numeric pairs)
  | 'pdf417'      // PDF417 (2D, high capacity, ID cards)
  | 'datamatrix'  // Data Matrix (2D, small footprint)
  | 'aztec'       // Aztec (2D, compact, boarding passes)

// ── Ticket types ───────────────────────────────────────────────────
export type ValidityMode = 'day_reentry' | 'single_use' | 'time_slot' | 'unlimited'
export type TicketStatus = 'active' | 'used' | 'expired' | 'cancelled'
export type ScanResult = 'granted' | 'denied'
export type ScanMethod = 'webcam' | 'pwa_camera' | 'handheld_scanner' | 'nfc'
export type AccessType = 'unlimited' | 'count' | 'temporal' | 'mixed'
export type AccessStatus = 'active' | 'expired' | 'blocked' | 'depleted'
export type ActivityStatus = 'active' | 'inactive' | 'maintenance'
export type PlanType = 'temporal' | 'usage' | 'mixed'

// ── Scan processing ────────────────────────────────────────────────
export type DenyReason =
  | 'invalid_ticket'
  | 'ticket_already_used'
  | 'ticket_expired'
  | 'ticket_cancelled'
  | 'quota_depleted'
  | 'access_expired'
  | 'client_suspended'

export interface ScanInput {
  code: string
  scanMethod?: ScanMethod
  scannedBy: string
}

export interface ScanGrantedResult {
  result: 'granted'
  isReentry: boolean
  ticket: TicketInfo
  client: ClientInfo
  access: AccessInfo
}

export interface ScanDeniedResult {
  result: 'denied'
  reason: DenyReason
  ticket?: TicketInfo
}

export type ScanOutput = ScanGrantedResult | ScanDeniedResult

export interface TicketInfo {
  ticketNumber: string
  clientName: string
  activityName: string
  ticketType: string
  validityMode: string
  status: string
}

export interface ClientInfo {
  id: string
  name: string
  clientNumber?: string
  photo?: string
  [key: string]: unknown
}

export interface AccessInfo {
  remainingQuota: number | null
  totalQuota: number | null
  endDate: string | null
  status: AccessStatus
}

// ── Ticket creation ────────────────────────────────────────────────
export interface CreateTicketInput {
  clientId: string
  activityId: string
  ticketType?: string
  sourceClientId?: string
  amount?: number
  codeFormat?: CodeFormat
}

// ── API route factory configs ──────────────────────────────────────
export interface ScanHandlerConfig {
  getRepositories: () => Promise<{
    ticketRepo: any
    clientAccessRepo: any
    scanLogRepo: any
    clientRepo: any
  }>
  checkAuth: (req: Request) => Promise<{ error: Response | null; userId: string }>
  onGranted?: (data: { ticket: any; client: any; access: any; isReentry: boolean; userId: string }) => Promise<void>
  onDenied?: (data: { reason: string; ticket?: any; userId: string }) => Promise<void>
}

export interface TicketsHandlerConfig {
  getRepositories: () => Promise<{
    ticketRepo: any
    clientRepo: any
    clientAccessRepo: any
    activityRepo: any
  }>
  checkAuth: (req: Request, permission: string) => Promise<{ error: Response | null; userId: string }>
  onCreated?: (data: { ticket: any; userId: string }) => Promise<void>
  defaultCodeFormat?: CodeFormat
}
