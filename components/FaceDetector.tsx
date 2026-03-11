// @mostajs/ticketing — FaceDetector component (from @mostajs/face)
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { loadModels, detectFace, extractDescriptor } from '../lib/face-api'
import { compareFaces } from '../lib/face-matcher'
import { drawDetection } from '../lib/face-utils'

export interface FaceDetectorProps {
  /** Existing photo (base64) */
  photo: string
  /** Callback when a photo is captured */
  onCapture: (data: { photo: string; faceDescriptor: number[] | null }) => void
  /** Callback when photo is cleared */
  onClear: () => void
  /** Verification mode: compare against existing descriptor */
  verifyDescriptor?: number[]
  /** Callback with verification result */
  onVerifyResult?: (result: { match: boolean; distance: number } | null) => void
  /** Enable face detection (default: true) */
  enabled?: boolean
  /** Match threshold (default: 0.6) */
  threshold?: number
  /** Require face detected before capture (default: true) */
  requireForCapture?: boolean
  /** Error callback instead of console.error */
  onError?: (message: string) => void
}

export default function FaceDetector({
  photo,
  onCapture,
  onClear,
  verifyDescriptor,
  onVerifyResult,
  enabled = true,
  threshold = 0.6,
  requireForCapture = true,
  onError,
}: FaceDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const [streaming, setStreaming] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ match: boolean; distance: number } | null>(null)

  const reportError = useCallback((msg: string) => {
    if (onError) onError(msg)
    else console.error('[FaceDetector]', msg)
  }, [onError])

  // Load face-api models on mount
  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function init() {
      setLoadingModels(true)
      try {
        await loadModels()
        if (!cancelled) setModelsReady(true)
      } catch (err) {
        console.error('Face-api model loading error:', err)
        if (!cancelled) reportError('Impossible de charger les modeles de detection faciale')
      } finally {
        if (!cancelled) setLoadingModels(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [enabled, reportError])

  // Real-time detection loop
  const detectLoop = useCallback(async () => {
    if (!videoRef.current || !overlayRef.current) return
    if (videoRef.current.paused || videoRef.current.ended) return

    const video = videoRef.current
    const overlay = overlayRef.current
    const detection = await detectFace(video)
    setFaceDetected(!!detection)

    if (!videoRef.current || !overlayRef.current) return
    drawDetection(overlay, detection, video.videoWidth, video.videoHeight)

    animFrameRef.current = requestAnimationFrame(detectLoop)
  }, [])

  const startCamera = useCallback(async () => {
    setVerifyResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      })
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      videoRef.current.srcObject = stream
      await videoRef.current.play().catch(() => {})
      setStreaming(true)

      if (enabled && modelsReady) {
        videoRef.current.onloadeddata = () => {
          animFrameRef.current = requestAnimationFrame(detectLoop)
        }
      }
    } catch {
      reportError("Impossible d'acceder a la camera")
    }
  }, [enabled, modelsReady, detectLoop, reportError])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setStreaming(false)
    setFaceDetected(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      const video = videoRef.current
      if (video) {
        video.pause()
        const stream = video.srcObject as MediaStream | null
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }
        video.srcObject = null
        video.removeAttribute('src')
        video.load()
      }
    }
  }, [])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

    let descriptor: number[] | null = null
    if (enabled && modelsReady) {
      try {
        const raw = await extractDescriptor(canvas)
        if (raw) descriptor = Array.from(raw)
      } catch (err) {
        console.error('Descriptor extraction error:', err)
      }
    }

    stopCamera()
    onCapture({ photo: dataUrl, faceDescriptor: descriptor })
  }, [enabled, modelsReady, stopCamera, onCapture])

  const verifyFace = useCallback(async () => {
    if (!videoRef.current || !verifyDescriptor) return

    try {
      const raw = await extractDescriptor(videoRef.current)
      if (!raw) {
        setVerifyResult(null)
        onVerifyResult?.(null)
        reportError('Aucun visage detecte')
        return
      }

      const distance = compareFaces(raw, verifyDescriptor)
      const match = distance < threshold
      const result = { match, distance }
      setVerifyResult(result)
      onVerifyResult?.(result)
    } catch (err) {
      console.error('Face verification error:', err)
      reportError('Erreur lors de la verification')
    }
  }, [verifyDescriptor, onVerifyResult, threshold, reportError])

  const captureDisabled = enabled && requireForCapture && !faceDetected

  // Basic webcam mode (face detection disabled)
  if (!enabled) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {photo ? (
          <div style={{ position: 'relative' }}>
            <img src={photo} alt="Photo" style={{ width: '100%', borderRadius: '0.5rem' }} />
            <button
              type="button"
              onClick={onClear}
              style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
            >
              x
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', borderRadius: '0.5rem', display: streaming ? 'block' : 'none' }}
              autoPlay
              playsInline
              muted
            />
            {streaming ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={capturePhoto} style={{ flex: 1, padding: '0.5rem', cursor: 'pointer' }}>
                  Capturer
                </button>
                <button type="button" onClick={stopCamera} style={{ padding: '0.5rem', cursor: 'pointer' }}>
                  x
                </button>
              </div>
            ) : (
              <button type="button" onClick={startCamera} style={{ width: '100%', padding: '0.5rem', cursor: 'pointer' }}>
                Prendre photo
              </button>
            )}
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    )
  }

  // Full face detection mode
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {photo ? (
        <div style={{ position: 'relative' }}>
          <img src={photo} alt="Photo" style={{ width: '100%', borderRadius: '0.5rem' }} />
          <button
            type="button"
            onClick={onClear}
            style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
          >
            x
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Video + overlay container */}
          <div style={{ position: 'relative', display: streaming ? 'block' : 'none' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', borderRadius: '0.5rem' }}
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={overlayRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />
            {/* Detection indicator */}
            <div style={{
              position: 'absolute', bottom: 8, left: 8,
              padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
              background: faceDetected ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
              color: 'white',
            }}>
              {faceDetected ? 'Visage detecte' : 'Aucun visage'}
            </div>
          </div>

          {streaming ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {verifyDescriptor ? (
                <button
                  type="button"
                  onClick={verifyFace}
                  disabled={!faceDetected}
                  style={{ flex: 1, padding: '0.5rem', cursor: faceDetected ? 'pointer' : 'not-allowed', opacity: faceDetected ? 1 : 0.5 }}
                >
                  Verifier visage
                </button>
              ) : (
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={captureDisabled}
                  style={{ flex: 1, padding: '0.5rem', cursor: captureDisabled ? 'not-allowed' : 'pointer', opacity: captureDisabled ? 0.5 : 1 }}
                >
                  {captureDisabled ? 'Cadrez votre visage...' : 'Capturer'}
                </button>
              )}
              <button type="button" onClick={stopCamera} style={{ padding: '0.5rem', cursor: 'pointer' }}>
                x
              </button>
            </div>
          ) : (
            <div>
              {loadingModels ? (
                <button type="button" disabled style={{ width: '100%', padding: '0.5rem', opacity: 0.5 }}>
                  Chargement detection faciale...
                </button>
              ) : (
                <button type="button" onClick={startCamera} style={{ width: '100%', padding: '0.5rem', cursor: 'pointer' }}>
                  {verifyDescriptor ? 'Verifier visage' : 'Prendre photo'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Verification result */}
      {verifyResult && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem', borderRadius: '0.5rem', fontSize: 14, fontWeight: 500,
          background: verifyResult.match ? '#f0fdf4' : '#fef2f2',
          color: verifyResult.match ? '#15803d' : '#b91c1c',
          border: `1px solid ${verifyResult.match ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {verifyResult.match
            ? `Visage verifie (confiance: ${Math.round((1 - verifyResult.distance) * 100)}%)`
            : `Visage non reconnu (distance: ${verifyResult.distance.toFixed(2)})`
          }
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
