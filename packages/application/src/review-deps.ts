import type {
  ConfigRepository,
  DecisionFactorRepository,
  DecisionLog,
  ReviewFactsPublisher,
  UserDirectory,
} from "@crece/domain";
import type { CaptureDeps } from "./capture-deps";

/**
 * Dependencias de las fases 4 y 5 (cálculo, reglas, dictamen y envío).
 * `facts` recibe el hecho del envío; su falla nunca deshace el envío.
 */
export type ReviewDeps = CaptureDeps & {
  facts: ReviewFactsPublisher;
};

/**
 * Dependencias de la fase 7 (autorización).
 * - `decisions`: bitácora de veredictos, append-only.
 * - `policy`: política de autorización vigente (umbral, bandas, quórum).
 * - `directory`: nombre de quien vota (acta) y miembros activos del Consejo (quórum).
 * - `factors`: vocabulario activo para validar los factores del voto.
 */
export type AuthorizationDeps = CaptureDeps & {
  decisions: DecisionLog;
  policy: Pick<ConfigRepository, "getAuthorizationPolicy">;
  directory: UserDirectory;
  factors: Pick<DecisionFactorRepository, "findActive">;
};
