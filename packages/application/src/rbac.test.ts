import { describe, expect, it } from "vitest";
import { hasPermission } from "./rbac";

describe("RBAC consultar vs operar", () => {
  it("el miembro del Consejo no origina ni edita", () => {
    expect(hasPermission(["COUNCIL_MEMBER"], "person:create")).toBe(false);
    expect(hasPermission(["COUNCIL_MEMBER"], "operation:create")).toBe(false);
    expect(hasPermission(["COUNCIL_MEMBER"], "operation:edit")).toBe(false);
    expect(hasPermission(["COUNCIL_MEMBER"], "operation:submit")).toBe(false);
    expect(hasPermission(["COUNCIL_MEMBER"], "operation:vote-council")).toBe(true);
    expect(hasPermission(["COUNCIL_MEMBER"], "operation:consult")).toBe(true);
  });

  it("el autorizador delegado firma menores y no captura", () => {
    expect(hasPermission(["DELEGATED_AUTHORIZER"], "person:create")).toBe(false);
    expect(hasPermission(["DELEGATED_AUTHORIZER"], "operation:create")).toBe(false);
    expect(hasPermission(["DELEGATED_AUTHORIZER"], "operation:sign-below")).toBe(
      true,
    );
    expect(hasPermission(["DELEGATED_AUTHORIZER"], "operation:verdict")).toBe(true);
  });

  it("jefatura origina y firma menores", () => {
    expect(hasPermission(["BRANCH_HEAD"], "person:create")).toBe(true);
    expect(hasPermission(["BRANCH_HEAD"], "operation:create")).toBe(true);
    expect(hasPermission(["BRANCH_HEAD"], "operation:sign-below")).toBe(true);
  });
});
