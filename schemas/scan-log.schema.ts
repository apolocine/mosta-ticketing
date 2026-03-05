// ScanLog Entity Schema
// @mostajs/ticketing
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const ScanLogSchema: EntitySchema = {
  name: 'ScanLog',
  collection: 'scan_logs',
  timestamps: false,

  fields: {
    scanMethod:  { type: 'string', enum: ['webcam', 'pwa_camera'], default: 'webcam' },
    result:      { type: 'string', enum: ['granted', 'denied'], required: true },
    denyReason:  { type: 'string', default: null },
    quotaBefore: { type: 'number', default: null },
    quotaAfter:  { type: 'number', default: null },
    isReentry:   { type: 'boolean', default: false },
    timestamp:   { type: 'date', default: 'now' },
  },

  relations: {
    ticket:    { target: 'Ticket', type: 'many-to-one', nullable: true },
    client:    { target: 'Client', type: 'many-to-one', nullable: true },
    activity:  { target: 'Activity', type: 'many-to-one', nullable: true },
    scannedBy: { target: 'User', type: 'many-to-one', required: true },
  },

  indexes: [
    { fields: { client: 'asc' } },
    { fields: { timestamp: 'desc' } },
    { fields: { result: 'asc' } },
  ],
};
