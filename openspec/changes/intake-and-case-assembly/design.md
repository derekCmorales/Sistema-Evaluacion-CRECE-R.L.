# Design: intake-and-case-assembly

## Decisiones

1. Las reglas viven en `@crece/domain` (`intake-rules`) y los casos de uso en `@crece/application` (`intake-use-cases`). La API solo adapta HTTP y los stores en memoria.
2. `InMemoryPersonStore` es el único repositorio. `POST /public/prospects` y `POST /persons` lo usan. Si el teléfono coincide con un prospecto sin DPI, se completa esa persona.
3. Toda alta usa `personBirthStatus()` = `PROSPECT`.
4. `assertPersonEligibleForDraft` exige persona existente con DPI de 13 dígitos.
5. `applyChecklistItem` falla si el código no está. `mergeChecklistPreservingProgress` copia el estado de los códigos que siguen.
6. `evaluateWatchlistCoverage` recibe las fuentes requeridas. La semilla es `DEFAULT_REQUIRED_WATCHLIST_SOURCES`. Solo `CLEAR` cierra una lista.
7. `readNonNegativeAmount` rechaza texto no numérico. `normalizeDpi` se aplica al fiador.
8. `assertPermission` corre al inicio de cada caso de uso. `recordSensitiveChange` alimenta `InMemoryAuditLog`.
9. Los listados pasan por `maskDpi`. La búsqueda por DPI es `POST /persons/lookup`, no un segmento de URL.
10. `apps/web` carga `window.Crece` desde `/ds/bundle.js` y los tokens del design system. El cargo viaja en `x-crece-user` y `x-crece-offices`.
11. Vitest resuelve `@crece/*` al fuente (`vitest.shared.ts`), así `pnpm test` no depende de `dist`.

## Fuera de este change

El motor de IA permanece en su rama. Este change no lo fusiona.
