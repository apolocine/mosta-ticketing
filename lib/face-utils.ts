// @mostajs/ticketing — Face utility functions (from @mostajs/face)
// Author: Dr Hamid MADANI drmdh@msn.com

/** Convert Float32Array descriptor to number[] for JSON/DB storage */
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor)
}

/** Convert number[] back to Float32Array for comparison */
export function arrayToDescriptor(arr: number[]): Float32Array {
  return new Float32Array(arr)
}

/** Validate that a descriptor is valid (128 elements) */
export function isValidDescriptor(data: unknown): boolean {
  if (data instanceof Float32Array) return data.length === 128
  if (Array.isArray(data)) return data.length === 128 && data.every((v) => typeof v === 'number')
  return false
}

/**
 * Draw a detection bounding box + score on a canvas overlay.
 */
export function drawDetection(
  canvas: HTMLCanvasElement,
  detection: { detection: { score: number; box: { x: number; y: number; width: number; height: number } } } | null,
  videoWidth: number,
  videoHeight: number,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = videoWidth
  canvas.height = videoHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!detection) return

  const box = detection.detection.box
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 3
  ctx.strokeRect(box.x, box.y, box.width, box.height)

  const score = Math.round(detection.detection.score * 100)
  ctx.fillStyle = '#22c55e'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText(`Visage ${score}%`, box.x, box.y - 6)
}
