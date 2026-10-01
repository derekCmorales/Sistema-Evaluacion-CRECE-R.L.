import "reflect-metadata";
import { Module, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DomainExceptionFilter } from "../../common/domain-exception.filter";
import { ACTOR_OFFICES_HEADER, ACTOR_USER_HEADER } from "../../common/current-actor";
import { OperationsModule } from "../operations/operations.module";
import { PersonsModule } from "../persons/persons.module";
import { ProspectsModule } from "../prospects/prospects.module";
import { CaptureModule } from "./capture.module";

@Module({ imports: [CaptureModule, ProspectsModule, PersonsModule, OperationsModule] })
class CaptureTestModule {}

const mario = { [ACTOR_USER_HEADER]: "user-mario", [ACTOR_OFFICES_HEADER]: "BRANCH_HEAD,ADVISOR" };
const julio = { [ACTOR_USER_HEADER]: "user-julio", [ACTOR_OFFICES_HEADER]: "COUNCIL_MEMBER" };

const donMarco = { fullName: "Marco Antonio López", dpi: "2345 67890 0101", phone: "55551234", interest: "CREDIT" };

describe("HTTP de captación (fases 1–3)", () => {
  let app: INestApplication;
  let base: string;

  beforeEach(async () => {
    process.env.CRECE_DEMO_SEED = "false";
    app = await NestFactory.create(CaptureTestModule, { logger: false });
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.listen(0, "127.0.0.1");
    base = await app.getUrl();
  });

  afterEach(async () => {
    await app.close();
  });

  function call(method: string, path: string, body?: unknown, headers: Record<string, string> = mario) {
    return fetch(`${base}${path}`, {
      method,
      headers: { "content-type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async function registerDonMarco(): Promise<string> {
    const res = await call("POST", "/persons", donMarco);
    expect(res.status).toBe(201);
    return (await res.json()).id;
  }

  function draft(personId: string) {
    return {
      personId,
      productType: "WORKING_CAPITAL",
      guaranteeType: "PERSONAL",
      requestedAmount: 40000,
      termMonths: 24,
      purpose: "Inventario de ferretería",
      hasGuarantor: false,
    };
  }

  it("el prospecto de la landing aparece en el directorio de la agencia (un solo repositorio)", async () => {
    const res = await call(
      "POST",
      "/public/prospects",
      { fullName: "Lucía López", phone: "55551234", interest: "SAVINGS", consentContact: true },
      {},
    );
    expect(res.status).toBe(201);
    const { prospectId, status } = await res.json();
    expect(status).toBe("PROSPECT");

    const directory = await (await call("GET", "/persons")).json();
    expect(directory.items.map((p: { id: string }) => p.id)).toEqual([prospectId]);
    expect(await (await call("GET", "/operations")).json()).toEqual({ items: [] });
  });

  it("registrar dos veces el mismo DPI responde 409 con la persona existente", async () => {
    const id = await registerDonMarco();
    const res = await call("POST", "/persons", { ...donMarco, dpi: "2345678900101" });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: "DUPLICATE_PERSON", existingPersonId: id });
  });

  it("el registro en agencia nace PROSPECT y el directorio no expone el DPI", async () => {
    const id = await registerDonMarco();
    const profile = await (await call("GET", `/persons/${id}`)).json();
    expect(profile.person.status).toBe("PROSPECT");
    expect(profile.person.registeredByUserId).toBe("user-mario");
    const directory = await (await call("GET", "/persons")).text();
    expect(directory).not.toContain("2345678900101");
  });

  it("la búsqueda por DPI va en el cuerpo, no en la URL", async () => {
    const id = await registerDonMarco();
    const res = await call("POST", "/persons/lookup", { dpi: "2345-67890-0101" });
    expect(res.status).toBe(200);
    expect((await res.json()).match.id).toBe(id);
  });

  it("abrir una solicitud para una persona que no existe es 404 y no deja borrador huérfano", async () => {
    const res = await call("POST", "/operations", draft("no-existe"));
    expect(res.status).toBe(404);
    expect(await (await call("GET", "/operations")).json()).toEqual({ items: [] });
  });

  it("expediente: código de checklist inexistente es 400; uno válido cambia el estado", async () => {
    const opened = await (await call("POST", "/operations", draft(await registerDonMarco()))).json();
    const id = opened.operation.id;
    expect(opened.operation.state).toBe("DRAFT");

    const bad = await call("PATCH", `/operations/${id}/checklist`, { code: "NO_EXISTE", status: "UPLOADED" });
    expect(bad.status).toBe(400);

    const ok = await call("PATCH", `/operations/${id}/checklist`, { code: "DPI", status: "CONFIRMED" });
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.operation.checklist.find((i: { code: string }) => i.code === "DPI").status).toBe("CONFIRMED");
  });

  it("fiador y listas de control se reflejan en el estado de armado", async () => {
    const id = (await (await call("POST", "/operations", draft(await registerDonMarco()))).json()).operation.id;

    const guarantor = await (await call("PUT", `/operations/${id}/guarantor`, { fullName: "Lucía López" })).json();
    expect(guarantor.operation.checklist.map((i: { code: string }) => i.code)).toContain("GUARANTOR_BUREAU");
    expect(guarantor.assembly.gaps).toContain("GUARANTOR_INCOMPLETE");

    const match = await call("POST", `/operations/${id}/watchlist`, {
      source: "ONU",
      queryRef: "2345678900101",
      result: "MATCH_FOUND",
      notes: "Homónimo; falta comparar fecha de nacimiento",
    });
    expect(match.status).toBe(201);
    expect((await match.json()).assembly.gaps).toContain("WATCHLIST_MATCH");

    const assemble = await call("POST", `/operations/${id}/assemble`);
    expect(assemble.status).toBe(409);

    const history = await (await call("GET", `/operations/${id}/history`)).json();
    expect(history.items.map((e: { action: string }) => e.action)).toEqual([
      "OPERATION_OPENED",
      "GUARANTOR_SET",
      "WATCHLIST_CHECKED",
    ]);
  });

  it("sin sesión responde 401; el Consejo consulta pero no captura (403)", async () => {
    expect((await call("GET", "/persons", undefined, {})).status).toBe(401);
    expect((await call("GET", "/persons", undefined, julio)).status).toBe(200);
    expect((await call("POST", "/persons", donMarco, julio)).status).toBe(403);
  });
});
