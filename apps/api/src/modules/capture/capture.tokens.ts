/** Token de inyección explícito: las pruebas corren sin metadatos de decoradores. */
export const CAPTURE_DEPS = Symbol("CAPTURE_DEPS");

/** Dependencias de las fases 4 y 5 (`ReviewDeps`): mismos repositorios que la captación. */
export const REVIEW_DEPS = Symbol("REVIEW_DEPS");

/** Dependencias de la fase 7 (`AuthorizationDeps`): mismos repositorios más la bitácora de decisiones. */
export const AUTHORIZATION_DEPS = Symbol("AUTHORIZATION_DEPS");

/** Publicador del hecho de envío; la fase 6 se suscribe a él. */
export const REVIEW_FACTS = Symbol("REVIEW_FACTS");
