export type DecisionFactorCatalogItem = {
  code: string;
  label: string;
  active: boolean;
  sortOrder: number;
};

/**
 * Vocabulario de factores del veredicto (CONTEXT §6.1).
 * Unión de la matriz del Consejo y lo que Mario levantó en reunión 3.
 * SIN pesos. Configurable en DB; esta semilla no se usa como fórmula.
 */
export const DEFAULT_DECISION_FACTORS: DecisionFactorCatalogItem[] = [
  { code: "PAYMENT_CAPACITY", label: "capacidad de pago", active: true, sortOrder: 10 },
  { code: "PAYMENT_HISTORY", label: "historial / moral de pago", active: true, sortOrder: 20 },
  { code: "GUARANTEE_COVERAGE", label: "cobertura de garantía", active: true, sortOrder: 30 },
  { code: "BUSINESS_AGE", label: "antigüedad del negocio", active: true, sortOrder: 40 },
  { code: "INDEBTEDNESS", label: "nivel de endeudamiento", active: true, sortOrder: 50 },
  { code: "CREDIT_PURPOSE", label: "destino del crédito", active: true, sortOrder: 60 },
  { code: "FILE_INTEGRITY", label: "integridad del expediente", active: true, sortOrder: 70 },
  { code: "REFERENCES", label: "referencias", active: true, sortOrder: 80 },
  { code: "LIVING_CONDITIONS", label: "condiciones de vida", active: true, sortOrder: 90 },
  { code: "ROOTS_RESIDENCE", label: "arraigo / residencia", active: true, sortOrder: 100 },
  { code: "INTERNAL_HISTORY", label: "historial interno previo", active: true, sortOrder: 110 },
  { code: "NETWORK_BENEFICIARY", label: "beneficiario de la red", active: true, sortOrder: 120 },
];

export function validateFactorCodes(
  selected: string[],
  catalog: DecisionFactorCatalogItem[],
): string[] {
  const activeCodes = new Set(catalog.filter((f) => f.active).map((f) => f.code));
  const activeLabels = new Set(catalog.filter((f) => f.active).map((f) => f.label));
  return selected.filter((s) => activeCodes.has(s) || activeLabels.has(s));
}

export function assertFactorsValid(
  selected: string[],
  catalog: DecisionFactorCatalogItem[],
): void {
  const activeCodes = new Set(catalog.filter((f) => f.active).map((f) => f.code));
  const activeLabels = new Set(catalog.filter((f) => f.active).map((f) => f.label));

  for (const factor of selected) {
    if (!activeCodes.has(factor) && !activeLabels.has(factor)) {
      throw new Error(`Factor inválido o inactivo: ${factor}`);
    }
  }
}
