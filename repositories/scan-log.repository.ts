// ScanLogRepository
// @mostajs/ticketing
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm';
import { ScanLogSchema } from '../schemas/scan-log.schema';
import type { IDialect, QueryOptions } from '@mostajs/orm';

export interface ScanLogDTO {
  id: string;
  ticket: any;
  client: any;
  activity: any;
  scannedBy: any;
  scanMethod: string;
  result: 'granted' | 'denied';
  denyReason: string | null;
  quotaBefore: number | null;
  quotaAfter: number | null;
  isReentry: boolean;
  timestamp: string;
}

export class ScanLogRepository extends BaseRepository<ScanLogDTO> {
  constructor(dialect: IDialect) {
    super(ScanLogSchema, dialect);
  }

  /** Find recent scan logs with ticket & scannedBy populated */
  async findRecent(filter: Record<string, unknown> = {}, options?: QueryOptions): Promise<ScanLogDTO[]> {
    return this.findWithRelations(
      filter,
      ['ticket', 'scannedBy'],
      { sort: { timestamp: -1 }, ...options },
    );
  }

  /** Find scan history for a specific client */
  async findByClient(clientId: string, options?: QueryOptions): Promise<ScanLogDTO[]> {
    return this.findWithRelations(
      { client: clientId },
      ['ticket', 'activity', 'scannedBy'],
      { sort: { timestamp: -1 }, ...options },
    );
  }

  /** Count all scans for today */
  async countToday(): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.count({ timestamp: { $gte: start } });
  }

  /** Count granted scans for today */
  async countGrantedToday(): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.count({ result: 'granted', timestamp: { $gte: start } });
  }

  /** Get distinct clients with granted scans today (visitors present) */
  async findDistinctClientsToday(): Promise<unknown[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.distinct('client', { result: 'granted', timestamp: { $gte: start } });
  }

  /** Check if a ticket was already scanned today (for day_reentry) */
  async wasScannedToday(ticketId: string): Promise<boolean> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const log = await this.findOne({
      ticket: ticketId,
      result: 'granted',
      timestamp: { $gte: start },
    });
    return log !== null;
  }
}
