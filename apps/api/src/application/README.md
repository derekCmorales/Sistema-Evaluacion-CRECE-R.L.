# Capa application

Casos de uso (orquestación): coordinan dominio + puertos. Sin dependencias de NestJS en el núcleo — los módulos en `src/modules/` adaptan HTTP a use cases.

Ejemplos futuros (no implementados en bootstrap):

- `CreateProspectFromPublicForm`
- `SubmitOperationForReview`
- `RunReviewAssistance`
- `CastAuthorizationVote`
- `ResolveCouncilDecision`

Regla: deny-by-default en permisos; la política de autorización viene de `AuthorizationPolicy` + configuración versionada.
