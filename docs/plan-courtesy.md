# Socios — Premium lifetime de cortesía

## Qué es

Emails de socios reciben **Premium** sin Stripe (`Business.planCourtesy = true`).
Los webhooks de Stripe **no pueden degradar** ese plan.

## Agregar un socio

1. Entra a [`/admin/socios`](../src/app/admin/socios/page.tsx) como `SUPER_ADMIN`.
2. Ingresa el email (el de Clerk / Prisma del dueño).
3. Opcional: nota (“Socio — …””).
4. **Otorgar cortesía**:
   - Si ya tiene negocio → Premium + `planCourtesy` al instante.
   - Si no → queda **Pendiente** y se aplica al registrar o vincular el negocio.

También puedes pulsar **Sync** en filas pendientes tras el registro.

## Revocar

**Revocar** en `/admin/socios`:
- Marca el entitlement con `revokedAt`.
- Quita `planCourtesy`.
- Si no hay suscripción Stripe activa → plan vuelve a `FREE`.

## Datos

| Pieza | Ubicación |
|-------|-----------|
| Flag negocio | `Business.planCourtesy` |
| Lista emails | `PlanCourtesyEntitlement` |
| Lógica | [`src/lib/plan-courtesy.ts`](../src/lib/plan-courtesy.ts) |
| Protección Stripe | [`src/lib/billing-sync.ts`](../src/lib/billing-sync.ts) `applyPlanToBusiness` |
| Admin actions | [`src/actions/admin-courtesy.ts`](../src/actions/admin-courtesy.ts) |

## Bootstrap

La migración `20260722170000_plan_courtesy_lifetime` inserta:

- `allinremodelingcompany@gmail.com` (nota: socio)

y aplica Premium si ese usuario ya tiene `businessId`.
