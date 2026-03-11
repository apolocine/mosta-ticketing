// @mostajs/ticketing — useScan hook (from @mostajs/scan)
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { playGranted, playDenied } from '../lib/audio'
import type { ScanResultData, UseScanOptions, UseScanReturn } from '../types/index'

/**
 * Hook that manages QR code scanning lifecycle.
 *
 * Uses html5-qrcode under the hood. The scanner renders into a DOM element
 * with id="qr-reader" — make sure this element exists in your component.
 */
export function useScan(options: UseScanOptions = {}): UseScanReturn {
  const {
    apiEndpoint = '/api/scan',
    audioFeedback = true,
    soundFrequencies = [800, 300],
    onResult,
    onError,
  } = options

  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ScanResultData | null>(null)
  const scannerRef = useRef<any>(null)
  const processingRef = useRef(false)

  const handleScan = useCallback(async (qrCode: string) => {
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, scanMethod: 'webcam' }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        const msg = err?.error?.message || `Server error (${res.status})`
        const denied: ScanResultData = { result: 'denied', reason: msg }
        setResult(denied)
        if (audioFeedback) playDenied(soundFrequencies[1])
        onResult?.(denied)
        return
      }

      const json = await res.json()
      const data: ScanResultData = json.data
      setResult(data)

      if (audioFeedback) {
        if (data.result === 'granted') playGranted(soundFrequencies[0])
        else playDenied(soundFrequencies[1])
      }

      onResult?.(data)
    } catch {
      const denied: ScanResultData = { result: 'denied', reason: 'Connection error' }
      setResult(denied)
      if (audioFeedback) playDenied(soundFrequencies[1])
      onResult?.(denied)
    }
  }, [apiEndpoint, audioFeedback, soundFrequencies, onResult])

  const startScanner = useCallback(async () => {
    setResult(null)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          if (processingRef.current) return
          processingRef.current = true
          setProcessing(true)
          await scanner.stop()
          setScanning(false)
          await handleScan(decodedText)
          processingRef.current = false
          setProcessing(false)
        },
        () => {}
      )
      setScanning(true)
    } catch (err: any) {
      const msg = String(err?.message || err || '')
      if (msg.includes('NotFound') || msg.includes('Requested device not found') || msg.includes('no camera')) {
        onError?.('Camera not found. Check your camera connection.')
      } else if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        onError?.('Camera access denied. Allow camera access in browser settings.')
      } else {
        onError?.(msg || 'Failed to start scanner')
      }
    }
  }, [handleScan, onError])

  const stopScanner = useCallback(() => {
    scannerRef.current?.stop().catch(() => {})
    setScanning(false)
  }, [])

  const resetResult = useCallback(() => {
    setResult(null)
  }, [])

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  return { scanning, processing, result, startScanner, stopScanner, resetResult }
}
