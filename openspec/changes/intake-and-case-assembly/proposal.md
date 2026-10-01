# Proposal: intake-and-case-assembly

## Why

Las fases 1–3 del proceso de crédito (registro del solicitante, apertura en borrador y armado del expediente) solo existían como scaffold: el prospecto de la landing vivía en un store aparte, no había persona en agencia, operación persistida en proceso ni expediente. Dos ramas (#3 fase 3, #4 fases 1–2) las implementaron en paralelo con un enfoque contract-first; la auditoría del 30 sep 2026 encontró identidades duplicadas entre landing y agencia, borradores huérfanos, actualizaciones de checklist que respondían éxito sin cambiar nada, listas de control con coincidencia contadas como completas, datos descartados en silencio, UI fuera del design system y la suite en rojo. Este change integra ambas ramas en una sola, mueve las reglas a la capa dueña y deja las tres fases funcionando de punta a punta.

## What Changes

- **Fase 1 · Registro (`@crece/domain` `person-identity`, `@crece/application` `person-intake`):** una persona es una sola identidad. Landing (`POST /public/prospects`) y agencia (`POST /persons`) escriben en el mismo `PersonRepository`. El DPI (13 dígitos, normalizado) es la llave: un DPI repetido devuelve la persona existente (409 con `existingPersonId`). Toda persona nace `PROSPECT`, también la que registra el asesor; registrar no abre operación. El prospecto de la landing se completa con su DPI (`PUT /persons/:id/dpi`) en lugar de registrarse dos veces. Origen y quién registró quedan en la persona; el DPI viaja enmascarado en el directorio y nunca en la URL (`POST /persons/lookup`).
- **Fase 2 · Apertura (`openDraftOperation`):** la solicitud nace en `DRAFT` sobre una persona existente y con DPI, con el checklist que resuelve `createChecklistItems`. Quién la abre sale de la sesión.
- **Fase 3 · Armado (`@crece/domain` `case-assembly`, `@crece/application` `case-file`):** checklist por casilla (código inexistente = error; «No aplica» con motivo), evaluación financiera manual con `calculateCreditMetrics` + `evaluateHardRules`, fiador flexible que regenera el checklist conservando lo avanzado, registro manual de consultas a OFAC/ONU/Guatecompras (vale la más reciente; coincidencia o revisión manual = hueco visible), estado de armado con huecos y constancia de quién armó el expediente (se invalida con cualquier cambio). Solo se edita en `DRAFT` o `RETURNED_TO_ADVISOR`.
- **Trazabilidad:** cada paso queda en `AuditLog` (append-only) con quién y qué cambió; `GET /operations/:id/history`.
- **RBAC:** cada caso de uso exige su permiso (`person:create`, `operation:edit`, …). Consultar ≠ operar.
- **Sesión de desarrollo:** hasta que exista `AuthGateway`, el actor llega en `x-crece-user-id` / `x-crece-offices`. Sin cabeceras → 401. No es seguridad.
- **Persistencia en memoria de proceso** (`apps/api/src/infrastructure/persistence`) que implementa los puertos de dominio; semilla de demo sintética (DPI `0000…`) solo fuera de producción.
- **UI (`apps/web`) solo con el design system:** directorio, registro con búsqueda previa por DPI, perfil con historial, apertura con vista previa del checklist, expediente (`/operations/[id]`) con checklist, evaluación, fiador, listas, bitácora y panel de armado; simulador y vista general. El bundle y los tokens se publican en `/ds` sin modificar `design-system/`.

## Capas afectadas

- `packages/shared`: etiquetas, semilla de listas de control, errores `NotFoundError`, `DuplicatePersonError`, `UnauthenticatedError`, tipos de listado.
- `packages/domain`: `person-identity.ts`, `case-assembly.ts`, `Person` (origen, nota de landing, consentimiento) y `WatchlistCheck`. Sin cambios de puertos.
- `packages/application`: casos de uso de captación sobre `PersonRepository`, `OperationRepository`, `AuditLog`, `ConfigRepository`.
- `apps/api` (infrastructure + modules): adaptadores en memoria, `CaptureModule`, controladores delgados, filtro de errores.
- `apps/web`: pantallas de fases 1–3.

Sin migración de base de datos (la persistencia Prisma es un change aparte).

## Límites de IA

- Nada de este change llama a OCR ni a LLM. La IA no decide, no puntúa, no recomienda aprobar.
- La evaluación se captura a mano; los números salen del motor determinístico.
- La subida de documentos (y con ella el disparo de OCR del motor de IA) llega en un change propio.

## No objetivos

- Persistencia en PostgreSQL/Prisma y almacenamiento de archivos (R2).
- Autenticación real (`AuthGateway`).
- Fases 4–8: excepciones justificadas a reglas duras, envío a revisión, autorización, documentos.
- Consulta automática a OFAC/ONU/Guatecompras: se registra lo que el asesor consultó.
- Integración con CENSYT.
