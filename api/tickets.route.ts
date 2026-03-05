// @mostajs/ticketing — Tickets route factory (GET list + POST create)
// Author: Dr Hamid MADANI drmdh@msn.com
import { computeValidUntil } from '../lib/validity-checker';
import { wouldExceedQuota } from '../lib/quota-manager';
import type { TicketsHandlerConfig, CodeFormat } from '../types/index';

/**
 * Factory: creates GET + POST handlers for ticket management.
 *
 * ```ts
 * // src/app/api/tickets/route.ts
 * import { createTicketsHandler } from '@mostajs/ticketing/api/tickets.route'
 * export const { GET, POST } = createTicketsHandler({ ... })
 * ```
 */
export function createTicketsHandler(config: TicketsHandlerConfig) {

  async function GET(req: Request) {
    const { error } = await config.checkAuth(req, 'ticket:view');
    if (error) return error;

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const filter: Record<string, any> = {};
    if (clientId) filter.client = clientId;
    if (status) filter.status = status;

    const repos = await config.getRepositories();
    const tickets = await repos.ticketRepo.findAll(filter, { sort: { createdAt: -1 }, limit });

    return Response.json({ data: tickets });
  }

  async function POST(req: Request) {
    const { error, userId } = await config.checkAuth(req, 'ticket:create');
    if (error) return error;

    const body = await req.json();
    const { clientId, activityId, ticketType = 'standard', sourceClientId, amount = 0, codeFormat } = body;

    if (!clientId || !activityId) {
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'clientId et activityId requis' } },
        { status: 400 },
      );
    }

    // For gift tickets, the access check is on the sourceClient
    const accessClientId = ticketType === 'cadeau' && sourceClientId ? sourceClientId : clientId;

    const repos = await config.getRepositories();

    const [client, activity, clientAccess] = await Promise.all([
      repos.clientRepo.findById(clientId),
      repos.activityRepo.findById(activityId),
      repos.clientAccessRepo.findActiveAccess(accessClientId, activityId),
    ]);

    if (!client) {
      return Response.json({ error: { code: 'NOT_FOUND', message: 'Client non trouvé' } }, { status: 404 });
    }
    if (!activity) {
      return Response.json({ error: { code: 'NOT_FOUND', message: 'Activité non trouvée' } }, { status: 404 });
    }
    if (!clientAccess) {
      return Response.json(
        { error: { code: 'NO_ACCESS', message: "Ce client n'a pas accès à cette activité" } },
        { status: 403 },
      );
    }

    // Check quota
    if (clientAccess.totalQuota != null) {
      const ticketCount = await repos.ticketRepo.countByAccess(clientAccess.id);
      if (wouldExceedQuota(clientAccess.totalQuota, ticketCount)) {
        return Response.json(
          { error: { code: 'QUOTA_EXCEEDED', message: `Quota atteint : ${ticketCount}/${clientAccess.totalQuota} tickets` } },
          { status: 403 },
        );
      }
    }

    // Gift tickets don't expire (usable another day)
    const validUntil = ticketType === 'cadeau'
      ? null
      : computeValidUntil(activity.ticketValidityMode, activity.ticketDuration);

    const resolvedFormat: CodeFormat = codeFormat || config.defaultCodeFormat || 'qrcode';

    const ticket = await repos.ticketRepo.createWithAutoFields({
      client: clientId,
      clientAccess: clientAccess.id,
      activity: activityId,
      ticketType,
      sourceClient: ticketType === 'cadeau' ? sourceClientId : null,
      clientName: `${client.firstName} ${client.lastName}`,
      activityName: activity.name,
      validityMode: activity.ticketValidityMode,
      validUntil: validUntil?.toISOString() || null,
      amount,
      codeFormat: resolvedFormat,
      createdBy: userId,
    });

    if (config.onCreated) {
      await config.onCreated({ ticket, userId });
    }

    return Response.json({ data: ticket }, { status: 201 });
  }

  return { GET, POST };
}
