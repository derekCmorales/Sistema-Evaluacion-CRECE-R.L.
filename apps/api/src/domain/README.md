# Capa domain (Nest)

El **código puro** vive en `@crece/domain` (`packages/domain`). Esta carpeta solo documenta el puente Nest.

- Políticas, motor, checklist, estados, puertos: `packages/domain/src/`
- Puertos **sin** prefijo `I` (`OcrProvider`, `LlmAssistant`, `CalcEngine`, …)
- OCR / LLM / R2: **no implementar** hasta un change OpenSpec

Specs: `openspec/specs/`.
