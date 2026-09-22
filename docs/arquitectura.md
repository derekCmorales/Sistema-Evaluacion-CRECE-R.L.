# Arquitectura

Monorepo **pnpm** para Cooperativa CRECE Guatemala, R.L. — sistema interno de captación y evaluación (greenfield).

## Contenedores

```
┌──────────────┐     HTTPS      ┌─────────────────┐
│ Landing       │ ─────────────► │ apps/web         │
│ (repo aparte) │   prospecto    │ Next.js App Router│
└──────────────┘                 └────────┬─────────┘
                                          │ REST (futuro)
                                 ┌────────▼─────────┐
                                 │ apps/api          │
                                 │ NestJS            │
                                 │ domain / app / infra│
                                 └────────┬─────────┘
                                          │
                                 ┌────────▼─────────┐
                                 │ PostgreSQL        │
                                 └──────────────────┘
```

Servicios externos (producción, **puertos documentados, no implementados** en bootstrap): almacenamiento de objetos, OCR, embeddings, LLM de asistencia.

## Regla de dependencias

`presentation (modules)` → `application` → `domain` ← `infrastructure`

- **domain**: entidades, políticas, puertos (`interface` sin prefijo `I`), servicios de dominio puros.
- **application**: casos de uso; orquestan puertos.
- **infrastructure**: ORM, R2, proveedores IA, PDF.
- **apps/web**: UI en español (es-GT); sin reglas de negocio en componentes.

## Módulos API (bootstrap)

| Módulo Nest | Bounded context |
|-------------|-----------------|
| `health` | Salud del servicio |
| `prospects` | Personas / prospectos |
| `operations` | Operaciones, checklist, evaluación |
| `approvals` | Autorización y bitácora |

## Principios (resumen)

1. **IA asiste; no decide.** Puertos `LlmAssistant`, `OcrProvider` — sin veredicto automático.
2. **Tres capas de decisión**, no una fórmula: cálculo determinístico, reglas duras, apoyo IA en revisión.
3. **Sin score de crédito** ni bandas de riesgo automáticas.
4. **Trazabilidad** append-only en decisiones y auditoría de cambios.
5. **Configuración versionada** en DB para umbrales, vocabulario de factores y plantillas.

Ver diagramas en [diagramas/README.md](./diagramas/README.md). Compose: [docker.md](./docker.md).
