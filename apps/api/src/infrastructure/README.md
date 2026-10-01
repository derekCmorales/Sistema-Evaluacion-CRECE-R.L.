# Capa infrastructure

Adaptadores concretos (fases posteriores a este change):

- Prisma + PostgreSQL: esquema en `apps/api/prisma/schema.prisma`
- Object storage (R2), OCR, LLM, PDF, notificaciones

Ningún adaptador se importa desde `@crece/domain`. Inyección vía módulos Nest.

Hoy la captación (fases 1–3) usa memoria de proceso: `persistence/in-memory-repositories.ts` implementa `PersonRepository`, `OperationRepository`, `AuditLog` y `ConfigRepository`, compartidos por landing, personas y operaciones (`CaptureModule`). Se pierde al reiniciar; lo reemplaza el change de persistencia (Prisma).
