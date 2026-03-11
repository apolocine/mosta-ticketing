// @mostajs/ticketing — ScanResultCard component (from @mostajs/scan)
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { ScanLine } from 'lucide-react'
import type { ScanResultCardProps, ScanResultData } from '../types/index'

const colors = {
  granted: { bg: '#f0fdf4', text: '#15803d', border: '#22c55e', badge: '#166534' },
  reentry: { bg: '#eff6ff', text: '#1d4ed8', border: '#3b82f6', badge: '#1e40af' },
  denied:  { bg: '#fef2f2', text: '#dc2626', border: '#ef4444', badge: '#991b1b' },
}

function getColors(data: ScanResultData) {
  if (data.result === 'granted') return data.isReentry ? colors.reentry : colors.granted
  return colors.denied
}

/**
 * Displays the result of a ticket scan (granted, denied, or reentry).
 */
export default function ScanResultCard({
  data,
  t = (key) => key,
  renderExtra,
}: ScanResultCardProps) {
  const c = getColors(data)

  return (
    <div
      style={{
        border: `2px solid ${c.border}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 24 }}>
        {/* Status banner */}
        <div
          style={{
            textAlign: 'center',
            padding: 24,
            borderRadius: 8,
            backgroundColor: c.bg,
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, color: c.text }}>
            {data.result === 'granted' ? (data.isReentry ? '\u{1f504}' : '\u{2705}') : '\u{274c}'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: c.text }}>
            {data.isReentry
              ? t('scan.result.reentry')
              : t(`scan.result.${data.result}`)}
          </div>
          {data.isReentry && (
            <div style={{ fontSize: 14, marginTop: 4, color: c.text }}>
              {t('scan.result.reentryHint')}
            </div>
          )}
          {data.reason && (
            <div style={{ fontSize: 14, marginTop: 8, color: colors.denied.text }}>
              {data.reason.startsWith('ticket_') || data.reason.startsWith('quota_') ||
               data.reason.startsWith('access_') || data.reason.startsWith('client_') ||
               data.reason === 'invalid_ticket'
                ? t(`scan.denyReasons.${data.reason}`)
                : data.reason}
            </div>
          )}
        </div>

        {/* Client info */}
        {data.client && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {data.client.photo ? (
                <img
                  src={data.client.photo}
                  alt=""
                  style={{
                    width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    backgroundColor: '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: '#6b7280',
                  }}
                >
                  {data.client.name.charAt(0)}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700 }}>{data.client.name}</div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>{data.client.clientNumber}</div>
              </div>
            </div>

            {data.ticket && (
              <div style={{ fontSize: 14, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#6b7280' }}>{t('scan.info.activity')}</span>
                  <span style={{ fontWeight: 500 }}>{data.ticket.activityName}</span>
                </div>
                {data.access && data.access.remainingQuota != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#6b7280' }}>{t('scan.info.quotaRemaining')}</span>
                    <span style={{ fontWeight: 700, fontSize: 18 }}>{data.access.remainingQuota}</span>
                  </div>
                )}
                {data.ticket.ticketType === 'cadeau' && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {t('tickets.types.cadeau')}
                  </span>
                )}
              </div>
            )}

            {renderExtra?.(data)}
          </div>
        )}
      </div>
    </div>
  )
}

/** Empty state placeholder when no scan result yet */
export function ScanEmptyState({ message }: { message?: string }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '48px 24px',
        textAlign: 'center',
        color: '#9ca3af',
      }}
    >
      <ScanLine style={{ width: 48, height: 48, margin: '0 auto 16px' }} />
      <p>{message || 'Scan a QR ticket to verify access'}</p>
    </div>
  )
}
