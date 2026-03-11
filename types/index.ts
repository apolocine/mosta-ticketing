// @mostajs/ticketing — Types (merged: ticketing + scan + face)
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

// ── Scan UI types (from @mostajs/scan) ─────────────────────────────
export interface ScanTicketInfo {
  ticketNumber: string
  clientName: string
  activityName: string
  ticketType: string
  validityMode: string
  status: string
}

export interface ScanClientInfo {
  name: string
  clientNumber: string
  photo?: string
  faceDescriptor?: number[]
}

export interface ScanAccessInfo {
  remainingQuota: number | null
  totalQuota: number | null
  endDate: string | null
  status: string
}

export interface ScanResultData {
  result: 'granted' | 'denied'
  reason?: string
  isReentry?: boolean
  ticket?: ScanTicketInfo
  client?: ScanClientInfo
  access?: ScanAccessInfo
}

export interface ScannerViewProps {
  /** API endpoint for scan validation (default: '/api/scan') */
  apiEndpoint?: string
  /** Called when a scan result is received */
  onResult?: (data: ScanResultData) => void
  /** Called on scanner error */
  onError?: (message: string) => void
  /** Translate function (default: identity) */
  t?: (key: string) => string
  /** Labels for start/stop buttons */
  startLabel?: string
  stopLabel?: string
  /** Sound frequencies: [grantedHz, deniedHz] */
  soundFrequencies?: [number, number]
}

export interface ScanResultCardProps {
  /** The scan result data */
  data: ScanResultData
  /** Translate function (default: identity) */
  t?: (key: string) => string
  /** Render custom content after client info (e.g., face verification) */
  renderExtra?: (data: ScanResultData) => React.ReactNode
}

export interface UseScanOptions {
  /** API endpoint for scan validation (default: '/api/scan') */
  apiEndpoint?: string
  /** Play audio feedback on result (default: true) */
  audioFeedback?: boolean
  /** Sound frequencies: [grantedHz, deniedHz] (default: [800, 300]) */
  soundFrequencies?: [number, number]
  /** Called when a scan result is received */
  onResult?: (data: ScanResultData) => void
  /** Called on error */
  onError?: (message: string) => void
}

export interface UseScanReturn {
  /** Whether the scanner is actively scanning */
  scanning: boolean
  /** Whether a scan is being processed */
  processing: boolean
  /** The latest scan result */
  result: ScanResultData | null
  /** Start the QR scanner */
  startScanner: () => Promise<void>
  /** Stop the QR scanner */
  stopScanner: () => void
  /** Reset the result */
  resetResult: () => void
}

// ── Face types (from @mostajs/face) ────────────────────────────────
export interface MostaFaceConfig {
  /** Path to face-api.js model files (default: '/models/face-api') */
  modelsPath?: string
  /** Detection score threshold (default: 0.5) */
  scoreThreshold?: number
  /** TinyFaceDetector input size (default: 320) */
  inputSize?: number
  /** Face matching distance threshold (default: 0.6) */
  matchThreshold?: number
}

export interface FaceDetectionResult {
  detection: {
    score: number
    box: { x: number; y: number; width: number; height: number }
  }
  landmarks?: any
}

export interface FaceMatchResult<T> {
  match: T
  distance: number
}

export type FaceDescriptor = Float32Array | number[]

// ── Face settings (defaults for consuming apps) ──────────────────
export interface FaceSettings {
  /** Enable face detection/recognition (default: true) */
  faceRecognitionEnabled: boolean
  /** Match distance threshold — lower = stricter (default: 0.6) */
  faceRecognitionThreshold: number
  /** Require face detected before photo capture (default: true) */
  faceRequireForCapture: boolean
  /** Auto-verify face after scan (default: false) */
  faceAutoVerify: boolean
}

export const DEFAULT_FACE_SETTINGS: FaceSettings = {
  faceRecognitionEnabled: true,
  faceRecognitionThreshold: 0.6,
  faceRequireForCapture: true,
  faceAutoVerify: false,
}
