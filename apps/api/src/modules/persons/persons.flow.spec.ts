import { describe, expect, it } from "vitest";
import { toUserId } from "@crece/shared";
import { capturePublicProspect, openDraftOperation, registerPerson } from "@crece/application";
import { InMemoryPersonStore } from "./in-memory-person.store";
import { InMemoryOperationStore } from "../operations/in-memory-operation.store";
import { InMemoryAuditLog } from "../memory/in-memory-audit-log";
import { intakeDeps } from "../memory/intake-deps";

describe("landing y agencia comparten el repositorio", () => {
  it("el prospecto de la landing se completa con su DPI y luego sí abre borrador", () => {
    const persons = new InMemoryPersonStore();
    const operations = new InMemoryOperationStore();
    const audit = new InMemoryAuditLog();
    const deps = intakeDeps(persons, operations, audit);
    const actor = { userId: toUserId("user-asesor"), offices: ["ADVISOR"] as const };

    const landed = capturePublicProspect(deps, {
      fullName: "Ana López",
      phone: "55551234",
      interest: "CREDIT",
      source: "LANDING",
      consentContact: true,
    });

    const completed = registerPerson(
      deps,
      {
        fullName: "Ana López",
        dpi: "9998887770101",
        phone: "55551234",
        interest: "CREDIT",
        source: "ADVISOR",
        registeredByUserId: actor.userId,
        existingPersonId: landed.id,
      },
      actor,
    );

    expect(completed.id).toBe(landed.id);
    expect(persons.list().filter((person) => person.fullName === "Ana López")).toHaveLength(1);

    const draft = openDraftOperation(
      deps,
      {
        personId: completed.id,
        productType: "WORKING_CAPITAL",
        guaranteeType: "PERSONAL",
        requestedAmount: 12000,
        termMonths: 12,
        purpose: "Compra de mercadería",
        hasGuarantor: false,
        createdBy: actor.userId,
      },
      actor,
    );
    expect(draft.personId).toBe(landed.id);
    expect(draft.state).toBe("DRAFT");
    expect(audit.list().length).toBeGreaterThanOrEqual(3);
  });
});
