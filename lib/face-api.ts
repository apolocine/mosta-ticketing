// @mostajs/ticketing — Core face-api.js service (from @mostajs/face, CLIENT-SIDE only)
// Author: Dr Hamid MADANI drmdh@msn.com

import type { MostaFaceConfig } from '../types'

let fapi: typeof import('@vladmandic/face-api') | null = null
let modelsLoaded = false

/**
 * Load the face-api.js library and 3 models (TinyFaceDetector, landmarks68, recognition).
 */
export async function loadModels(config?: MostaFaceConfig): Promise<void> {
  if (modelsLoaded) return

  fapi = await import('@vladmandic/face-api')
  const modelUrl = config?.modelsPath ?? '/models/face-api'

  await Promise.all([
    fapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
    fapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    fapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
  ])

  modelsLoaded = true
}

/** Check if models are loaded */
export function isLoaded(): boolean {
  return modelsLoaded
}

/**
 * Detect a single face with landmarks.
 */
export async function detectFace(
  input: HTMLVideoElement | HTMLCanvasElement,
  config?: MostaFaceConfig,
) {
  if (!fapi) throw new Error('face-api not loaded — call loadModels() first')

  const detection = await fapi
    .detectSingleFace(
      input,
      new fapi.TinyFaceDetectorOptions({
        inputSize: config?.inputSize ?? 320,
        scoreThreshold: config?.scoreThreshold ?? 0.5,
      }),
    )
    .withFaceLandmarks()

  return detection || null
}

/**
 * Detect all faces with landmarks.
 */
export async function detectAllFaces(
  input: HTMLVideoElement | HTMLCanvasElement,
  config?: MostaFaceConfig,
) {
  if (!fapi) throw new Error('face-api not loaded — call loadModels() first')

  return fapi
    .detectAllFaces(
      input,
      new fapi.TinyFaceDetectorOptions({
        inputSize: config?.inputSize ?? 320,
        scoreThreshold: config?.scoreThreshold ?? 0.5,
      }),
    )
    .withFaceLandmarks()
}

/**
 * Extract the 128-dimensional face descriptor from a single face.
 */
export async function extractDescriptor(
  input: HTMLVideoElement | HTMLCanvasElement,
  config?: MostaFaceConfig,
): Promise<Float32Array | null> {
  if (!fapi) throw new Error('face-api not loaded — call loadModels() first')

  const result = await fapi
    .detectSingleFace(
      input,
      new fapi.TinyFaceDetectorOptions({
        inputSize: config?.inputSize ?? 320,
        scoreThreshold: config?.scoreThreshold ?? 0.5,
      }),
    )
    .withFaceLandmarks()
    .withFaceDescriptor()

  return result?.descriptor || null
}
