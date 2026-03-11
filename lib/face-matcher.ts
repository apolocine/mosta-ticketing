// @mostajs/ticketing — Face comparison and matching (from @mostajs/face)
// Author: Dr Hamid MADANI drmdh@msn.com
import type { FaceDescriptor, FaceMatchResult } from '../types'

/**
 * Compute Euclidean distance between two 128-dim face descriptors.
 */
export function compareFaces(
  d1: FaceDescriptor,
  d2: FaceDescriptor,
): number {
  const a = d1 instanceof Float32Array ? d1 : new Float32Array(d1)
  const b = d2 instanceof Float32Array ? d2 : new Float32Array(d2)

  if (a.length !== 128 || b.length !== 128) {
    throw new Error('Descriptors must be 128 elements')
  }

  let sum = 0
  for (let i = 0; i < 128; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

/**
 * Find the best match among candidates.
 * Returns null if no match is below the threshold.
 */
export function findMatch<T extends { faceDescriptor: number[] }>(
  descriptor: FaceDescriptor,
  candidates: T[],
  threshold = 0.6,
): FaceMatchResult<T> | null {
  let bestMatch: T | null = null
  let bestDistance = Infinity

  for (const candidate of candidates) {
    if (!candidate.faceDescriptor || candidate.faceDescriptor.length !== 128) continue
    const distance = compareFaces(descriptor, candidate.faceDescriptor)
    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = candidate
    }
  }

  if (bestMatch && bestDistance < threshold) {
    return { match: bestMatch, distance: bestDistance }
  }

  return null
}

/**
 * Find all matches below the threshold, sorted by distance.
 */
export function findAllMatches<T extends { faceDescriptor: number[] }>(
  descriptor: FaceDescriptor,
  candidates: T[],
  threshold = 0.6,
): FaceMatchResult<T>[] {
  const results: FaceMatchResult<T>[] = []

  for (const candidate of candidates) {
    if (!candidate.faceDescriptor || candidate.faceDescriptor.length !== 128) continue
    const distance = compareFaces(descriptor, candidate.faceDescriptor)
    if (distance < threshold) {
      results.push({ match: candidate, distance })
    }
  }

  return results.sort((a, b) => a.distance - b.distance)
}
