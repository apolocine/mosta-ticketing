// @mostajs/ticketing — Detect API route factory (from @mostajs/face)
// Author: Dr Hamid MADANI drmdh@msn.com

/**
 * Configuration for the detect handler.
 */
export interface DetectHandlerConfig {
  /** Check auth/permission — return null if OK, or a Response to deny */
  checkAuth?: (req: Request) => Promise<Response | null>
  /** Check if face recognition is enabled (default: always true) */
  isEnabled?: () => Promise<boolean>
}

/**
 * Factory for POST /api/face/detect
 *
 * Placeholder endpoint — face detection runs client-side via face-api.js.
 * This route exists for permission gating and future server-side detection.
 */
export function createDetectHandler(config: DetectHandlerConfig = {}) {
  async function POST(req: Request) {
    if (config.isEnabled) {
      const enabled = await config.isEnabled()
      if (!enabled) {
        return Response.json(
          { error: { code: 'FEATURE_DISABLED', message: 'Face recognition is disabled' } },
          { status: 403 },
        )
      }
    }

    if (config.checkAuth) {
      const denied = await config.checkAuth(req)
      if (denied) return denied
    }

    return Response.json({
      data: {
        message: 'Face detection runs client-side. Use the FaceDetector component or useFaceDetection hook.',
        hint: 'For recognition, send the descriptor to POST /api/face/recognize',
      },
    })
  }

  return { POST }
}
