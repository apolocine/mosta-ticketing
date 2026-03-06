// Counter Entity Schema (internal utility for auto-increment sequences)
// @mostajs/ticketing
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const CounterSchema: EntitySchema = {
  name: 'TicketCounter',
  collection: 'ticket_counters',
  timestamps: false,

  fields: {
    name: { type: 'string', required: true, unique: true },
    seq: { type: 'number', default: 0 },
  },

  relations: {},

  indexes: [],
};
