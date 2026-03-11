// @mostajs/ticketing — Menu contribution
// Author: Dr Hamid MADANI drmdh@msn.com

export const ticketingMenuContribution = {
  moduleKey: 'ticketing',
  id: 'ticketing',
  label: 'Billetterie',
  icon: 'Ticket',
  order: 30,
  items: [
    { id: 'tickets', label: 'Tickets', href: '/dashboard/tickets', icon: 'Ticket', permission: 'ticket:view' },
    { id: 'scan', label: 'Scan', href: '/dashboard/scan', icon: 'ScanLine', permission: 'scan:validate' },
  ],
}
