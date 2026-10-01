import { describe, expect, it } from "vitest";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  toUserId,
} from "@crece/shared";
import type { Operation, Person } from "@crece/domain";
import {
  addGuarantor,
  capturePublicProspect,
  caseAssemblyStatus,
  listPersons,
  openDraftOperation,
  recordFinancialAssessment,
  recordWatchlistCheck,
  registerPerson,
  updateOperationChecklist,
  type IntakeActor,
  type IntakeDeps,
} from "./intake-use-cases";

const advisor: IntakeActor = {
  userId: toUserId("user-asesor"),
  offices: ["ADVISOR"],
};
const council: IntakeActor = {
  userId: toUserId("user-consejo"),
  offices: ["COUNCIL_MEMBER"],
};

function harness() {
  const persons = new Map<string, Person>();
  const operations = new Map<string, Operation>();
  const audit: { action: string; entityId: string; field: string }[] = [];
  let seq = 0;
  const deps: IntakeDeps = {
    persons: {
      findById: (id) => persons.get(id) ?? null,
      findByDpi: (dpi) =>
        [...persons.values()].find((person) => person.dpi === dpi) ?? null,
      findOpenProspectByPhone: (phone) => {
        const key = phone.replace(/\D/g, "");
        return (
          [...persons.values()].find(
            (person) =>
              person.status === "PROSPECT" &&
              !person.dpi &&
              person.contacts.phone.replace(/\D/g, "") === key,
          ) ?? null
        );
      },
      list: () => [...persons.values()],
      save: (person) => {
        persons.set(person.id, person);
        return person;
      },
    },
    operations: {
      findById: (id) => operations.get(id) ?? null,
      findByPersonId: (personId) =>
        [...operations.values()].filter((op) => op.personId === personId),
      list: () => [...operations.values()],
      save: (operation) => {
        operations.set(operation.id, operation);
        return operation;
      },
    },
    audit: {
      append: (entry) => {
        audit.push({ action: entry.action, entityId: entry.entityId, field: entry.field });
      },
    },
    now: () => "2026-09-26T12:00:00.000Z",
    newId: () => `id-${++seq}`,
  };
  return { deps, persons, operations, audit };
}

describe("captación: un solo repositorio de personas", () => {
  it("completa el prospecto de la landing con su DPI en vez de registrarlo dos veces", () => {
    const { deps, persons, audit } = harness();
    const landed = capturePublicProspect(deps, {
      fullName: "Ana López",
      phone: "5555 1234",
      interest: "CREDIT",
      source: "LANDING",
      consentContact: true,
    });
    expect(landed.status).toBe("PROSPECT");
    expect(landed.dpi).toBeUndefined();

    const completed = registerPerson(
      deps,
      {
        fullName: "Ana López",
        dpi: "2345 67890 0101",
        phone: "55551234",
        interest: "CREDIT",
        source: "ADVISOR",
        registeredByUserId: advisor.userId,
      },
      advisor,
    );

    expect(completed.id).toBe(landed.id);
    expect(completed.dpi).toBe("2345678900101");
    expect(completed.status).toBe("PROSPECT");
    expect(persons.size).toBe(1);
    expect(audit.map((entry) => entry.action)).toEqual([
      "prospect.capture",
      "person.complete",
    ]);
  });

  it("el asesor también da de alta un prospecto, no un asociado activo", () => {
    const { deps } = harness();
    const person = registerPerson(
      deps,
      {
        fullName: "Mario Gómez",
        dpi: "1234567890101",
        phone: "55559999",
        interest: "CREDIT",
        source: "ADVISOR",
        registeredByUserId: advisor.userId,
      },
      advisor,
    );
    expect(person.status).toBe("PROSPECT");
  });

  it("el Consejo no registra personas", () => {
    const { deps } = harness();
    expect(() =>
      registerPerson(
        deps,
        {
          fullName: "Mario Gómez",
          dpi: "1234567890101",
          phone: "55559999",
          interest: "CREDIT",
          source: "ADVISOR",
          registeredByUserId: council.userId,
        },
        council,
      ),
    ).toThrow(ForbiddenError);
  });

  it("enmascara el DPI en el listado", () => {
    const { deps } = harness();
    registerPerson(
      deps,
      {
        fullName: "Mario Gómez",
        dpi: "1234567890101",
        phone: "55559999",
        interest: "CREDIT",
        source: "ADVISOR",
        registeredByUserId: advisor.userId,
      },
      advisor,
    );
    const [row] = listPersons(deps, advisor);
    expect(row?.dpi).toBe("1234•••••0101");
    expect(row?.dpi).not.toContain("567890");
  });
});

