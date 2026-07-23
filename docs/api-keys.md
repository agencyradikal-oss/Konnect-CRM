# API keys de partners

## Resumen

Keys por negocio: `Authorization: Bearer kn_live_…`  
Creación / revocación: `/app/integraciones` (solo `BUSINESS_OWNER` / `SUPER_ADMIN`).

- Plaintext solo al crear; en DB: `prefix` + `keyHash` (SHA-256).
- Máx. **5** keys activas por negocio.
- Endpoint: `GET /api/v1/leads?status=&source=&limit=` (máx 100).

## Ejemplo

```bash
curl -X GET "https://konnect.kmd.agency/api/v1/leads?limit=20" \
  -H "Authorization: Bearer kn_live_…" \
  -H "Accept: application/json"
```

Respuesta: `{ "data": [ { id, name, email, phone, message, source, status, created_at } ] }`.

## Código

| Pieza | Path |
|-------|------|
| Modelo | `BusinessApiKey` en Prisma |
| Auth | [`src/lib/api-auth.ts`](../src/lib/api-auth.ts) |
| Generación | [`src/lib/api-keys.ts`](../src/lib/api-keys.ts) |
| Route | [`src/app/api/v1/leads/route.ts`](../src/app/api/v1/leads/route.ts) |
| UI | [`api-keys-card.tsx`](../src/components/crm/api-keys-card.tsx) |

Square / QuickBooks: siguen vía webhook `lead.created` → Zapier (OAuth nativo roadmap).

Docs públicas: [`/developers`](../src/content/developers.ts).
