// TicketRepository
// @mostajs/ticketing
// Author: Dr Hamid MADANI drmdh@msn.com
import { randomUUID } from 'crypto';
import { BaseRepository } from '@mostajs/orm';
import { TicketSchema } from '../schemas/ticket.schema';
import { CounterSchema } from '../schemas/counter.schema';
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

  /** Generate next ticket number: TKT-20260228-0001 */
  async getNextTicketNumber(prefix = 'TKT'): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const counterRepo = new BaseRepository(CounterSchema, this.dialect);
    const counter = await counterRepo.increment(`ticket-${dateStr}`, 'seq', 1);
    const seq = (counter as any)?.seq ?? 1;
    return `${prefix}-${dateStr}-${String(seq).padStart(4, '0')}`;
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
