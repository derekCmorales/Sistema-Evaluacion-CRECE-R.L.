import { describe, expect, it } from "vitest";
import { createCaptureDeps } from "../../modules/capture/capture.module";
import { seedDemoData } from "./demo-seed";

describe("semilla de demostración", () => {
  it("siembra una persona con borrador y un prospecto de landing, con DPI sintético", async () => {
    const deps = createCaptureDeps();
    await seedDemoData(deps);
    const persons = await deps.persons.findAll();
    expect(persons.map((p) => p.source).sort()).toEqual(["ADVISOR", "LANDING"]);
    expect(persons.every((p) => p.status === "PROSPECT")).toBe(true);
    expect(persons.filter((p) => p.dpi).every((p) => p.dpi!.startsWith("0000"))).toBe(true);
    expect(await deps.operations.findAll()).toHaveLength(1);
  });
});
