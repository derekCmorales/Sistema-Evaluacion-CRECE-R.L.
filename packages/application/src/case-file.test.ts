import { beforeEach, describe, expect, it } from "vitest";
import {
  CASE_ASSEMBLY_CONFIG_KEYS,
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
  ValidationError,
  WATCHLIST_SOURCES_SEED,
} from "@crece/shared";
import {
  getCaseFile,
  getOperationHistory,
  listCaseFiles,
  markCaseAssembled,
  openDraftOperation,
  recordFinancialAssessment,
  recordWatchlistCheck,
  setGuarantor,
  updateChecklistItem,
} from "./case-file";
import { registerLandingProspect, registerPerson } from "./person-intake";
import { advisor, councilMember, fakeCaptureDeps, oversight } from "./test-support/capture-fakes";

const assessment = { monthlySales: 30000, monthlyIncome: 12000, monthlyExpenses: 6000, existingDebtPayment: 500 };

function draftBody(personId: string, overrides: Record<string, unknown> = {}) {
  return {
    personId,
    productType: "WORKING_CAPITAL",
    guaranteeType: "PERSONAL",
    requestedAmount: 40000,
    termMonths: 24,
    purpose: "Inventario de ferretería",
    hasGuarantor: false,
    ...overrides,
  };
}

