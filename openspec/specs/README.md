# Especificaciones OpenSpec

Este directorio albergará specs **estables** del sistema (flujos acordados con CRECE). En el bootstrap solo existe este README como guía.

## Flujo de evaluación (referencia)

1. **Prospecto** — origen landing (repo aparte) o registro interno → `Person` en estado prospecto.
2. **Operación** — checklist dinámico, documentos, evaluación financiera manual.
3. **Cálculo** — motor determinístico (cuota, capacidad, cobertura, ROI).
4. **Reglas duras** — avisos/bloqueos con excepción justificada registrada.
5. **Revisión** — asistencia IA opcional (OCR/LLM vía puertos); sin veredicto automático.
6. **Autorización** — ruta dual firma o Consejo según [docs/autorizacion.md](../../docs/autorizacion.md).
7. **Post-aprobación** — folder identidad, generación documental, custodia.

Estados detallados: [13-estados-operation.md](../../docs/diagramas/13-estados-operation.md) (Mermaid).

## Cómo añadir specs

1. Crear change con **openspec-propose** (`openspec/changes/<nombre>/`).
2. Escribir deltas en `specs/` dentro del change.
3. Tras implementación, **sync** a este directorio o **archive** según el workflow del equipo.

Convenciones de dominio: `openspec/config.yaml` y `AGENTS.md`.
