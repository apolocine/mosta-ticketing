// @mostajs/ticketing — Scan processor (core business logic, zero framework coupling)
// Author: Dr Hamid MADANI drmdh@msn.com
import { decrementQuota } from './quota-manager';
import type { ScanOutput, DenyReason, TicketInfo, ScanMethod } from '../types/index';

// ── Dependency injection interfaces ────────────────────────────────
// The host app injects these — no direct import of DB, ORM, or framework

export interface ScanDeps {
  /** Find ticket by code value (QR code, barcode, etc.) */
  findTicketByCode: (code: string) => Promise<any | null>;
  /** Find client access by ID */
  findAccessById: (id: string) => Promise<any | null>;
  /** Find client by ID */
  findClientById: (id: string) => Promise<any | null>;
  /** Check if this ticket was already scanned (granted) today */
  wasScannedToday: (ticketId: string) => Promise<boolean>;
  /** Update ticket fields */
  updateTicket: (id: string, data: Record<string, any>) => Promise<void>;
  /** Update client access fields */
  updateAccess: (id: string, data: Record<string, any>) => Promise<void>;
  /** Create a scan log entry */
  createScanLog: (data: Record<string, any>) => Promise<void>;
  /** Extract the raw ID from a relation field (may be object or string) */
  resolveId: (ref: any) => string;
  /** Format a client's display name */
  formatClientName: (client: any) => string;
}

// ── Main scan processing pipeline ──────────────────────────────────

/**
 * Process a ticket scan through the 8-step validation pipeline.
 *
 * This is a pure business-logic function with zero coupling to any framework,
 * ORM, or database. All I/O is performed via the injected `deps` callbacks.
 *
 * Steps:
 * 1. Find ticket by code
 * 2. Check ticket status
 * 3. Check validUntil expiry
 * 4. Load client access
 * 5. Check client status
 * 6. Process validity mode (day_reentry / single_use / time_slot / unlimited)
 * 7. Update ticket + access, create scan log
 * 8. Return result
 */
