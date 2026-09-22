# 18 — Ocho fases del proceso de crédito

| Fase | Actor | Qué pasa |
|------|-------|----------|
| 1 | Público / landing | Registro / formulario → prospecto |
| 2 | Asesor | Apertura: producto, monto, plazo, destino; checklist dinámico |
| 3 | Asesor | Armar expediente; docs; evaluación financiera; fiador si aplica |
| 4 | Sistema + asesor | Cálculos determinísticos; reglas duras + excepción justificada |
| 5 | Asesor | Dictamen; enviar a revisión |
| 6 | Sistema | Asistencia IA; confirmar o descartar alertas con motivo |
| 7 | Autorización | `AuthorizationPolicy`: dual firma o Consejo; outcomes + bitácora |
| 8 | Asistente | Si aprobado: folder identidad, IVE/contratos desde plantillas, `PACKAGED` |

```mermaid
flowchart LR
  F1[1 Prospecto] --> F2[2 Apertura]
  F2 --> F3[3 Expediente]
  F3 --> F4[4 Cálculo y reglas]
  F4 --> F5[5 Dictamen]
  F5 --> F6[6 IA asiste]
  F6 --> F7[7 Autorización]
  F7 --> F8[8 Documentos y cierre]
```
