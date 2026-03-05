// @mostajs/ticketing — Scan route factory
// Author: Dr Hamid MADANI drmdh@msn.com
import { processScan } from '../lib/scan-processor';
import type { ScanHandlerConfig, ScanMethod } from '../types/index';

/**
 * Factory: creates a POST handler for ticket scanning.
 *
 * The host app injects its repositories, auth check, and optional audit callbacks.
 *
 * ```ts
 * // src/app/api/scan/route.ts
 * import { createScanHandler } from '@mostajs/ticketing/api/scan.route'
 * export const { POST } = createScanHandler({ ... })
 * ```
 */
export function createScanHandler(config: ScanHandlerConfig) {
  async function POST(req: Request) {
    const { error, userId } = await config.checkAuth(req);
    if (error) return error;

    const body = await req.json();
    const { code, qrCode, scanMethod = 'webcam' } = body;

    // Support both "code" (generic) and "qrCode" (legacy) field names
    const codeValue = code || qrCode;
    if (!codeValue) {
      return Response.json(
        { error: { code: 'INVALID', message: 'Code manquant' } },
        { status: 400 },
      );
    }

    const repos = await config.getRepositories();

    const resolveId = (ref: any): string => {
      if (!ref) return '';
      if (typeof ref === 'string') return ref;
      return ref.id ?? ref._id ?? String(ref);
    };

    const result = await processScan(codeValue, scanMethod as ScanMethod, userId, {
      findTicketByCode: (c) => repos.ticketRepo.findByCode?.(c) ?? repos.ticketRepo.findOne({ code: c }),
      findAccessById: (id) => repos.clientAccessRepo.findById(id),
      findClientById: (id) => repos.clientRepo.findById(id),
      wasScannedToday: async (ticketId) => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const log = await repos.scanLogRepo.findOne({
          ticket: ticketId,
          result: 'granted',
          timestamp: { $gte: start },
        });
        return log !== null;
      },
      updateTicket: (id, data) => repos.ticketRepo.update(id, data),
      updateAccess: (id, data) => repos.clientAccessRepo.update(id, data),
      createScanLog: (data) => repos.scanLogRepo.create(data),
      resolveId,
      formatClientName: (client) => `${client.firstName} ${client.lastName}`,
    });

    if (result.result === 'granted' && config.onGranted) {
      await config.onGranted({
        ticket: result.ticket,
        client: result.client,
        access: result.access,
        isReentry: result.isReentry,
        userId,
      });
    }

    if (result.result === 'denied' && config.onDenied) {
      await config.onDenied({
        reason: result.reason,
        ticket: result.ticket,
        userId,
      });
    }

    return Response.json({ data: result });
  }

  return { POST };
}
