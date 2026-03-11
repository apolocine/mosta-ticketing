// @mostajs/ticketing — useCamera hook (from @mostajs/face)
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

interface UseCameraOptions {
  facingMode?: 'user' | 'environment'
  width?: number
  height?: number
  autoStart?: boolean
}

export function useCamera(options?: UseCameraOptions) {
  const { facingMode = 'user', width = 640, height = 480, autoStart = false } = options || {}
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async () => {
    try {
      setStatus('requesting')
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: width }, height: { ideal: height } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      setStream(mediaStream)
      setStatus('active')
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setStatus('denied')
        setError('Camera permission denied')
      } else {
        setStatus('error')
        setError(err.message || 'Camera error')
      }
    }
  }, [facingMode, width, height])

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus('idle')
  }, [stream])

  const switchCamera = useCallback(async () => {
    stop()
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode, width: { ideal: width }, height: { ideal: height } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      setStream(mediaStream)
      setStatus('active')
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }, [stop, facingMode, width, height])

  useEffect(() => {
    if (autoStart) start()
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { videoRef, stream, status, error, start, stop, switchCamera }
}
