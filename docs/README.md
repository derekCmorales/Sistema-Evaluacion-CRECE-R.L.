# Documentación

Orden de lectura **e2e** (humano o agente). No saltar al código de features sin el contrato.

| Paso | Documento | Qué cubre |
|------|-----------|-----------|
| 1 | [README.md](../README.md) | Qué es el repo, pnpm, Compose, estructura |
| 2 | [como-trabajar.md](./como-trabajar.md) | Flujo diario, capas, OpenSpec, anti-patrones |
| 3 | [../AGENTS.md](../AGENTS.md) | Contrato: IA no decide, sin score, sin prefijo `I` |
| 4 | [stack.md](./stack.md) | Versiones npm reales y peers |
| 5 | [docker.md](./docker.md) | Servicios Compose, Dockerfiles, health, env |
| 6 | [arquitectura.md](./arquitectura.md) | Capas, módulos, dependency rule |
| 7 | [autorizacion.md](./autorizacion.md) | `AuthorizationPolicy`, umbral, outcomes |
| 8 | [requisitos.md](./requisitos.md) | Must / no objetivos del bootstrap |
| 9 | [glosario.md](./glosario.md) | Lenguaje ubicuo es-GT ↔ inglés técnico |
| 10 | [diagramas/README.md](./diagramas/README.md) | Mermaid (fuente agentes); PNG = archivo visual |
| 11 | [../DESIGN.md](../DESIGN.md) | Marca CRECE |
| 12 | [../CONTRIBUTING.md](../CONTRIBUTING.md) | Ramas, checklist de PR |

OpenSpec: [`openspec/config.yaml`](../openspec/config.yaml) y [`openspec/specs/README.md`](../openspec/specs/README.md).
