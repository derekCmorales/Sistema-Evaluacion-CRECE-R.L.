# Capa infrastructure

Adaptadores concretos (fases posteriores a este change):

- Prisma + PostgreSQL: esquema en `apps/api/prisma/schema.prisma`
- Object storage (R2), OCR, LLM, PDF, notificaciones

Ningún adaptador se importa desde `@crece/domain`. Inyección vía módulos Nest.

Hoy la API de prospectos usa memoria de proceso (`InMemoryProspectStore`) para demostrar el contrato público.
