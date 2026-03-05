# @mostajs/ticketing

> Reusable ticketing module — ticket lifecycle, scan validation, quota management, API route factories.

[![npm version](https://img.shields.io/npm/v/@mostajs/ticketing.svg)](https://www.npmjs.com/package/@mostajs/ticketing)
[![license](https://img.shields.io/npm/l/@mostajs/ticketing.svg)](LICENSE)

Part of the [@mosta suite](https://mostajs.dev). Depends only on `@mostajs/orm`. **Zero coupling** with auth, RBAC, or any framework beyond standard `Request`/`Response`.

---

## Table des matieres

1. [Installation](#installation)
2. [Concepts cles](#concepts-cles)
3. [Quick Start (5 etapes)](#quick-start)
4. [Formats de codes supportes](#formats-de-codes)
5. [API Route Factories](#api-route-factories)
6. [Core Logic (fonctions pures)](#core-logic)
7. [Schemas & Repositories](#schemas--repositories)
8. [Integration complete dans une nouvelle app](#integration-complete)
9. [API Reference](#api-reference)
10. [Architecture](#architecture)

---

## Installation

```bash
npm install @mostajs/ticketing
```

Prerequis : `@mostajs/orm` doit etre configure avec votre base de donnees.

---

## Concepts cles

### Cycle de vie d'un ticket

```
[create] → active → [scan] → used → (expired)
                 ↑           ↓
                 └── day_reentry (re-scan meme jour)
```

### Modes de validite

| Mode | Comportement |
|------|-------------|
| `single_use` | Un seul scan, puis `used` |
| `day_reentry` | Re-entree illimitee le meme jour, quota decremente une seule fois |
| `time_slot` | Valide pendant N minutes apres creation |
| `unlimited` | Pas d'expiration |

### Quota

- `totalQuota` : nombre total de tickets autorise pour un acces
- `remainingQuota` : decremente a chaque scan (sauf re-entrees day_reentry)
- Status `depleted` automatique quand quota atteint 0

### Formats de codes

Le champ `codeFormat` permet de generer et scanner differents types de codes :

| Format | Type | Usage typique |
|--------|------|--------------|
| `qrcode` | 2D | Le plus courant, haute capacite |
| `code128` | 1D | Alphanumerique, logistique |
| `code39` | 1D | Alphanumerique, industrie |
| `ean13` | 1D | 13 chiffres, retail Europe |
| `ean8` | 1D | 8 chiffres, petits produits |
| `upc_a` | 1D | 12 chiffres, retail USA |
| `itf` | 1D | Paires numeriques, colis |
| `pdf417` | 2D | Haute capacite, cartes d'identite |
| `datamatrix` | 2D | Petit format, composants |
| `aztec` | 2D | Compact, cartes d'embarquement |

---

## Quick Start

### Etape 1 — Enregistrer les schemas

```typescript
// src/dal/registry.ts
import { registerSchema } from '@mostajs/orm'
import {
  TicketSchema,
  ClientAccessSchema,
  ScanLogSchema,
  ActivitySchema,
  SubscriptionPlanSchema,
  CounterSchema,
} from '@mostajs/ticketing'

registerSchema(TicketSchema)
registerSchema(ClientAccessSchema)
registerSchema(ScanLogSchema)
registerSchema(ActivitySchema)
registerSchema(SubscriptionPlanSchema)
registerSchema(CounterSchema)
```

### Etape 2 — Instancier les repositories

```typescript
// src/dal/service.ts
import { getDialect } from '@mostajs/orm'
import {
  TicketRepository,
  ClientAccessRepository,
  ScanLogRepository,
  ActivityRepository,
  SubscriptionPlanRepository,
} from '@mostajs/ticketing'

export async function ticketRepo() {
  return new TicketRepository(await getDialect())
}
export async function clientAccessRepo() {
  return new ClientAccessRepository(await getDialect())
}
export async function scanLogRepo() {
  return new ScanLogRepository(await getDialect())
}
export async function activityRepo() {
  return new ActivityRepository(await getDialect())
}
export async function planRepo() {
  return new SubscriptionPlanRepository(await getDialect())
}
```

### Etape 3 — Route scan (POST /api/scan)

```typescript
// src/app/api/scan/route.ts
import { createScanHandler } from '@mostajs/ticketing/api/scan.route'
import { ticketRepo, clientAccessRepo, scanLogRepo, clientRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'

export const { POST } = createScanHandler({
  checkAuth: async () => {
    const { error, session } = await checkPermission('scan:validate')
    return { error: error || null, userId: session?.user?.id || '' }
  },

  getRepositories: async () => ({
    ticketRepo: await ticketRepo(),
    clientAccessRepo: await clientAccessRepo(),
    scanLogRepo: await scanLogRepo(),
    clientRepo: await clientRepo(),
  }),

  // Optionnel : audit apres scan reussi
  onGranted: async ({ ticket, client, isReentry, userId }) => {
    console.log(`Scan ${isReentry ? 'reentry' : 'granted'}: ${ticket.ticketNumber}`)
  },
})
```

### Etape 4 — Route tickets (GET + POST /api/tickets)

```typescript
// src/app/api/tickets/route.ts
import { createTicketsHandler } from '@mostajs/ticketing/api/tickets.route'
import { ticketRepo, clientRepo, clientAccessRepo, activityRepo } from '@/dal/service'
import { checkPermission } from '@/lib/authCheck'

export const { GET, POST } = createTicketsHandler({
  checkAuth: async (req, permission) => {
    const { error, session } = await checkPermission(permission)
    return { error: error || null, userId: session?.user?.id || '' }
  },

  getRepositories: async () => ({
    ticketRepo: await ticketRepo(),
    clientRepo: await clientRepo(),
    clientAccessRepo: await clientAccessRepo(),
    activityRepo: await activityRepo(),
  }),

  // Format de code par defaut pour les nouveaux tickets
  defaultCodeFormat: 'qrcode',

  // Optionnel : callback apres creation
  onCreated: async ({ ticket, userId }) => {
    console.log(`Ticket ${ticket.ticketNumber} cree`)
  },
})
```

### Etape 5 — Tester

```bash
# Creer un ticket
curl -X POST http://localhost:3000/api/tickets \
  -H 'Content-Type: application/json' \
  -d '{"clientId": "abc", "activityId": "xyz"}'

# Scanner un ticket
curl -X POST http://localhost:3000/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"code": "uuid-du-ticket"}'

# Avec un code-barres specifique
curl -X POST http://localhost:3000/api/tickets \
  -H 'Content-Type: application/json' \
  -d '{"clientId": "abc", "activityId": "xyz", "codeFormat": "code128"}'
```

---

## API Route Factories

### createScanHandler(config)

| Option | Type | Description |
|--------|------|-------------|
| `getRepositories` | `() => Promise<{...}>` | Fournit ticketRepo, clientAccessRepo, scanLogRepo, clientRepo |
| `checkAuth` | `(req) => Promise<{error, userId}>` | Verifie auth + permissions |
| `onGranted?` | `(data) => Promise<void>` | Callback apres scan reussi (audit, notifications) |
| `onDenied?` | `(data) => Promise<void>` | Callback apres scan refuse (alertes) |

**Requete :**
```json
POST /api/scan
{ "code": "uuid-or-barcode-value", "scanMethod": "webcam" }
```

**Reponse (granted) :**
```json
{
  "data": {
    "result": "granted",
    "isReentry": false,
    "ticket": { "ticketNumber": "TKT-20260306-0001", "clientName": "Alice Dupont", ... },
    "client": { "name": "Alice Dupont", "photo": "/photos/alice.jpg" },
    "access": { "remainingQuota": 9, "totalQuota": 10, "status": "active" }
  }
}
```

**Reponse (denied) :**
```json
{
  "data": {
    "result": "denied",
    "reason": "ticket_already_used",
    "ticket": { "ticketNumber": "TKT-20260306-0001", ... }
  }
}
```

### createTicketsHandler(config)

| Option | Type | Description |
|--------|------|-------------|
| `getRepositories` | `() => Promise<{...}>` | Fournit ticketRepo, clientRepo, clientAccessRepo, activityRepo |
| `checkAuth` | `(req, permission) => Promise<{error, userId}>` | Auth avec nom de permission (`ticket:view`, `ticket:create`) |
| `onCreated?` | `(data) => Promise<void>` | Callback apres creation ticket |
| `defaultCodeFormat?` | `CodeFormat` | Format de code par defaut (defaut: `'qrcode'`) |

---

## Core Logic

Fonctions pures, utilisables partout (serveur, worker, CLI, tests) :

### processScan(code, scanMethod, scannedBy, deps)

Pipeline 8 etapes de validation. Toute l'I/O est injectee via `deps`.

```typescript
import { processScan } from '@mostajs/ticketing'
import type { ScanDeps } from '@mostajs/ticketing'

const deps: ScanDeps = {
  findTicketByCode: async (code) => db.tickets.findOne({ code }),
  findAccessById: async (id) => db.accesses.findById(id),
  findClientById: async (id) => db.clients.findById(id),
  wasScannedToday: async (ticketId) => { /* ... */ },
  updateTicket: async (id, data) => db.tickets.update(id, data),
  updateAccess: async (id, data) => db.accesses.update(id, data),
  createScanLog: async (data) => db.scanLogs.create(data),
  resolveId: (ref) => typeof ref === 'string' ? ref : ref.id,
  formatClientName: (c) => `${c.firstName} ${c.lastName}`,
}

const result = await processScan('ticket-uuid', 'webcam', 'user-123', deps)
```

### computeValidUntil(mode, durationMinutes)

```typescript
import { computeValidUntil } from '@mostajs/ticketing'

computeValidUntil('day_reentry', null)  // → fin de journee (23:59:59)
computeValidUntil('time_slot', 90)      // → now + 90 minutes
computeValidUntil('single_use', null)   // → null
```

### decrementQuota(remainingQuota)

```typescript
import { decrementQuota } from '@mostajs/ticketing'

decrementQuota(5)    // → { remainingQuota: 4 }
decrementQuota(1)    // → { remainingQuota: 0, status: 'depleted' }
decrementQuota(null) // → null (unlimited)
```

---

## Schemas & Repositories

### Schemas disponibles

| Schema | Collection | Description |
|--------|-----------|-------------|
| `TicketSchema` | `tickets` | Ticket avec code (QR/barcode), validite, statut |
| `ClientAccessSchema` | `client_accesses` | Acces client-activite avec quota |
| `ScanLogSchema` | `scan_logs` | Journal des scans (granted/denied) |
| `ActivitySchema` | `activities` | Activites avec planning et mode de validite |
| `SubscriptionPlanSchema` | `subscription_plans` | Plans d'abonnement |
| `CounterSchema` | `counters` | Auto-increment interne |

### Repositories

| Repository | Methodes cles |
|-----------|--------------|
| `TicketRepository` | `createWithAutoFields()`, `findByCode()`, `markUsed()`, `countByAccess()` |
| `ClientAccessRepository` | `findActiveAccess()`, `decrementQuota()`, `block()` |
| `ScanLogRepository` | `wasScannedToday()`, `countToday()`, `findDistinctClientsToday()` |
| `ActivityRepository` | `findActive()`, `findBySlug()`, `findAllOrdered()` |
| `SubscriptionPlanRepository` | `findActive()`, `findAllWithActivities()` |

---

## Integration complete

### Nouvelle app Next.js depuis zero

```bash
# 1. Creer le projet
npx create-next-app@latest my-ticketing-app
cd my-ticketing-app

# 2. Installer
npm install @mostajs/orm @mostajs/ticketing

# 3. Configurer la DB
echo 'DATABASE_URL=mongodb://localhost:27017/myapp' >> .env.local

# 4. Enregistrer les schemas dans src/dal/registry.ts
# 5. Creer les repo helpers dans src/dal/service.ts
# 6. Creer les routes API (2 fichiers, ~30 lignes chacun)
# 7. npm run dev
```

### Avec audit (@mostajs/audit)

```typescript
import { createScanHandler } from '@mostajs/ticketing/api/scan.route'
import { logAudit, getAuditUser } from '@mostajs/audit/lib/audit'

export const { POST } = createScanHandler({
  // ...
  onGranted: async ({ ticket, client, isReentry, userId }) => {
    await logAudit({
      userId,
      action: isReentry ? 'scan_reentry' : 'scan_granted',
      module: 'scan',
      resource: ticket.ticketNumber,
    })
  },
  onDenied: async ({ reason, ticket, userId }) => {
    await logAudit({
      userId,
      action: 'scan_denied',
      module: 'scan',
      resource: ticket?.ticketNumber,
      details: { reason },
    })
  },
})
```

### Avec un scanner de code-barres physique

```typescript
// Le scanner physique envoie le meme POST /api/scan
// Seul le scanMethod change
fetch('/api/scan', {
  method: 'POST',
  body: JSON.stringify({
    code: 'TKT-20260306-0001',  // valeur lue par le scanner
    scanMethod: 'handheld_scanner',
  }),
})
```

---

## API Reference

### Types

| Type | Description |
|------|-------------|
| `CodeFormat` | `'qrcode' \| 'code128' \| 'code39' \| 'ean13' \| 'ean8' \| 'upc_a' \| 'itf' \| 'pdf417' \| 'datamatrix' \| 'aztec'` |
| `ValidityMode` | `'day_reentry' \| 'single_use' \| 'time_slot' \| 'unlimited'` |
| `TicketStatus` | `'active' \| 'used' \| 'expired' \| 'cancelled'` |
| `ScanResult` | `'granted' \| 'denied'` |
| `ScanMethod` | `'webcam' \| 'pwa_camera' \| 'handheld_scanner' \| 'nfc'` |
| `AccessType` | `'unlimited' \| 'count' \| 'temporal' \| 'mixed'` |
| `DenyReason` | `'invalid_ticket' \| 'ticket_already_used' \| 'ticket_expired' \| 'ticket_cancelled' \| 'quota_depleted' \| 'access_expired' \| 'client_suspended'` |
| `ScanDeps` | Interface d'injection pour `processScan()` |
| `ScanHandlerConfig` | Config de `createScanHandler()` |
| `TicketsHandlerConfig` | Config de `createTicketsHandler()` |

---

## Architecture

```
@mostajs/ticketing
├── schemas/
│   ├── ticket.schema.ts          # Ticket (code multi-format, validite, statut)
│   ├── client-access.schema.ts   # Acces client-activite avec quota
│   ├── scan-log.schema.ts        # Journal des scans
│   ├── activity.schema.ts        # Activites (planning, mode validite)
│   ├── subscription-plan.schema.ts # Plans d'abonnement
│   └── counter.schema.ts         # Auto-increment sequences
├── repositories/
│   ├── ticket.repository.ts      # CRUD + findByCode, createWithAutoFields
│   ├── client-access.repository.ts # Quota, findActiveAccess
│   ├── scan-log.repository.ts    # wasScannedToday, countToday
│   ├── activity.repository.ts    # findActive, findBySlug
│   └── subscription-plan.repository.ts
├── lib/
│   ├── scan-processor.ts         # Pipeline 8 etapes (pure, injectable)
│   ├── validity-checker.ts       # computeValidUntil, isExpired
│   └── quota-manager.ts          # decrementQuota, wouldExceedQuota
├── api/
│   ├── scan.route.ts             # Factory createScanHandler(config)
│   └── tickets.route.ts          # Factory createTicketsHandler(config)
├── types/
│   └── index.ts                  # CodeFormat, ValidityMode, ScanDeps, etc.
└── index.ts                      # Barrel exports

Dependances:
  @mostajs/orm   (seule dep runtime)
  next >= 14     (peer, optionnel)

Zero dependance sur: @mostajs/auth, @mostajs/rbac, @mostajs/audit
(l'app injecte ses propres callbacks auth/audit)
```

### Pattern Factory (injection de dependances)

```
┌──────────────────────┐     inject callbacks      ┌──────────────────────┐
│  @mostajs/ticketing   │ ◄──────────────────────── │   Votre app          │
│                       │                            │                      │
│ createScanHandler({   │                            │ checkAuth: () =>     │
│   checkAuth,          │                            │   verifyToken(...)   │
│   getRepositories,    │                            │ getRepositories: ()  │
│   onGranted,          │                            │   => { ticketRepo,   │
│ })                    │                            │     scanLogRepo }    │
└──────────────────────┘                            └──────────────────────┘
```

---

## License

MIT — Dr Hamid MADANI <drmdh@msn.com>