describe("apertura de borrador", () => {
  it("no abre un borrador si la persona no existe", () => {
    const { deps } = harness();
    expect(() =>
      openDraftOperation(
        deps,
        {
          personId: "nadie",
          productType: "WORKING_CAPITAL",
          guaranteeType: "PERSONAL",
          requestedAmount: 25000,
          termMonths: 12,
          purpose: "Inventario de la tienda",
          hasGuarantor: false,
          createdBy: advisor.userId,
        },
        advisor,
      ),
    ).toThrow(NotFoundError);
  });

  it("no abre un borrador si la persona no tiene DPI", () => {
    const { deps } = harness();
    const landed = capturePublicProspect(deps, {
      fullName: "Ana López",
      phone: "55551234",
      interest: "CREDIT",
      source: "LANDING",
      consentContact: true,
    });
    expect(() =>
      openDraftOperation(
        deps,
        {
          personId: landed.id,
          productType: "WORKING_CAPITAL",
          guaranteeType: "PERSONAL",
          requestedAmount: 25000,
          termMonths: 12,
          purpose: "Inventario de la tienda",
          hasGuarantor: false,
          createdBy: advisor.userId,
        },
        advisor,
      ),
    ).toThrow(ValidationError);
  });

  it("el Consejo no abre borradores", () => {
    const { deps } = harness();
    expect(() =>
      openDraftOperation(
        deps,
        {
          personId: "p",
          productType: "WORKING_CAPITAL",
          guaranteeType: "PERSONAL",
          requestedAmount: 25000,
          termMonths: 12,
          purpose: "Inventario de la tienda",
          hasGuarantor: false,
          createdBy: council.userId,
        },
        council,
      ),
    ).toThrow(ForbiddenError);
  });
});

describe("expediente", () => {
  function draftReady() {
    const box = harness();
    const person = registerPerson(
      box.deps,
      {
        fullName: "Mario Gómez",
        dpi: "1234567890101",
        phone: "55559999",
        interest: "CREDIT",
        source: "ADVISOR",
        registeredByUserId: advisor.userId,
      },
      advisor,
    );
    const operation = openDraftOperation(
      box.deps,
      {
        personId: person.id,
        productType: "WORKING_CAPITAL",
        guaranteeType: "PERSONAL",
        requestedAmount: 25000,
        termMonths: 18,
        purpose: "Inventario de la tienda",
        hasGuarantor: false,
        createdBy: advisor.userId,
      },
      advisor,
    );
    return { ...box, operation };
  }

  it("un código de checklist inexistente da error y no toca el expediente", () => {
    const { deps, operation } = draftReady();
    const before = operation.checklist.length;
    expect(() =>
      updateOperationChecklist(deps, operation.id, { code: "NO_EXISTE", status: "UPLOADED" }, advisor),
    ).toThrow(ValidationError);
    expect(deps.operations.findById(operation.id)?.checklist).toHaveLength(before);
  });

  it("agregar fiador regenera el checklist sin perder lo confirmado", () => {
    const { deps, operation } = draftReady();
    updateOperationChecklist(
      deps,
      operation.id,
      { code: "DPI", status: "CONFIRMED", documentId: "doc-1" },
      advisor,
    );
    const withGuarantor = addGuarantor(
      deps,
      operation.id,
      { fullName: "Rosa Gómez", dpi: "3456-78901-0101" },
      advisor,
    );
    expect(withGuarantor.guarantor?.dpi).toBe("3456789010101");
    expect(withGuarantor.checklist.find((item) => item.code === "DPI")?.status).toBe("CONFIRMED");
    expect(withGuarantor.checklist.some((item) => item.code === "GUARANTOR_DPI")).toBe(true);
  });

  it("una revisión manual deja un hueco y las listas salen de la configuración", () => {
    const { deps, operation } = draftReady();
    const customDeps = { ...deps, requiredWatchlists: ["OFAC"] as const };
    const statusMissing = caseAssemblyStatus(customDeps, operation.id, advisor);
    expect(statusMissing.watchlistGaps).toEqual([{ source: "OFAC", reason: "MISSING" }]);
    expect(statusMissing.watchlistChecksCompleted).toBe(false);

    recordWatchlistCheck(
      customDeps,
      operation.id,
      {
        source: "OFAC",
        queryRef: "1234567890101",
        result: "PENDING_MANUAL_REVIEW",
        checkedByUserId: advisor.userId,
      },
      advisor,
    );
    const status = caseAssemblyStatus(customDeps, operation.id, advisor);
    expect(status.watchlistGaps).toEqual([
      { source: "OFAC", reason: "PENDING_MANUAL_REVIEW" },
    ]);
    expect(status.readyForReview).toBe(false);
  });

  it("un ingreso no numérico no se descarta: da error", () => {
    const { deps, operation } = draftReady();
    expect(() =>
      recordFinancialAssessment(
        deps,
        operation.id,
        {
          monthlySales: "abc",
          monthlyIncome: 1000,
          monthlyExpenses: 100,
          existingDebtPayment: 0,
        },
        advisor,
      ),
    ).toThrow(ValidationError);
  });
});

describe("bitácora", () => {
  it("cada paso deja un registro", () => {
    const { deps, audit } = harness();
    const person = registerPerson(
      deps,
      {
        fullName: "Mario Gómez",
        dpi: "1234567890101",
        phone: "55559999",
        interest: "CREDIT",
        source: "ADVISOR",
        registeredByUserId: advisor.userId,
      },
      advisor,
    );
    openDraftOperation(
      deps,
      {
        personId: person.id,
        productType: "MICROCREDIT",
        guaranteeType: "PERSONAL",
        requestedAmount: 8000,
        termMonths: 6,
        purpose: "Capital de trabajo semanal",
        hasGuarantor: false,
        createdBy: advisor.userId,
      },
      advisor,
    );
    expect(audit.map((entry) => entry.action)).toEqual([
      "person.register",
      "operation.open-draft",
    ]);
  });
});
