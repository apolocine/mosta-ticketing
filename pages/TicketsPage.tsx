'use client'
// @mostajs/ticketing — TicketsPage
// Author: Dr Hamid MADANI drmdh@msn.com
import { useEffect, useState } from 'react'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tickets').then(r => r.json()).then(d => { setTickets(d.data || []); setLoading(false) })
  }, [])

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tickets</h1>
      <div className="grid gap-2">
        {tickets.map((t: any) => (
          <div key={t.id} className={`p-3 border rounded ${t.status === 'active' ? 'bg-green-50' : 'bg-gray-50'}`}>
            #{t.ticketNumber} — {t.clientName} — {t.activityName} — {t.status}
          </div>
        ))}
      </div>
    </div>
  )
}
