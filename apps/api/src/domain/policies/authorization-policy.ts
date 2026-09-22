import type { ApprovalOutcome, MoneyGTQ } from "@crece/shared";

/**
 * Política de autorización configurable (no hardcodear roles de negocio en código).
 *
 * Referencia operativa CRECE (~Q100,000):
 * - Monto estrictamente menor al umbral: dos firmas distintas — BRANCH_HEAD + Delegado.
 *   Quien armó el caso no puede actuar como Autorizador Delegado.
 * - Monto en o por encima del umbral: ruta Consejo hasta alcanzar quórum configurado.
 *
 * Outcomes: Aprobar | Aprobar con cambios | Rechazar | Devolver (bitácora append-only).
 *
 * Implementación futura: cargar umbral, quórum y cargos desde repositorio de configuración versionada.
 */

export type AuthorizationRoute = "BRANCH_DUAL_SIGNATURE" | "COUNCIL_QUORUM";

export type OfficeCode =
  | "BRANCH_HEAD"
  | "DELEGATED_AUTHORIZER"
  | "COUNCIL_MEMBER"
  | string;

export type AuthorizationPolicyConfig = {
  councilThreshold: MoneyGTQ;
  councilQuorumVotes: number;
  councilTotalMembers: number;
};

export type AuthorizationContext = {
  operationAmount: MoneyGTQ;
  preparedByUserId: string;
  policy: AuthorizationPolicyConfig;
};

export type AuthorizationPolicy = {
  resolveRoute(context: AuthorizationContext): AuthorizationRoute;
  requiredOfficesForRoute(route: AuthorizationRoute): OfficeCode[];
  isValidOutcome(outcome: ApprovalOutcome): boolean;
};

/** Stub de dominio: lógica mínima documentada; reemplazar con reglas + config en DB. */
export const defaultAuthorizationPolicyConfig: AuthorizationPolicyConfig = {
  councilThreshold: { currency: "GTQ", amount: 100_000 },
  councilQuorumVotes: 0,
  councilTotalMembers: 0,
};

export const authorizationPolicyStub: AuthorizationPolicy = {
  resolveRoute({ operationAmount, policy }) {
    return operationAmount.amount >= policy.councilThreshold.amount
      ? "COUNCIL_QUORUM"
      : "BRANCH_DUAL_SIGNATURE";
  },
  requiredOfficesForRoute(route) {
    if (route === "COUNCIL_QUORUM") {
      return ["COUNCIL_MEMBER"];
    }
    return ["BRANCH_HEAD", "DELEGATED_AUTHORIZER"];
  },
  isValidOutcome(outcome) {
    return (
      outcome === "APPROVE" ||
      outcome === "APPROVE_WITH_CHANGES" ||
      outcome === "REJECT" ||
      outcome === "RETURN"
    );
  },
};