export async function processScan(
  code: string,
  scanMethod: ScanMethod,
  scannedBy: string,
  deps: ScanDeps,
): Promise<ScanOutput> {

  // 1. Find ticket
  const ticket = await deps.findTicketByCode(code);
  if (!ticket) {
    await deps.createScanLog({
      scannedBy,
      scanMethod,
      result: 'denied',
      denyReason: 'invalid_ticket',
      timestamp: new Date(),
    });
    return { result: 'denied', reason: 'invalid_ticket' };
  }

  const ticketId = deps.resolveId(ticket.id ?? ticket._id);

  // 2. Check ticket status
  if (ticket.status === 'used' && ticket.validityMode !== 'day_reentry') {
    await createDeniedLog(deps, ticket, scannedBy, scanMethod, 'ticket_already_used');
    return { result: 'denied', reason: 'ticket_already_used', ticket: extractTicketInfo(ticket) };
  }

  if (ticket.status === 'expired' || ticket.status === 'cancelled') {
    const reason = `ticket_${ticket.status}` as DenyReason;
    await createDeniedLog(deps, ticket, scannedBy, scanMethod, reason);
    return { result: 'denied', reason, ticket: extractTicketInfo(ticket) };
  }

  // 3. Check validUntil
  if (ticket.validUntil && new Date() > new Date(ticket.validUntil)) {
    await deps.updateTicket(ticketId, { status: 'expired' });
    await createDeniedLog(deps, ticket, scannedBy, scanMethod, 'ticket_expired');
    return { result: 'denied', reason: 'ticket_expired', ticket: extractTicketInfo(ticket) };
  }

  // 4. Load client access
  const accessId = deps.resolveId(ticket.clientAccess);
  const clientAccess = await deps.findAccessById(accessId);
  if (!clientAccess || clientAccess.status !== 'active') {
    const reason: DenyReason = clientAccess?.status === 'depleted' ? 'quota_depleted' : 'access_expired';
    await createDeniedLog(deps, ticket, scannedBy, scanMethod, reason);
    return { result: 'denied', reason, ticket: extractTicketInfo(ticket) };
  }

  // 5. Check client status
  const clientId = deps.resolveId(ticket.client);
  const client = await deps.findClientById(clientId);
  if (!client || client.status !== 'active') {
    await createDeniedLog(deps, ticket, scannedBy, scanMethod, 'client_suspended');
    return { result: 'denied', reason: 'client_suspended', ticket: extractTicketInfo(ticket) };
  }

  // 6. Process validity mode
  const quotaBefore = clientAccess.remainingQuota;
  let quotaAfter = quotaBefore;
  let isReentry = false;

  const ticketUpdates: Record<string, any> = {};
  const accessUpdates: Record<string, any> = {};

  switch (ticket.validityMode) {
    case 'single_use':
    case 'time_slot':
    case 'unlimited': {
      ticketUpdates.status = 'used';
      ticketUpdates.scannedAt = new Date();
      ticketUpdates.scannedBy = scannedBy;
      const quota = decrementQuota(clientAccess.remainingQuota);
      if (quota) {
        accessUpdates.remainingQuota = quota.remainingQuota;
        quotaAfter = quota.remainingQuota;
        if (quota.status) accessUpdates.status = quota.status;
      }
      break;
    }
    case 'day_reentry': {
      const alreadyToday = await deps.wasScannedToday(ticketId);
      if (alreadyToday) {
        isReentry = true;
      } else {
        ticketUpdates.status = 'used';
        const quota = decrementQuota(clientAccess.remainingQuota);
        if (quota) {
          accessUpdates.remainingQuota = quota.remainingQuota;
          quotaAfter = quota.remainingQuota;
          if (quota.status) accessUpdates.status = quota.status;
        }
      }
      ticketUpdates.scannedAt = new Date();
      ticketUpdates.scannedBy = scannedBy;
      break;
    }
  }

  // 7. Persist updates + scan log
  await Promise.all([
    Object.keys(ticketUpdates).length > 0 ? deps.updateTicket(ticketId, ticketUpdates) : Promise.resolve(),
    Object.keys(accessUpdates).length > 0 ? deps.updateAccess(clientAccess.id, accessUpdates) : Promise.resolve(),
  ]);

  const activityId = deps.resolveId(ticket.activity);
  await deps.createScanLog({
    ticket: ticketId,
    client: clientId,
    activity: activityId,
    scannedBy,
    scanMethod,
    result: 'granted',
    quotaBefore,
    quotaAfter,
    isReentry,
    timestamp: new Date(),
  });

  // 8. Return granted result
  return {
    result: 'granted',
    isReentry,
    ticket: extractTicketInfo(ticket),
    client: {
      id: clientId,
      name: deps.formatClientName(client),
      clientNumber: client.clientNumber,
      photo: client.photo,
    },
    access: {
      remainingQuota: quotaAfter,
      totalQuota: clientAccess.totalQuota,
      endDate: clientAccess.endDate,
      status: accessUpdates.status || clientAccess.status,
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function extractTicketInfo(ticket: any): TicketInfo {
  return {
    ticketNumber: ticket.ticketNumber,
    clientName: ticket.clientName,
    activityName: ticket.activityName,
    ticketType: ticket.ticketType,
    validityMode: ticket.validityMode,
    status: ticket.status,
  };
}

async function createDeniedLog(
  deps: ScanDeps,
  ticket: any,
  scannedBy: string,
  scanMethod: ScanMethod,
  reason: string,
): Promise<void> {
  await deps.createScanLog({
    ticket: deps.resolveId(ticket.id ?? ticket._id),
    client: deps.resolveId(ticket.client),
    activity: deps.resolveId(ticket.activity),
    scannedBy,
    scanMethod,
    result: 'denied',
    denyReason: reason,
    timestamp: new Date(),
  });
}
