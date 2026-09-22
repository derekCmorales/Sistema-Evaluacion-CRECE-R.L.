# Política de autorización (configurable)

La cooperativa no debe quedar atada a un rol fijo “Gerencia” en código. La **AuthorizationPolicy** resuelve la ruta según monto, cargos y configuración versionada en base de datos.

## Umbral de referencia (~Q100,000 GTQ)

| Condición | Ruta | Quién participa |
|-----------|------|-----------------|
| Monto **menor** al umbral | `BRANCH_DUAL_SIGNATURE` | **Jefatura de agencia** (`BRANCH_HEAD`) + **Autorizador delegado** (`DELEGATED_AUTHORIZER`), dos firmas **distintas** |
| Monto **≥** umbral | `COUNCIL_QUORUM` | Miembros del **Consejo** hasta alcanzar **quórum** configurado |

### Reglas de negocio documentadas

1. Quien **armó el caso** (preparó la operación) **no puede** votar ni firmar como Autorizador delegado.
2. El umbral, el quórum (N de M) y los cargos válidos se cargan desde configuración — no constantes en código.
3. **No existe puntaje** ni recomendación automática de aprobar/rechazar.

## Resultados posibles (outcomes)

Etiquetas en UI (es-GT) ↔ código (`@crece/shared`):

| UI | Código |
|----|--------|
| Aprobar | `APPROVE` |
| Aprobar con cambios | `APPROVE_WITH_CHANGES` (p. ej. ajuste de monto o plazo con recálculo) |
| Rechazar | `REJECT` |
| Devolver | `RETURN` (observaciones al asesor) |

Cada acción genera entrada en **bitácora append-only** (`DecisionLog`), con actor, timestamp y motivo cuando aplique.

## Implementación en repo

- Tipos y stub de dominio: `apps/api/src/domain/policies/authorization-policy.ts`
- Endpoint informativo (bootstrap): `GET /approvals/policy`
- Diagramas: [08-secuencia-aprobacion.png](./diagramas/08-secuencia-aprobacion.png), [02-actividades-flujo.png](./diagramas/02-actividades-flujo.png)

Pendientes con el cliente (no bloqueantes del scaffold): formalizar quórum exacto, empates y acta del Consejo.
