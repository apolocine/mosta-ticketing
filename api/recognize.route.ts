// @mostajs/ticketing — Recognize API route factory (from @mostajs/face)
// Author: Dr Hamid MADANI drmdh@msn.com
import { findMatch } from '../lib/face-matcher'

/**
 * Candidate shape: must have an id, faceDescriptor, and any extra fields.
 */
export interface FaceCandidate {
  id: string
  faceDescriptor: number[]
  [key: string]: unknown
}

/**
 * Configuration for the recognize handler.
 */
export interface RecognizeHandlerConfig {
  /** Fetch all active candidates with a faceDescriptor from the database */
  getCandidates: () => Promise<FaceCandidate[]>
  /** Check auth/permission — return null if OK, or a Response to deny */
  checkAuth?: (req: Request) => Promise<Response | null>
  /** Get the matching distance threshold (default: 0.6) */
  getThreshold?: () => Promise<number>
  /** Check if face recognition is enabled (default: always true) */
  isEnabled?: () => Promise<boolean>
  /** Fields to return from the matched candidate (default: all except faceDescriptor) */
  publicFields?: string[]
}

/**
 * Factory for POST /api/face/recognize
 *
 * Receives a 128-float face descriptor, searches candidates, returns best match.
 */
export function createRecognizeHandler(config: RecognizeHandlerConfig) {
  async function POST(req: Request) {
    // Check if enabled
    if (config.isEnabled) {
      const enabled = await config.isEnabled()
      if (!enabled) {
        return Response.json(
          { error: { code: 'FEATURE_DISABLED', message: 'Face recognition is disabled' } },
          { status: 403 },
        )
      }
    }

    // Check auth
    if (config.checkAuth) {
      const denied = await config.checkAuth(req)
      if (denied) return denied
    }

    // Parse body
    let body: { faceDescriptor?: unknown }
    try {
      body = await req.json()
    } catch {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON' } },
        { status: 400 },
      )
    }

    // Validate descriptor
    const desc = body.faceDescriptor
    if (
      !Array.isArray(desc) ||
      desc.length !== 128 ||
      !desc.every((v) => typeof v === 'number')
    ) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'faceDescriptor must be an array of 128 numbers' } },
        { status: 400 },
      )
    }

    // Get candidates
    const candidates = await config.getCandidates()
    if (candidates.length === 0) {
      return Response.json({
        data: { match: false, message: 'No candidates with face data' },
      })
    }

    // Find match
    const threshold = config.getThreshold ? await config.getThreshold() : 0.6
    const result = findMatch(desc, candidates, threshold)

    if (result) {
      // Strip faceDescriptor from response
      const { faceDescriptor: _fd, ...publicData } = result.match as Record<string, unknown>
      const filtered = config.publicFields
        ? Object.fromEntries(
            Object.entries(publicData).filter(([k]) => config.publicFields!.includes(k) || k === 'id'),
          )
        : publicData

      return Response.json({
        data: {
          match: true,
          distance: Math.round(result.distance * 1000) / 1000,
          candidate: filtered,
        },
      })
    }

    // No match — still report best distance for debugging
    let bestDistance: number | null = null
    for (const c of candidates) {
      if (!c.faceDescriptor || c.faceDescriptor.length !== 128) continue
      let sum = 0
      for (let i = 0; i < 128; i++) {
        const diff = desc[i] - c.faceDescriptor[i]
        sum += diff * diff
      }
      const d = Math.sqrt(sum)
      if (bestDistance === null || d < bestDistance) bestDistance = d
    }

    return Response.json({
      data: {
        match: false,
        distance: bestDistance !== null ? Math.round(bestDistance * 1000) / 1000 : null,
      },
    })
  }

  return { POST }
}
