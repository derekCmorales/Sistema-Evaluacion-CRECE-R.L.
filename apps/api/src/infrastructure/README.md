# Capa infrastructure

Adaptadores concretos: PostgreSQL (ORM por definir), almacenamiento de objetos, proveedores OCR/LLM, render PDF, notificaciones.

Ningún adaptador debe ser importado desde `domain/`. Inyección vía módulos Nest en fases posteriores.
