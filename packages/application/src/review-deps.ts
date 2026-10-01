import type { DecisionLog, ReviewFactsPublisher } from "@crece/domain";
import type { CaptureDeps } from "./capture-deps";

/**
 * Dependencias de las fases 4 y 5 (cálculo, reglas, dictamen y envío).
 * `facts` recibe el hecho del envío; su falla nunca deshace el envío.
 */
export type ReviewDeps = CaptureDeps & {
  facts: ReviewFactsPublisher;
};

/** Dependencias de la fase 7 (autorización). `decisions` es append-only. */
export type AuthorizationDeps = CaptureDeps & {
  decisions: DecisionLog;
};
