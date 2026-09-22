# Capa application (Nest)

Los casos de uso puros viven en `@crece/application` (`packages/application`).

Los módulos HTTP en `src/modules/` adaptan REST a esos casos:

- `parsePublicProspect` / `toProspectPerson`
- `prepareVerdict` / `summarizeAuthorization`
- `hasPermission` (RBAC deny-by-default)

Regla: deny-by-default; la política viene de `AuthorizationPolicy` + config versionada.
