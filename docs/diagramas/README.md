# Diagramas CRECE — fuente para agentes (Mermaid)

**Fuente de verdad para IA:** este directorio en Markdown + Mermaid. No agregar PNG ni otras imágenes: un diagrama nuevo es un `.md` con Mermaid.

Arquitectura de **este** repo (greenfield): `apps/web` (Next.js) + `apps/api` (NestJS) + `packages/domain` + `packages/application` + `packages/shared`. La landing es **otro repo**. Puertos **sin** prefijo `I`.

Índice:

| # | Tema | Archivo Mermaid |
|---|------|-----------------|
| 01 | Casos de uso (vista general) | [01-casos-de-uso.md](./01-casos-de-uso.md) |
| 01a | Casos de uso landing | [01a-casos-de-uso-landing.md](./01a-casos-de-uso-landing.md) |
| 01b | Casos de uso crédito | [01b-casos-de-uso-credito.md](./01b-casos-de-uso-credito.md) |
| 02 | Actividades (flujo principal) | [02-actividades.md](./02-actividades.md) |
| 03 / 17 | MER | [03-mer.md](./03-mer.md) |
| 04 / 15 | Contenedores | [04-contenedores.md](./04-contenedores.md) |
| 05 / 09 | Capas SOLID y paquetes | [05-capas-solid.md](./05-capas-solid.md) |
| 06 | Secuencia flujo completo | [06-secuencia-flujo.md](./06-secuencia-flujo.md) |
| 07 | Secuencia prospecto | [07-secuencia-prospecto.md](./07-secuencia-prospecto.md) |
| 08 | Secuencia autorización | [08-secuencia-autorizacion.md](./08-secuencia-autorizacion.md) |
| 10–12 | Clases domain / application / persistencia | [10-clases-domain.md](./10-clases-domain.md) |
| 13 | Estados Operation | [13-estados-operation.md](./13-estados-operation.md) |
| 14 | Contexto C4 | [14-contexto.md](./14-contexto.md) |
| 16 | Terceros (puertos) | [16-terceros.md](./16-terceros.md) |
| 18 | Ocho fases | [18-ocho-fases.md](./18-ocho-fases.md) |
| 19 | Testing (siempre) | [19-testing.md](./19-testing.md) |

Los PNG del Documento 1 que ya están en esta carpeta son archivo visual histórico. **No se agregan imágenes nuevas**: cualquier diagrama nuevo va en Markdown/Mermaid. Narrativa de pruebas: [testing.md](../testing.md).
