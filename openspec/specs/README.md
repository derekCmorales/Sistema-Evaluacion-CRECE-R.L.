# Especificaciones OpenSpec

Specs **estables** del dominio CRECE, transferidas desde el conocimiento del MVP (no desde su código de apps) y adaptadas a este greenfield (Nest + paquetes puros).

| Spec | Qué cubre |
|------|-----------|
| [person-operations](./person-operations/spec.md) | Persona, estados de operación, prospecto ≠ operación |
| [authorization-policy](./authorization-policy/spec.md) | Umbral, dual firma, quórum, invariantes |
| [rbac](./rbac/spec.md) | Usuario / cargo / permiso; consultar ≠ operar |
| [checklist](./checklist/spec.md) | Plantilla dinámica, N/A, faltante visible, vigencia |
| [decision-factors](./decision-factors/spec.md) | Vocabulario sin pesos |
| [ai-assist](./ai-assist/spec.md) | OCR humano, IA en revisión, sin veredicto |
| [audit-log](./audit-log/spec.md) | Delta old/new |
| [document-generation](./document-generation/spec.md) | Plantillas aprobadas por la cooperativa |
| [pipeline-metrics](./pipeline-metrics/spec.md) | Semáforos sobre datos propios |

Flujo de evaluación: prospecto → operación → cálculo → reglas duras → revisión (IA) → autorización → post-aprobación.

Estados: [13-estados-operation.md](../../docs/diagramas/13-estados-operation.md).
Pruebas: cada spec tiene sección **Tests**; la puerta del repo está en [docs/testing.md](../../docs/testing.md).

## Cómo cambiar specs

1. **openspec-propose** en `openspec/changes/<nombre>/` (la propuesta lista Tests).
2. Deltas en `specs/` dentro del change.
3. **apply** no cierra tareas si esas Tests no están verdes.
4. Tras implementar: **sync** o **archive**.
