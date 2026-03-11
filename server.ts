// @mostajs/ticketing/server — Server-side exports (merged: ticketing + face)
// Author: Dr Hamid MADANI drmdh@msn.com

export { TicketRepository, ScanLogRepository } from './repositories/index'
export type { TicketDTO, ScanLogDTO } from './repositories/index'

// API route factories — ticketing
export { createScanHandler } from './api/scan.route'
export { createTicketsHandler } from './api/tickets.route'

// API route factories — face
export { createDetectHandler } from './api/detect.route'
export type { DetectHandlerConfig } from './api/detect.route'
export { createRecognizeHandler } from './api/recognize.route'
export type { FaceCandidate, RecognizeHandlerConfig } from './api/recognize.route'
