# Documentación

Orden de lectura **e2e** (humano o agente). No saltar al código de features sin el contrato.

| Paso | Documento | Qué cubre |
|------|-----------|-----------|
| 1 | [README.md](../README.md) | Qué es el repo, pnpm, Compose, estructura |
| 2 | [contexto.md](./contexto.md) | Cliente, problema, CENSYT, principios, cargos, alcance |
| 3 | [como-trabajar.md](./como-trabajar.md) | Flujo diario, capas, OpenSpec, anti-patrones |
| 4 | [../AGENTS.md](../AGENTS.md) | Contrato: IA no decide, sin score, sin prefijo `I` |
| 5 | [stack.md](./stack.md) | Versiones npm reales y peers |
| 6 | [docker.md](./docker.md) | Servicios Compose, Dockerfiles, health, env |
| 7 | [arquitectura.md](./arquitectura.md) | Capas, paquetes, módulos, dependency rule |
| 8 | [autorizacion.md](./autorizacion.md) | `AuthorizationPolicy`, umbral, invariantes |
| 9 | [requisitos.md](./requisitos.md) | Must / should / fuera |
| 10 | [uso.md](./uso.md) | Recorrido API y pantallas actuales |
| 11 | [testing.md](./testing.md) | **Siempre** hay pruebas; pirámide y puerta de PR |
| 12 | [pantallas.md](./pantallas.md) | Mapa de UIs objetivo (IDs C-03, D-06, …) |
| 13 | [glosario.md](./glosario.md) | Lenguaje ubicuo es-GT ↔ inglés técnico |
| 14 | [diagramas/README.md](./diagramas/README.md) | Mermaid (fuente agentes); no añadir PNG nuevos |
| 15 | [../DESIGN.md](../DESIGN.md) | Marca CRECE |
| 16 | [../CONTRIBUTING.md](../CONTRIBUTING.md) | Ramas, checklist de PR |

OpenSpec: [`openspec/config.yaml`](../openspec/config.yaml) y [`openspec/specs/README.md`](../openspec/specs/README.md).
