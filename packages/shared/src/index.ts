/** Resultados posibles de un voto o resolución de autorización (es-GT en UI). */
export const ApprovalOutcome = {
  APPROVE: "APPROVE",
  APPROVE_WITH_CHANGES: "APPROVE_WITH_CHANGES",
  REJECT: "REJECT",
  RETURN: "RETURN",
} as const;

export type ApprovalOutcome =
  (typeof ApprovalOutcome)[keyof typeof ApprovalOutcome];

/** Monto en quetzales para contratos compartidos (sin lógica de umbral aquí). */
export type MoneyGTQ = {
  currency: "GTQ";
  amount: number;
};

export const API_HEALTH_PATH = "/health" as const;