describe("apertura en borrador (fase 2)", () => {
  it("abre la solicitud en DRAFT con checklist dinámico y quién la abrió", async () => {
    const { deps } = fakeCaptureDeps();
    const person = await registerPerson(deps, advisor, { fullName: "Marco López", dpi: "2345678900101", phone: "55551234", interest: "CREDIT" });
    const { operation, assembly } = await openDraftOperation(deps, advisor, draftBody(person.id));
    expect(operation.state).toBe("DRAFT");
    expect(operation.createdBy).toBe(advisor.userId);
    expect(operation.checklist.map((i) => i.code)).toContain("PURPOSE_LETTER");
    expect(assembly.readyForReview).toBe(false);
  });

  it("no abre una solicitud huérfana: la persona tiene que existir", async () => {
    const { deps } = fakeCaptureDeps();
    await expect(openDraftOperation(deps, advisor, draftBody("no-existe"))).rejects.toBeInstanceOf(NotFoundError);
    expect(await deps.operations.findAll()).toEqual([]);
  });

  it("un prospecto de la landing sin DPI no abre solicitud hasta completar su identidad", async () => {
    const { deps } = fakeCaptureDeps();
    const prospect = await registerLandingProspect(deps, {
      fullName: "Marco López",
      phone: "55551234",
      interest: "CREDIT",
      consentContact: true,
    });
    await expect(openDraftOperation(deps, advisor, draftBody(prospect.id))).rejects.toBeInstanceOf(
      InvariantViolationError,
    );
  });

  it("el Consejo no origina solicitudes", async () => {
    const { deps } = fakeCaptureDeps();
    const person = await registerPerson(deps, advisor, { fullName: "Marco López", dpi: "2345678900101", phone: "55551234", interest: "CREDIT" });
    await expect(openDraftOperation(deps, councilMember, draftBody(person.id))).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("armado del expediente (fase 3)", () => {
  let ctx: ReturnType<typeof fakeCaptureDeps>;
  let operationId: string;

  beforeEach(async () => {
    ctx = fakeCaptureDeps();
    const person = await registerPerson(ctx.deps, advisor, {
      fullName: "Marco López",
      dpi: "2345678900101",
      phone: "55551234",
      interest: "CREDIT",
    });
    operationId = (await openDraftOperation(ctx.deps, advisor, draftBody(person.id))).operation.id;
  });

  async function completeCase() {
    const { operation } = await getCaseFile(ctx.deps, advisor, operationId);
    for (const item of operation.checklist.filter((i) => i.required)) {
      await updateChecklistItem(ctx.deps, advisor, operationId, { code: item.code, status: "UPLOADED" });
    }
    await recordFinancialAssessment(ctx.deps, advisor, operationId, assessment);
    for (const source of WATCHLIST_SOURCES_SEED) {
      await recordWatchlistCheck(ctx.deps, advisor, operationId, { source, queryRef: "2345678900101", result: "CLEAR" });
    }
  }

  it("un código de checklist inexistente falla y no toca la solicitud", async () => {
    const before = ctx.operation(operationId);
    await expect(
      updateChecklistItem(ctx.deps, advisor, operationId, { code: "NO_EXISTE", status: "UPLOADED" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(ctx.operation(operationId)).toEqual(before);
  });

  it("la evaluación se captura a mano y el motor calcula; no hay puntaje", async () => {
    const { operation } = await recordFinancialAssessment(ctx.deps, advisor, operationId, assessment);
    expect(operation.assessment).toMatchObject(assessment);
    expect(operation.calcResult?.installment.currency).toBe("GTQ");
    expect(operation.calcResult?.inputsHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(operation)).not.toMatch(/score|riskBand|recomendado/i);
  });

  it("agregar fiador suma sus requisitos y, con evaluación, recalcula con su capacidad", async () => {
    const before = await recordFinancialAssessment(ctx.deps, advisor, operationId, assessment);
    const { operation, assembly } = await setGuarantor(ctx.deps, advisor, operationId, {
      fullName: "Lucía López",
      dpi: "3456 78901 0101",
      financialAssessment: { monthlyIncome: 8000, monthlyExpenses: 3000, existingDebtPayment: 0 },
    });
    expect(operation.hasGuarantor).toBe(true);
    expect(operation.guarantor?.dpi).toBe("3456789010101");
    expect(operation.checklist.map((i) => i.code)).toContain("GUARANTOR_BUREAU");
    expect(operation.calcResult?.inputsHash).not.toBe(before.operation.calcResult?.inputsHash);
    expect(assembly.guarantorComplete).toBe(true);
  });

  it("listo para revisión solo con checklist, evaluación y listas limpias", async () => {
    await completeCase();
    const { assembly } = await getCaseFile(ctx.deps, advisor, operationId);
    expect(assembly.readyForReview).toBe(true);
  });

  it("una coincidencia en listas impide marcar el expediente armado", async () => {
    await completeCase();
    await recordWatchlistCheck(ctx.deps, advisor, operationId, {
      source: "ONU",
      queryRef: "2345678900101",
      result: "MATCH_FOUND",
      notes: "Homónimo en resolución 1267; falta comparar fecha de nacimiento",
    });
    const { assembly } = await getCaseFile(ctx.deps, advisor, operationId);
    expect(assembly.gaps).toEqual(["WATCHLIST_MATCH"]);
    await expect(markCaseAssembled(ctx.deps, advisor, operationId)).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it("las listas requeridas salen de la configuración, no de una constante", async () => {
    ctx = fakeCaptureDeps({ [CASE_ASSEMBLY_CONFIG_KEYS.watchlistSources]: ["OFAC"] });
    const person = await registerPerson(ctx.deps, advisor, { fullName: "Marco López", dpi: "2345678900101", phone: "55551234", interest: "CREDIT" });
    const { operation } = await openDraftOperation(ctx.deps, advisor, draftBody(person.id));
    const { assembly } = await getCaseFile(ctx.deps, advisor, operation.id);
    expect(assembly.watchlist.map((s) => s.source)).toEqual(["OFAC"]);
  });

  it("marca quién armó el expediente, y un cambio posterior borra esa constancia", async () => {
    await completeCase();
    const marked = await markCaseAssembled(ctx.deps, advisor, operationId);
    expect(marked.assembly.assembledByUserId).toBe(advisor.userId);
    const changed = await updateChecklistItem(ctx.deps, advisor, operationId, { code: "BANK_STATEMENT", status: "UPLOADED" });
    expect(changed.assembly.assembledByUserId).toBeUndefined();
  });

  it("fuera de borrador el expediente no se edita", async () => {
    await ctx.deps.operations.update({ ...ctx.operation(operationId)!, state: "UNDER_REVIEW" });
    await expect(recordFinancialAssessment(ctx.deps, advisor, operationId, assessment)).rejects.toBeInstanceOf(
      InvariantViolationError,
    );
  });

  it("consultar ≠ operar: Vigilancia ve el expediente pero no lo edita", async () => {
    await expect(getCaseFile(ctx.deps, oversight, operationId)).resolves.toBeDefined();
    await expect(
      updateChecklistItem(ctx.deps, oversight, operationId, { code: "DPI", status: "UPLOADED" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("cada paso queda en la bitácora con quién y qué cambió", async () => {
    await updateChecklistItem(ctx.deps, advisor, operationId, { code: "DPI", status: "CONFIRMED" });
    const history = await getOperationHistory(ctx.deps, advisor, operationId);
    expect(history.map((e) => e.action)).toEqual(["OPERATION_OPENED", "CHECKLIST_ITEM_UPDATED"]);
    expect(history[1]).toMatchObject({ field: "DPI", oldValue: "PENDING", newValue: "CONFIRMED", byUserId: advisor.userId });
  });
});

describe("cola de expedientes", () => {
  it("lista cada expediente con el nombre del solicitante y cuántos huecos le quedan", async () => {
    const { deps } = fakeCaptureDeps();
    const person = await registerPerson(deps, advisor, { fullName: "Marco López", dpi: "2345678900101", phone: "55551234", interest: "CREDIT" });
    await openDraftOperation(deps, advisor, draftBody(person.id));
    const [row] = await listCaseFiles(deps, oversight);
    expect(row).toMatchObject({ personName: "Marco López", state: "DRAFT", readyForReview: false, gapsCount: 3 });
  });
});
