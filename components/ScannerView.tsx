// @mostajs/ticketing — ScannerView component (from @mostajs/scan)
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { ScanLine, Camera, RefreshCw } from 'lucide-react'
import { useScan } from '../hooks/useScan'
import type { ScannerViewProps } from '../types/index'

/**
 * Self-contained QR scanner view with start/stop controls.
 *
 * Renders a camera view + controls. When a QR code is detected,
 * it calls the configured API endpoint and fires `onResult`.
 */
export default function ScannerView({
  apiEndpoint = '/api/scan',
  onResult,
  onError,
  startLabel = 'Start Scanner',
  stopLabel = 'Stop',
  soundFrequencies,
}: ScannerViewProps) {
  const { scanning, result, startScanner, stopScanner } = useScan({
    apiEndpoint,
    onResult,
    onError,
    soundFrequencies,
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ScanLine style={{ width: 20, height: 20 }} />
        <span className="font-semibold">Scanner</span>
      </div>

      <div
        id="qr-reader"
        style={{
          width: '100%',
          minHeight: 300,
          backgroundColor: '#111827',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      />

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        {!scanning ? (
          <button
            onClick={startScanner}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Camera style={{ width: 16, height: 16 }} />
            {startLabel}
          </button>
        ) : (
          <button
            onClick={stopScanner}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {stopLabel}
          </button>
        )}

        {result && (
          <button
            onClick={startScanner}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 12px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>
    </div>
  )
}
