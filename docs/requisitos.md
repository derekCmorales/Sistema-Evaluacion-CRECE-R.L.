# Requisitos resumidos

Fuente: propuesta aprobada, reuniones CRECE 2026 y specs OpenSpec de este repo. El MVP local anterior es solo aprendizaje.

## Productos

| Producto | Alcance |
|----------|---------|
| Landing informativa | **Fuera de este repo**; `POST /public/prospects` |
| Sistema de evaluación | **Este repo**: web + api + domain + application + shared |

## Must (producto; no todo está en runtime aún)

- Persona/prospecto y operaciones de crédito (fiador con evaluación propia).
- Checklist dinámico + vigencias; N/A con razón; faltante visible.
- Evaluación financiera manual; motor (cuota, capacidad, cobertura, ROI, amortización).
- Vocabulario de factores **sin pesos**.
- Reglas duras + excepción justificada.
- Autorización según [autorizacion.md](./autorizacion.md) + acta del Consejo.
- Bitácora + auditoría old/new; folder identidad post-aprobación.
- IA en revisión (puertos; no implementada).
- Documentos desde plantillas aprobadas por la cooperativa.
- Tablero de 6 semáforos y recordatorios de espera.
- RBAC por cargos acumulables.

**Ya ejecutable aquí:** motor, checklist, política, RBAC unitario, contrato de prospecto, esquema Prisma.

## Should

- Flujo completo de captaciones (ahorro / plazo fijo) y calendario 30/15/5.

## Fuera

- Integración CENSYT (nivel B), cobros, mora, cartera, portal de asociados.
- Indicadores del core, score 85/70/60, recomendación automática.
- Desembolsos o movimiento de fondos.

## No objetivos de infraestructura en este change

- OCR, LLM, R2, PDF renderer en runtime.
- Auth de sesión y persistencia Prisma cableada a operaciones.
