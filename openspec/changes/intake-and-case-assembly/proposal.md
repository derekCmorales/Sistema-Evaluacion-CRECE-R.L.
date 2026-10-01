# Proposal: intake-and-case-assembly

## Why

Las fases 1 a 3 ya tenían contratos y pantallas hechas a mano, pero la landing y la agencia no compartían personas, un borrador podía nacer sin solicitante, y el armado del expediente no dejaba ver los huecos de las listas ni respetaba el design system.

## What Changes

- La landing y la agencia escriben en el mismo repositorio de personas. Un prospecto se completa con su DPI.
- Toda persona nace como prospecto, también la que registra el asesor.
- No se abre un borrador si la persona no existe o no tiene DPI.
- Un código de checklist inexistente es un error. Agregar fiador regenera el checklist sin perder el avance.
- Una coincidencia o una revisión manual en las listas requeridas (leídas de configuración) deja un hueco visible.
- Un dato financiero no numérico es un error. El DPI del fiador se normaliza a 13 dígitos.
- Cada caso de uso exige el cargo. Cada paso deja bitácora. El DPI va enmascarado en los listados y no va en las URLs.
- La pantalla del expediente (fase 3) usa solo el design system.

## Capabilities

### Modified Capabilities

- `person-operations`: un solo perfil, nacimiento como prospecto, borrador con persona y DPI, expediente y listas.
- `checklist`: código desconocido y regeneración al agregar fiador.
- `audit-log`: bitácora de cada paso de captación y armado.
- `rbac`: permiso por cargo en cada caso de uso de estas fases.

## Impact

- `@crece/domain`, `@crece/application`, `@crece/shared`, `apps/api`, `apps/web`.
- Sin migración de base de datos: los adaptadores siguen en memoria.
- La UI deja Tailwind, Geist y los componentes hechos a mano.

## No objetivos

- No mezcla el motor de IA.
- No cablea Prisma ni CENSYT.
- No aprueba, no rechaza y no calcula un puntaje.

## Límites de IA

La IA no decide. La evaluación se captura a mano y la cuota sale del motor determinístico.
