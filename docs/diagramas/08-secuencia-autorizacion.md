# 08 — Secuencia autorización

Precondición: `Operation.state = UNDER_REVIEW`. Umbral desde config (`ConfigRepository`), no constante.

```mermaid
sequenceDiagram
  actor Firmante as BRANCH_HEAD / Delegado / Consejo
  participant UC as CastVerdict use case
  participant Policy as AuthorizationPolicy
  participant Calc as CalcEngine
  participant Log as DecisionLog

  Firmante->>UC: outcome + factores + motivo
  UC->>Policy: resolveRoute(monto, config)
  alt BRANCH_DUAL_SIGNATURE
    UC->>Policy: dos firmas distintas; preparador no es Delegado
  else COUNCIL_QUORUM
    loop hasta quórum o RETURN/REJECT mayoritario
      Firmante->>UC: voto
    end
  end
  opt APPROVE_WITH_CHANGES
    UC->>Calc: recálculo monto/plazo
  end
  UC->>Log: VERDICT_CAST
  UC-->>Firmante: estado APPROVED / REJECTED / RETURNED_TO_ADVISOR
```

Outcomes: `APPROVE` | `APPROVE_WITH_CHANGES` | `REJECT` | `RETURN`.
