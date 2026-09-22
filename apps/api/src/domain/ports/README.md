# Puertos de dominio (interfaces sin prefijo `I`)

Los adaptadores viven en `src/infrastructure/`. La IA **asiste** en revisión; **no decide** aprobaciones ni genera puntaje de riesgo.

| Puerto | Responsabilidad | Estado |
|--------|-----------------|--------|
| `PersonRepository` | Persona, folders de identidad | Stub |
| `OperationRepository` | Operaciones, checklist, evaluación | Stub |
| `DocumentStore` | Almacenamiento de documentos (p. ej. R2) | No implementado |
| `CalcEngine` | Cuota, capacidad, cobertura, ROI (puro) | No implementado |
| `HardRulesEngine` | Reglas duras configurables | No implementado |
| `OcrProvider` | Extracción de texto (OCR) | No implementado |
| `EmbeddingProvider` | Vectores para RAG | No implementado |
| `RagStore` | Índice de política / textos | No implementado |
| `LlmAssistant` | Resumen, contraste, borrador (sin side-effects) | No implementado |
| `DocumentRenderer` | Plantilla + datos → PDF | No implementado |
| `DecisionLog` | Bitácora append-only de decisiones | No implementado |
| `AuditLog` | Cambios con valor anterior/nuevo | No implementado |
| `AuthGateway` | Sesión y permisos | No implementado |
| `ConfigRepository` | Umbrales, vocabulario, plantillas versionadas | No implementado |

Convención: archivos `*.port.ts` exportan `interface` con nombre PascalCase **sin** prefijo `I`.
