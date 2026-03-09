// @mostajs/ticketing — Permission constants
// Author: Dr Hamid MADANI drmdh@msn.com

export const TICKETING_PERMISSIONS = {
  // Tickets
  TICKET_CREATE: 'ticket:create',
  TICKET_VIEW:   'ticket:view',

  // Scan
  SCAN_VALIDATE:    'scan:validate',
  SCAN_VIEW_HISTORY: 'scan:view_history',
} as const;

export type TicketingPermission = typeof TICKETING_PERMISSIONS[keyof typeof TICKETING_PERMISSIONS];

export const TICKETING_PERMISSION_DEFINITIONS = [
  // Tickets
  { code: TICKETING_PERMISSIONS.TICKET_CREATE, name: 'ticket:create', description: 'Creer un ticket', category: 'ticket' },
  { code: TICKETING_PERMISSIONS.TICKET_VIEW, name: 'ticket:view', description: 'Voir les tickets', category: 'ticket' },

  // Scan
  { code: TICKETING_PERMISSIONS.SCAN_VALIDATE, name: 'scan:validate', description: 'Scanner et valider un ticket', category: 'scan' },
  { code: TICKETING_PERMISSIONS.SCAN_VIEW_HISTORY, name: 'scan:view_history', description: 'Voir l\'historique des scans', category: 'scan' },
];

export const TICKETING_CATEGORY_DEFINITIONS = [
  { name: 'ticket', label: 'Tickets', description: 'Gestion des tickets d\'acces', icon: 'Ticket', order: 7, system: true },
  { name: 'scan', label: 'Scan', description: 'Validation et historique des scans', icon: 'ScanLine', order: 8, system: true },
];
