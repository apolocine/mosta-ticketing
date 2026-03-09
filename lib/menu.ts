// @mostajs/ticketing — Menu contribution
// Author: Dr Hamid MADANI drmdh@msn.com

export const ticketingMenuContribution = {
  id: 'ticketing',
  label: 'Billetterie',
  icon: 'Ticket',
  order: 30,
  items: [
    { id: 'tickets', label: 'Tickets', href: '/dashboard/tickets', icon: 'Ticket', permission: 'ticket:view' },
    { id: 'scan', label: 'Scan', href: '/dashboard/scan', icon: 'ScanLine', permission: 'scan:validate' },
    { id: 'activities', label: 'Activites', href: '/dashboard/activities', icon: 'Dumbbell', permission: 'activity:view' },
    { id: 'plans', label: 'Abonnements', href: '/dashboard/plans', icon: 'CreditCard', permission: 'access:view' },
  ],
};
