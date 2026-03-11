// @mostajs/ticketing — useFaceDetection hook (from @mostajs/face)
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MostaFaceConfig } from '../types'

export type DetectionStatus = 'loading' | 'detecting' | 'detected' | 'noFace'

interface UseFaceDetectionOptions {
  /** Interval between detections in ms (default: 300) */
  interval?: number
  /** Auto-start detection (default: true) */
  autoStart?: boolean
  /** Also extract descriptor on each frame (default: false) */
  extractDescriptor?: boolean
  /** Face-api config */
  config?: MostaFaceConfig
}

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options?: UseFaceDetectionOptions,
) {
  const { interval = 300, autoStart = true, extractDescriptor: doExtract = false, config } = options || {}
  const [detection, setDetection] = useState<any>(null)
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null)
  const [status, setStatus] = useState<DetectionStatus>('loading')
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const running = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadAndStart = useCallback(async () => {
    const faceApi = await import('../lib/face-api')
    await faceApi.loadModels(config)
    setModelsLoaded(true)
    setStatus('detecting')
    running.current = true

    const detect = async () => {
      if (!running.current || !videoRef.current) return
      const video = videoRef.current
      if (video.readyState < 2) {
        timerRef.current = setTimeout(detect, interval)
        return
      }

      const det = await faceApi.detectFace(video, config)
      setDetection(det)

      if (det) {
        setStatus('detected')
        if (doExtract) {
          const desc = await faceApi.extractDescriptor(video, config)
          setDescriptor(desc)
        }
      } else {
        setStatus('noFace')
        setDescriptor(null)
      }

      if (running.current) {
        timerRef.current = setTimeout(detect, interval)
      }
    }

    detect()
  }, [videoRef, interval, doExtract, config])

  useEffect(() => {
    if (autoStart) loadAndStart()
    return () => {
      running.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [autoStart, loadAndStart])

  const stop = useCallback(() => {
    running.current = false
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { detection, descriptor, status, modelsLoaded, stop, start: loadAndStart }
}
