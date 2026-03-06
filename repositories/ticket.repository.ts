// TicketRepository
// @mostajs/ticketing
// Author: Dr Hamid MADANI drmdh@msn.com
import { randomUUID } from 'crypto';
import { BaseRepository } from '@mostajs/orm';
import { TicketSchema } from '../schemas/ticket.schema';
import { CounterSchema } from '../schemas/counter.schema';
import {
  computeCombinedDay,
  DAY_MULTIPLIER,
  MAX_SEQUENCE,
  MAX_TICKET_VALUE,
} from '../lib/ticket-number';
import type { IDialect, QueryOptions } from '@mostajs/orm';
import type { CodeFormat } from '../types/index';

export interface TicketDTO {
  id: string;
  ticketNumber: string;
  client: any;
  clientAccess: any;
  activity: any;
  ticketType: string;
  sourceClient: any;
  code: string;
  codeFormat: CodeFormat;
  clientName: string;
  activityName: string;
  validityMode: string;
  validUntil: string | null;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  scannedAt: string | null;
  scannedBy: any;
  amount: number;
  currency: string;
  printCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class TicketRepository extends BaseRepository<TicketDTO> {
  constructor(dialect: IDialect) {
    super(TicketSchema, dialect);
  }

  /**
   * Generate next ticket number in Wiegand 24-bit format.
   *
   * Format: Ticket = ((Annee % 4) x 32 + (JourAnnee % 32)) x 131072 + Sequence
   *
   * Cross-dialect: uses only BaseRepository.upsert() + BaseRepository.increment()
   * which are implemented by all @mostajs/orm dialects (Mongo, SQLite, Postgres, etc.)
   *
   * @param date - Date to encode in ticket (default: today)
   * @returns Numeric ticket number as string (e.g. "7077889")
   */
  async getNextTicketNumber(date: Date = new Date()): Promise<string> {
    const combinedDay = computeCombinedDay(date);

    const dateStr = date.toISOString().split('T')[0];
    const counterName = `ticket-${dateStr}`;
    const counterRepo = new BaseRepository<{ id: string; name: string; seq: number }>(
      CounterSchema, this.dialect
    );

    // 1. Ensure counter exists (cross-dialect: Mongo=findOneAndUpdate, SQL=findOne+create/update)
    const ensured = await counterRepo.upsert(
      { name: counterName },
      { name: counterName, seq: 0 } as any
    );

    // 2. Atomic increment with the real id returned by the dialect
    const updated = await counterRepo.increment(ensured.id, 'seq', 1);
    const seqNum = updated?.seq ?? 1;

    if (seqNum > MAX_SEQUENCE) {
      throw new Error(
        `Capacite depassee pour ${dateStr}: ${seqNum} > ${MAX_SEQUENCE}`
      );
    }

    const ticketValue = (combinedDay * DAY_MULTIPLIER) + seqNum;

    if (ticketValue > MAX_TICKET_VALUE) {
      throw new Error(`Ticket hors limite 24-bit: ${ticketValue} > ${MAX_TICKET_VALUE}`);
    }

    return String(ticketValue);
  }

  /** Create ticket with auto-generated ticketNumber and code */
  async createWithAutoFields(data: Partial<TicketDTO>): Promise<TicketDTO> {
    if (!data.ticketNumber) {
      data.ticketNumber = await this.getNextTicketNumber();
    }
    if (!data.codeFormat) {
      data.codeFormat = 'qrcode';
    }
    const created = await this.create(data);
    if (!data.code) {
      const uuid = randomUUID();
      await this.update(created.id, { code: uuid } as any);
      created.code = uuid;
    }
    return created;
  }

  /** Find by code value (QR, barcode, etc.) */
  async findByCode(code: string): Promise<TicketDTO | null> {
    return this.findOne({ code });
  }

  /** Find tickets for a client */
  async findByClient(clientId: string, options?: QueryOptions): Promise<TicketDTO[]> {
    return this.findAll({ client: clientId }, { sort: { createdAt: -1 }, ...options });
  }

  /** Count tickets for a given clientAccess */
  async countByAccess(clientAccessId: string): Promise<number> {
    return this.count({ clientAccess: clientAccessId });
  }

  /** Count tickets grouped by clientAccess (for access grid) */
  async countsByAccess(accessIds: string[]): Promise<{ accessId: string; count: number }[]> {
    return this.aggregate([
      { $match: { clientAccess: { $in: accessIds } } as any },
      { $group: { _by: 'clientAccess', count: { $sum: 1 } } },
    ]);
  }

  /** Mark ticket as used */
  async markUsed(id: string, scannedBy: string): Promise<TicketDTO | null> {
    return this.update(id, {
      status: 'used',
      scannedAt: new Date(),
      scannedBy,
    } as any);
  }
}
