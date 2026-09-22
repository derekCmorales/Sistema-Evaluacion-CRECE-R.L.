# 10–12 — Clases de dominio, application y persistencia (objetivo)

Diseño táctico de **este** greenfield. No copiar clases del MVP.

```mermaid
classDiagram
  class Person {
    <<entity>>
    id
    status
  }
  class Operation {
    <<entity>>
    id
    state
    amount
  }
  class AuthorizationPolicy {
    <<domain service>>
    resolveRoute()
    requiredOfficesForRoute()
  }
  class CalcEngine {
    <<domain service>>
    calculate()
  }
  class HardRulesEngine {
    <<domain service>>
    evaluate()
  }
  class PersonRepository {
    <<port>>
  }
  class OperationRepository {
    <<port>>
  }
  class LlmAssistant {
    <<port>>
  }
  class OcrProvider {
    <<port>>
  }
  class DocumentStore {
    <<port>>
  }
  Person "1" --> "*" Operation
  CastVerdict ..> AuthorizationPolicy
  CastVerdict ..> OperationRepository
  SubmitForReview ..> LlmAssistant
  class CastVerdict {
    <<use case>>
  }
  class SubmitForReview {
    <<use case>>
  }
```

Persistencia: modelos ORM + mappers. El dominio **no** importa Prisma/Drizzle. Blobs JSON, si existen, viven en infrastructure.
