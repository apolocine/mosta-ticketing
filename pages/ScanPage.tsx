'use client'
// @mostajs/ticketing — ScanPage (from @mostajs/scan)
// Author: Dr Hamid MADANI drmdh@msn.com
import { useState } from 'react'

export default function ScanPage() {
  const [qrCode, setQrCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleScan() {
    if (!qrCode.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      })
      setResult(await res.json())
    } catch {
      setResult({ error: 'Erreur reseau' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Scanner</h1>
      <div className="flex gap-2">
        <input type="text" value={qrCode} onChange={(e) => setQrCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="Code QR du ticket..." className="flex-1 px-3 py-2 border rounded-md" />
        <button onClick={handleScan} disabled={loading || !qrCode.trim()}
          className="px-4 py-2 bg-sky-600 text-white rounded-md disabled:opacity-50">
          {loading ? 'Scan...' : 'Valider'}
        </button>
      </div>
      {result && (
        <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
