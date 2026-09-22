# Política de autorización (configurable)

La cooperativa no debe quedar atada a un rol fijo “Gerencia” en código. `AuthorizationPolicy` resuelve la ruta según monto, cargos y configuración versionada.

## Umbral de referencia (semilla ~Q100,000 GTQ)

| Condición | Ruta | Quién participa |
|-----------|------|-----------------|
| Monto **menor** al umbral | `BRANCH_DUAL_SIGNATURE` | `BRANCH_HEAD` + `DELEGATED_AUTHORIZER`, dos usuarios **distintos** |
| Monto **≥** umbral | `COUNCIL_QUORUM` | `COUNCIL_MEMBER` hasta **quórum N** (semilla 3 de 3) |

## Invariantes

1. Una persona cuenta **una sola vez** por operación (`assertOnePersonOnce`).
2. Quien **originó** no ejerce `DELEGATED_AUTHORIZER` ni `COUNCIL_MEMBER` en ese caso. Sí puede ejercer `BRANCH_HEAD`.
3. El veredicto persiste el **cargo ejercido**. El acta dice «Iván, en calidad de autorizador delegado».
4. Consultar ≠ operar. El Consejo no captura.
5. `APPROVE_WITH_CHANGES` exige monto o plazo modificado y recálculo.
6. No se aprueba con alertas de IA sin `resolution`.
7. Umbral, quórum y cargos salen de config — las constantes del repo son **semilla**.

## Outcomes

| UI | Código |
|----|--------|
| Aprobar | `APPROVE` |
| Aprobar con cambios | `APPROVE_WITH_CHANGES` |
| Rechazar | `REJECT` |
| Devolver | `RETURN` |

Cada acción genera `DecisionLog` append-only.

## Implementación

- Dominio: `packages/domain/src/verdict-policy.ts`
- Tipos / semilla: `packages/shared` `DEFAULT_AUTHORIZATION_POLICY`
- HTTP: `GET /approvals/policy`, `POST /approvals/resolve`
- Spec: `openspec/specs/authorization-policy/spec.md`
