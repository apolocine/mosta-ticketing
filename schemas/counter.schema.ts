// Counter Entity Schema (internal utility for auto-increment sequences)
// @mostajs/ticketing
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const CounterSchema: EntitySchema = {
  name: 'Counter',
  collection: 'counters',
  timestamps: false,

  fields: {
    seq: { type: 'number', default: 0 },
  },

  relations: {},

  indexes: [],
};
