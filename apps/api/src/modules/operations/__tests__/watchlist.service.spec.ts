import { describe, it, expect, beforeEach } from "vitest";
import { NotFoundError, ValidationError, type WatchlistCheckSummaryDto } from "@crece/shared";
import { InMemoryOperationStore } from "../in-memory-operation.store";
import { WatchlistService } from "../services/watchlist.service";

describe("WatchlistService", () => {
  let store: InMemoryOperationStore;
  let service: WatchlistService;

  beforeEach(() => {
    store = new InMemoryOperationStore();
    service = new WatchlistService(store);
  });

  const MOCK_OP_ID = "mock-op-102";

  it("registra una consulta OFAC con resultado CLEAR", () => {
    const result = service.execute(MOCK_OP_ID, {
      source: "OFAC",
      queryRef: "1234567890101",
      result: "CLEAR",
      checkedByUserId: "user-advisor-ana",
      notes: "Sin coincidencias en SDN",
    });

    expect(result.operationId).toBe(MOCK_OP_ID);
    expect(result.watchlistChecks).toBeDefined();
    expect(result.watchlistChecks!.length).toBeGreaterThanOrEqual(1);

    const ofacCheck = result.watchlistChecks!.find((c: WatchlistCheckSummaryDto) => c.source === "OFAC");
    expect(ofacCheck?.result).toBe("CLEAR");
    expect(ofacCheck?.checkedByUserId).toBe("user-advisor-ana");
    expect(ofacCheck?.notes).toBe("Sin coincidencias en SDN");
  });

  it("registra consulta ONU con resultado MATCH_FOUND", () => {
    const result = service.execute(MOCK_OP_ID, {
      source: "ONU",
      queryRef: "1234567890101",
      result: "MATCH_FOUND",
      checkedByUserId: "user-advisor-ana",
    });

    const onuCheck = result.watchlistChecks!.find((c: WatchlistCheckSummaryDto) => c.source === "ONU");
    expect(onuCheck?.result).toBe("MATCH_FOUND");
  });

  it("registra consulta GUATECOMPRAS con PENDING_MANUAL_REVIEW", () => {
    const result = service.execute(MOCK_OP_ID, {
      source: "GUATECOMPRAS",
      queryRef: "1234567890101",
      result: "PENDING_MANUAL_REVIEW",
      checkedByUserId: "user-advisor-ana",
    });

    const gcCheck = result.watchlistChecks!.find((c: WatchlistCheckSummaryDto) => c.source === "GUATECOMPRAS");
    expect(gcCheck?.result).toBe("PENDING_MANUAL_REVIEW");
  });

  it("cada entrada tiene un id único y checkedAt", () => {
    const result = service.execute(MOCK_OP_ID, {
      source: "OFAC",
      queryRef: "1234567890101",
      result: "CLEAR",
      checkedByUserId: "user-advisor-ana",
    });

    const lastCheck = result.watchlistChecks![result.watchlistChecks!.length - 1];
    expect(lastCheck.id).toBeDefined();
    expect(lastCheck.id.length).toBeGreaterThan(0);
    expect(lastCheck.checkedAt).toBeDefined();
  });

  it("rechaza fuente de consulta inválida", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        source: "FBI",
        queryRef: "123",
        result: "CLEAR",
        checkedByUserId: "user-1",
      }),
    ).toThrow(ValidationError);
  });

  it("rechaza resultado de verificación inválido", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        source: "OFAC",
        queryRef: "123",
        result: "UNKNOWN",
        checkedByUserId: "user-1",
      }),
    ).toThrow(ValidationError);
  });

  it("exige checkedByUserId obligatorio", () => {
    expect(() =>
      service.execute(MOCK_OP_ID, {
        source: "OFAC",
        queryRef: "123",
        result: "CLEAR",
        checkedByUserId: "",
      }),
    ).toThrow(ValidationError);
  });

  it("lanza NotFoundException si la operación no existe", () => {
    expect(() =>
      service.execute("non-existent-id", {
        source: "OFAC",
        queryRef: "123",
        result: "CLEAR",
        checkedByUserId: "user-1",
      }),
    ).toThrow(NotFoundError);
  });
});
