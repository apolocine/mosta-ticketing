// @mostajs/ticketing — Runtime module registration (merged: ticketing + scan + face)
// Author: Dr Hamid MADANI drmdh@msn.com

import type { ModuleRegistration } from '@mostajs/socle'
import { TicketSchema } from './schemas/ticket.schema'
import { ScanLogSchema } from './schemas/scan-log.schema'
import { CounterSchema } from './schemas/counter.schema'
import { TicketRepository } from './repositories/ticket.repository'
import { ScanLogRepository } from './repositories/scan-log.repository'
import { ticketingMenuContribution } from './lib/menu'
import { TICKETING_PERMISSIONS, TICKETING_PERMISSION_DEFINITIONS, TICKETING_CATEGORY_DEFINITIONS } from './lib/permissions'
import TicketsPage from './pages/TicketsPage'
import ScanPage from './pages/ScanPage'

export function register(registry: { register(r: ModuleRegistration): void }): void {
  registry.register({
    manifest: {
      name: 'ticketing',
      package: '@mostajs/ticketing',
      version: '3.0.0',
      type: 'business',
      priority: 95,
      dependencies: ['auth', 'subscriptions'],
      displayName: 'Billetterie',
      description: 'Tickets, scan, face recognition, validation — billetterie complete',
      icon: 'Ticket',
      register: './dist/register.js',
    },

    schemas: [
      { name: 'Ticket', schema: TicketSchema },
      { name: 'ScanLog', schema: ScanLogSchema },
      { name: 'Counter', schema: CounterSchema },
    ],

    repositories: {
      ticketRepo: (dialect: unknown) => new TicketRepository(dialect as never),
      scanLogRepo: (dialect: unknown) => new ScanLogRepository(dialect as never),
    },

    permissions: {
      permissions: TICKETING_PERMISSIONS,
      definitions: TICKETING_PERMISSION_DEFINITIONS,
      categories: TICKETING_CATEGORY_DEFINITIONS,
    },

    pages: [
      { path: 'tickets', component: TicketsPage, permission: 'ticket:view' },
      { path: 'scan', component: ScanPage, permission: 'scan:validate' },
    ],

    menu: ticketingMenuContribution,

    i18n: [
      { namespace: 'tickets', source: 'node_modules/@mostajs/ticketing/i18n/fr/tickets.json' },
      { namespace: 'scan', source: 'node_modules/@mostajs/ticketing/i18n/fr/scan.json' },
    ],
  })
}
