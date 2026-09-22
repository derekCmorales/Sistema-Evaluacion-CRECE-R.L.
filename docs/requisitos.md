# Requisitos resumidos

Fuente: propuesta aprobada y reuniones con CRECE (2026). Este documento condensa el *qué*; el MVP local anterior es solo aprendizaje.

## Productos

| Producto | Alcance bootstrap |
|----------|-------------------|
| Landing informativa | **Fuera de este repo**; envía prospectos vía API pública (futuro) |
| Sistema de evaluación | **Este repo**: web + api + shared |

## Funcional must (fases posteriores al scaffold)

- Registro de persona/prospecto y operaciones de crédito (y captación según producto).
- Checklist dinámico (producto + garantía + fiador).
- Evaluación financiera manual; cálculos automáticos (cuota, capacidad, cobertura, ROI).
- Envío a revisión con asistencia IA (buró, coherencia, resumen) — sin decisión automática.
- Autorización según [autorizacion.md](./autorizacion.md).
- Bitácora consultable; folders de identidad post-aprobación; generación documental desde plantillas configurables.

## Restricciones explícitas

- No integración con el core contable CENSYT (nivel B descartado); rodear con datos propios.
- No desembolsos, cobros ni movimiento de fondos.
- No puntaje / escala 85-70-60 / recomendación automática de aprobar.
- Datos reales solo en producción de la cooperativa; desarrollo anonimizado.

## No objetivos del bootstrap actual

- OCR, LLM, R2, PDF renderer implementados.
- Auth completo, RBAC y persistencia Prisma/Drizzle.
- Pipeline semáforos y notificaciones.
