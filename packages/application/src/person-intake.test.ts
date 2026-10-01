import { describe, expect, it } from "vitest";
import { DuplicatePersonError, ForbiddenError, LANDING_ACTOR_ID, NotFoundError } from "@crece/shared";
import {
  assignPersonDpi,
  findPersonByDpi,
  getPersonProfile,
  listPersons,
  registerLandingProspect,
  registerPerson,
} from "./person-intake";
import { openDraftOperation } from "./case-file";
import { advisor, councilMember, fakeCaptureDeps } from "./test-support/capture-fakes";

const donMarco = {
  fullName: "Marco Antonio López",
  dpi: "2345 67890 0101",
  phone: "55551234",
  interest: "CREDIT",
};

const landingForm = {
  fullName: "Marco Antonio López",
  phone: "55551234",
  interest: "CREDIT",
  consentContact: true,
  amountHint: 40000,
  message: "Quiero ampliar mi ferretería",
};

describe("registro del solicitante (fase 1)", () => {
  it("el asesor registra una persona PROSPECT y queda quién la registró", async () => {
    const { deps, audit } = fakeCaptureDeps();
    const person = await registerPerson(deps, advisor, donMarco);
    expect(person.status).toBe("PROSPECT");
    expect(person.source).toBe("ADVISOR");
    expect(person.registeredByUserId).toBe(advisor.userId);
    expect(audit.map((e) => e.action)).toEqual(["PERSON_REGISTERED"]);
  });

  it("no duplica: el mismo DPI con otro formato devuelve la persona existente", async () => {
    const { deps } = fakeCaptureDeps();
    const first = await registerPerson(deps, advisor, donMarco);
    const second = registerPerson(deps, advisor, { ...donMarco, dpi: "2345-67890-0101" });
    await expect(second).rejects.toBeInstanceOf(DuplicatePersonError);
    await expect(second).rejects.toMatchObject({ existingPersonId: first.id });
  });

  it("la landing y la agencia escriben en el mismo repositorio de personas", async () => {
    const { deps } = fakeCaptureDeps();
    const prospect = await registerLandingProspect(deps, landingForm);
    const directory = await listPersons(deps, advisor);
    expect(directory.map((p) => p.id)).toEqual([prospect.id]);
    expect(directory[0].source).toBe("LANDING");
  });

  it("la landing crea solo Person PROSPECT, sin operación, con su nota y consentimiento", async () => {
    const { deps, audit } = fakeCaptureDeps();
    const prospect = await registerLandingProspect(deps, landingForm);
    expect(prospect.status).toBe("PROSPECT");
    expect(prospect.intakeNote).toEqual({ amountHint: 40000, message: "Quiero ampliar mi ferretería" });
    expect(prospect.contactConsentAt).toBeDefined();
    expect(await deps.operations.findAll()).toEqual([]);
    expect(audit[0]).toMatchObject({ action: "PROSPECT_CREATED", byUserId: LANDING_ACTOR_ID });
  });

  it("completar el DPI de un prospecto de la landing no crea una segunda persona", async () => {
    const { deps } = fakeCaptureDeps();
    const prospect = await registerLandingProspect(deps, landingForm);
    const updated = await assignPersonDpi(deps, advisor, prospect.id, { dpi: donMarco.dpi });
    expect(updated.id).toBe(prospect.id);
    expect(updated.dpi).toBe("2345678900101");
    expect(await deps.persons.findAll()).toHaveLength(1);
  });

  it("no asigna a un prospecto un DPI que ya es de otra persona", async () => {
    const { deps } = fakeCaptureDeps();
    await registerPerson(deps, advisor, donMarco);
    const prospect = await registerLandingProspect(deps, landingForm);
    await expect(assignPersonDpi(deps, advisor, prospect.id, { dpi: donMarco.dpi })).rejects.toBeInstanceOf(
      DuplicatePersonError,
    );
  });

  it("el directorio enmascara el DPI; el perfil lo muestra completo", async () => {
    const { deps } = fakeCaptureDeps();
    const person = await registerPerson(deps, advisor, donMarco);
    const [row] = await listPersons(deps, advisor);
    expect(row.dpiMasked).toBe("•••• ••••• 0101");
    expect(JSON.stringify(row)).not.toContain("2345678900101");
    expect((await getPersonProfile(deps, advisor, person.id)).person.dpi).toBe("2345678900101");
  });

  it("la búsqueda por DPI encuentra a la persona o devuelve null", async () => {
    const { deps } = fakeCaptureDeps();
    const person = await registerPerson(deps, advisor, donMarco);
    expect((await findPersonByDpi(deps, advisor, { dpi: "2345678900101" }))?.id).toBe(person.id);
    expect(await findPersonByDpi(deps, advisor, { dpi: "1111111111111" })).toBeNull();
  });

  it("el perfil trae el historial de solicitudes de la persona", async () => {
    const { deps } = fakeCaptureDeps();
    const person = await registerPerson(deps, advisor, donMarco);
    await openDraftOperation(deps, advisor, {
      personId: person.id,
      productType: "WORKING_CAPITAL",
      guaranteeType: "PERSONAL",
      requestedAmount: 40000,
      termMonths: 24,
      purpose: "Inventario de ferretería",
      hasGuarantor: false,
    });
    const profile = await getPersonProfile(deps, advisor, person.id);
    expect(profile.operations).toHaveLength(1);
    expect(profile.operations[0].state).toBe("DRAFT");
    expect((await listPersons(deps, advisor))[0].operationsCount).toBe(1);
  });

  it("un perfil inexistente es NotFound", async () => {
    const { deps } = fakeCaptureDeps();
    await expect(getPersonProfile(deps, advisor, "nadie")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("consultar ≠ operar: el Consejo consulta el directorio pero no registra", async () => {
    const { deps } = fakeCaptureDeps();
    await expect(registerPerson(deps, councilMember, donMarco)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listPersons(deps, councilMember)).resolves.toEqual([]);
  });
});

describe("directorio por origen", () => {
  it("filtra los prospectos que llegaron por la landing", async () => {
    const { deps } = fakeCaptureDeps();
    await registerPerson(deps, advisor, donMarco);
    const prospect = await registerLandingProspect(deps, landingForm);
    const landing = await listPersons(deps, advisor, { source: "LANDING" });
    expect(landing.map((p) => p.id)).toEqual([prospect.id]);
  });
});
