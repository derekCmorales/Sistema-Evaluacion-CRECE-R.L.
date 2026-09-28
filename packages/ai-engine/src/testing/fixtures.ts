import type { CaseSnapshot } from "../contracts/case-snapshot";
import type { Requester } from "../contracts/common";

export const advisorRequester: Requester = { userId: "asesor-mario", offices: ["ADVISOR", "BRANCH_HEAD"] };
export const adminRequester: Requester = { userId: "admin-1", offices: ["SYSTEM_ADMIN"] };
export const councilRequester: Requester = { userId: "consejo-julio", offices: ["COUNCIL_MEMBER"] };

/** Caso ilustrativo Don Marco (ferretería, Q40,000). Datos sintéticos. */
export const donMarcoSnapshot: CaseSnapshot = {
  operationId: "op-don-marco",
  snapshotAt: "2026-09-28T10:00:00.000Z",
  product: {
    productType: "WORKING_CAPITAL",
    guaranteeType: "PERSONAL",
    hasGuarantor: true,
    purpose: "Inventario de ferretería",
    requestedAmountGTQ: "40000.00",
    termMonths: 24,
    annualRatePercent: 18,
  },
  applicant: {
    displayName: "Marco Tulio Pérez",
    dpi: "1234567890101",
    phone: "55551234",
    address: "4a calle 5-20 zona 1, Quetzaltenango",
  },
  guarantor: { displayName: "Ana López", dpi: "2345678901202", phone: "44443322", relationship: "Hermana" },
  assessment: {
    monthlySales: 45000,
    monthlyIncome: 18000,
    monthlyExpenses: 9000,
    existingDebtPayment: 1500,
  },
  calcResult: { installment: "1996.80", installmentToIncomeRatio: 0.22, paymentCapacity: "7500.00" },
  hardRuleHits: [],
  confirmedFields: [
    {
      documentId: "doc-bureau",
      fieldKey: "total_monthly_payment",
      fieldLabel: "Cuota mensual total",
      value: "Q3,200.00",
      page: 2,
    },
  ],
  documents: [
    { documentId: "doc-bureau", documentType: "BUREAU_REPORT", checklistCode: "BUREAU", extractionId: "ext-bureau" },
  ],
};

/** Caso ≥ umbral para verificar que el análisis no depende de la ruta. */
export const councilCaseSnapshot: CaseSnapshot = {
  ...donMarcoSnapshot,
  operationId: "op-150k",
  product: { ...donMarcoSnapshot.product, requestedAmountGTQ: "150000.00", termMonths: 48 },
};
